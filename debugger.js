/**
 * Interactive Debugging Environment (Breakpoints, Step Over, Step Into, Call Stack, Watches, Variables)
 */

export class DebuggerManager {
    constructor(options = {}) {
        this.editorManager = options.editorManager;
        this.onStateChange = options.onStateChange || (() => {});
        this.onOutput = options.onOutput || (() => {});

        this.isRunning = false;
        this.isPaused = false;
        this.currentStep = 0;
        this.traceSteps = [];
        this.watchExpressions = new Set(['x', 'y', 'i', 'count', 'result']);
        this.breakpoints = new Set();
        this.currentFrame = null;
        this.activeLanguage = 'python';

        this.initUI();
    }

    setBreakpoints(breakpoints) {
        this.breakpoints = new Set(breakpoints);
        this.renderBreakpointsList();
    }

    addWatch(expression) {
        if (!expression || !expression.trim()) return;
        this.watchExpressions.add(expression.trim());
        this.renderWatchList();
    }

    removeWatch(expression) {
        this.watchExpressions.delete(expression);
        this.renderWatchList();
    }

    initUI() {
        // Find UI elements
        this.btnStart = document.getElementById('debug-btn-start');
        this.btnPause = document.getElementById('debug-btn-pause');
        this.btnStepOver = document.getElementById('debug-btn-step-over');
        this.btnStepInto = document.getElementById('debug-btn-step-into');
        this.btnStepOut = document.getElementById('debug-btn-step-out');
        this.btnRestart = document.getElementById('debug-btn-restart');
        this.btnStop = document.getElementById('debug-btn-stop');

        this.variablesListEl = document.getElementById('debug-variables-list');
        this.watchListEl = document.getElementById('debug-watch-list');
        this.callStackEl = document.getElementById('debug-callstack-list');
        this.breakpointsListEl = document.getElementById('debug-breakpoints-list');
        this.watchInput = document.getElementById('debug-watch-input');
        this.addWatchBtn = document.getElementById('debug-add-watch-btn');

        if (this.addWatchBtn && this.watchInput) {
            this.addWatchBtn.addEventListener('click', () => {
                this.addWatch(this.watchInput.value);
                this.watchInput.value = '';
            });
            this.watchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.addWatch(this.watchInput.value);
                    this.watchInput.value = '';
                }
            });
        }

        // Bind control buttons
        this.btnStart?.addEventListener('click', () => this.startDebugging());
        this.btnPause?.addEventListener('click', () => this.pause());
        this.btnStepOver?.addEventListener('click', () => this.stepOver());
        this.btnStepInto?.addEventListener('click', () => this.stepInto());
        this.btnStepOut?.addEventListener('click', () => this.stepOut());
        this.btnRestart?.addEventListener('click', () => this.restart());
        this.btnStop?.addEventListener('click', () => this.stop());

        this.renderWatchList();
        this.renderBreakpointsList();
    }

    /**
     * Start debugging session
     */
    async startDebugging() {
        if (this.isRunning && this.isPaused) {
            this.continueExecution();
            return;
        }

        const activeFile = window.App?.workspace?.activeFile || 'main.py';
        const fileData = window.App?.workspace?.getFile(activeFile);
        if (!fileData) return;

        const code = this.editorManager.getValue();
        const lang = fileData.language;
        this.activeLanguage = lang;

        // Language capability check
        if (lang === 'c' || lang === 'cpp' || lang === 'java') {
            const limitationMsg = `[Debugger Info] Note on ${lang.toUpperCase()}:\nRemote cloud Judge0 compilers execute C, C++, and Java programs in non-interactive batch mode. To trace code line-by-line, inspect memory pointers, and watch stack frames interactively, switch to the 'Visualize My Code' tab!`;
            this.onOutput(limitationMsg, 'info');
        }

        // Generate execution steps / trace
        this.traceSteps = this.generateExecutionTrace(code, lang, activeFile);

        if (this.traceSteps.length === 0) {
            this.onOutput(`[Debugger] No executable statements found in ${activeFile}.`, 'warn');
            return;
        }

        this.isRunning = true;
        this.isPaused = true;
        this.currentStep = 0;

        // If breakpoints are set, jump to first hit breakpoint
        let startStep = 0;
        for (let i = 0; i < this.traceSteps.length; i++) {
            const step = this.traceSteps[i];
            const bpKey = `${activeFile}:${step.lineNumber}`;
            if (this.breakpoints.has(bpKey)) {
                startStep = i;
                break;
            }
        }

        this.currentStep = startStep;
        this.applyCurrentStep();
        this.updateControlsUI();
        this.onOutput(`[Debugger] Debugging session started for ${activeFile}. Paused at line ${this.traceSteps[this.currentStep].lineNumber}.`, 'info');
    }

    /**
     * Generate step-by-step trace of variables and lines
     */
    generateExecutionTrace(code, language, filename) {
        const lines = code.split('\n');
        const steps = [];
        const currentScope = {};
        const callStack = [{ functionName: '<global>', filename, line: 1 }];

        for (let idx = 0; idx < lines.length; idx++) {
            const lineNum = idx + 1;
            const line = lines[idx].trim();

            if (!line || line.startsWith('//') || line.startsWith('#') || line.startsWith('/*')) {
                continue;
            }

            // Detect assignments / modifications
            let changedVar = null;
            let assignmentMatch = line.match(/(?:(?:let|const|var|int|double|float|char|auto)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+)/);
            if (assignmentMatch) {
                const varName = assignmentMatch[1];
                const rawVal = assignmentMatch[2].trim();
                let evaluatedVal = rawVal;
                try {
                    // Try evaluating arithmetic or literals
                    evaluatedVal = Function(...Object.keys(currentScope), `try { return ${rawVal}; } catch(e) { return "${rawVal}"; }`)(...Object.values(currentScope));
                } catch (e) {
                    evaluatedVal = rawVal;
                }
                currentScope[varName] = evaluatedVal;
                changedVar = { name: varName, value: evaluatedVal };
            }

            // Function call detection
            const funcCallMatch = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);
            const isPrintfOrLog = funcCallMatch && (funcCallMatch[1] === 'printf' || funcCallMatch[1] === 'print' || funcCallMatch[1] === 'println' || funcCallMatch[1] === 'log');

            const currentStack = [...callStack];
            currentStack[currentStack.length - 1].line = lineNum;

            if (funcCallMatch && !isPrintfOrLog && !line.includes('main') && !line.includes('function') && !line.includes('def ')) {
                currentStack.push({
                    functionName: funcCallMatch[1] + '()',
                    filename,
                    line: lineNum
                });
            }

            steps.push({
                stepIndex: steps.length,
                lineNumber: lineNum,
                codeLine: line,
                scope: JSON.parse(JSON.stringify(currentScope)),
                callStack: currentStack,
                changedVar
            });
        }

        return steps;
    }

    applyCurrentStep() {
        if (this.currentStep < 0 || this.currentStep >= this.traceSteps.length) {
            this.stop();
            return;
        }

        const step = this.traceSteps[this.currentStep];
        this.editorManager.highlightDebugLine(step.lineNumber);

        // Render Scope Variables
        this.renderVariables(step.scope);

        // Render Call Stack
        this.renderCallStack(step.callStack);

        // Update Watch Expressions
        this.renderWatchList(step.scope);
    }

    stepOver() {
        if (!this.isRunning) return;
        if (this.currentStep < this.traceSteps.length - 1) {
            this.currentStep++;
            this.applyCurrentStep();
        } else {
            this.onOutput('[Debugger] Program reached end of execution.', 'info');
            this.stop();
        }
    }

    stepInto() {
        if (!this.isRunning) return;
        // Step to next instruction
        this.stepOver();
    }

    stepOut() {
        if (!this.isRunning) return;
        // If inside function frame, jump out
        const currentStackDepth = this.traceSteps[this.currentStep]?.callStack.length || 1;
        let targetStep = this.currentStep + 1;
        while (targetStep < this.traceSteps.length) {
            if (this.traceSteps[targetStep].callStack.length < currentStackDepth) {
                break;
            }
            targetStep++;
        }
        if (targetStep < this.traceSteps.length) {
            this.currentStep = targetStep;
            this.applyCurrentStep();
        } else {
            this.stepOver();
        }
    }

    continueExecution() {
        if (!this.isRunning) return;
        const activeFile = window.App?.workspace?.activeFile || '';
        let nextBreakpointStep = -1;

        for (let i = this.currentStep + 1; i < this.traceSteps.length; i++) {
            const step = this.traceSteps[i];
            const bpKey = `${activeFile}:${step.lineNumber}`;
            if (this.breakpoints.has(bpKey)) {
                nextBreakpointStep = i;
                break;
            }
        }

        if (nextBreakpointStep !== -1) {
            this.currentStep = nextBreakpointStep;
            this.applyCurrentStep();
            this.onOutput(`[Debugger] Hit breakpoint at line ${this.traceSteps[this.currentStep].lineNumber}.`, 'info');
        } else {
            // Run to end
            this.currentStep = this.traceSteps.length - 1;
            this.applyCurrentStep();
            this.onOutput('[Debugger] Program finished execution without hitting more breakpoints.', 'info');
            setTimeout(() => this.stop(), 500);
        }
    }

    pause() {
        this.isPaused = true;
        this.updateControlsUI();
    }

    restart() {
        this.stop();
        setTimeout(() => this.startDebugging(), 100);
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
        this.editorManager.clearDebugHighlight();
        this.updateControlsUI();
        if (this.callStackEl) this.callStackEl.innerHTML = '<div class="debug-empty">Not debugging</div>';
    }

    updateControlsUI() {
        if (this.btnStart) {
            this.btnStart.innerHTML = this.isRunning ? '<span>▶ Continue</span>' : '<span>▶ Start</span>';
            this.btnStart.title = this.isRunning ? 'Continue Execution (F5)' : 'Start Debugging (F5)';
        }
        if (this.btnStepOver) this.btnStepOver.disabled = !this.isRunning;
        if (this.btnStepInto) this.btnStepInto.disabled = !this.isRunning;
        if (this.btnStepOut) this.btnStepOut.disabled = !this.isRunning;
        if (this.btnPause) this.btnPause.disabled = !this.isRunning;
        if (this.btnStop) this.btnStop.disabled = !this.isRunning;
    }

    renderVariables(scope = {}) {
        if (!this.variablesListEl) return;
        const keys = Object.keys(scope);
        if (keys.length === 0) {
            this.variablesListEl.innerHTML = '<div class="debug-empty">No local variables</div>';
            return;
        }

        let html = '<table class="debug-table"><thead><tr><th>Name</th><th>Value</th><th>Type</th></tr></thead><tbody>';
        for (const key of keys) {
            const val = scope[key];
            const type = Array.isArray(val) ? 'Array' : typeof val;
            const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
            html += `<tr>
                <td class="var-name">${key}</td>
                <td class="var-val" title="${displayVal}">${displayVal}</td>
                <td class="var-type">${type}</td>
            </tr>`;
        }
        html += '</tbody></table>';
        this.variablesListEl.innerHTML = html;
    }

    renderWatchList(scope = {}) {
        if (!this.watchListEl) return;
        if (this.watchExpressions.size === 0) {
            this.watchListEl.innerHTML = '<div class="debug-empty">No watch expressions</div>';
            return;
        }

        let html = '<div class="watch-items">';
        for (const expr of this.watchExpressions) {
            let evalVal = '<not available>';
            try {
                if (scope[expr] !== undefined) {
                    evalVal = JSON.stringify(scope[expr]);
                } else {
                    const res = Function(...Object.keys(scope), `return ${expr};`)(...Object.values(scope));
                    evalVal = JSON.stringify(res);
                }
            } catch (e) {
                evalVal = '<undefined>';
            }

            html += `<div class="watch-row">
                <span class="watch-expr">${expr}:</span>
                <span class="watch-val">${evalVal}</span>
                <button class="watch-del-btn" data-expr="${expr}" title="Remove Watch">×</button>
            </div>`;
        }
        html += '</div>';
        this.watchListEl.innerHTML = html;

        this.watchListEl.querySelectorAll('.watch-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.removeWatch(btn.getAttribute('data-expr'));
            });
        });
    }

    renderCallStack(stack = []) {
        if (!this.callStackEl) return;
        if (stack.length === 0) {
            this.callStackEl.innerHTML = '<div class="debug-empty">Stack empty</div>';
            return;
        }

        let html = '<div class="callstack-list">';
        // Render top of stack first
        for (let i = stack.length - 1; i >= 0; i--) {
            const frame = stack[i];
            const isTop = i === stack.length - 1;
            html += `<div class="callstack-frame ${isTop ? 'active-frame' : ''}">
                <span class="frame-func">${frame.functionName}</span>
                <span class="frame-loc">${frame.filename}:${frame.line}</span>
            </div>`;
        }
        html += '</div>';
        this.callStackEl.innerHTML = html;
    }

    renderBreakpointsList() {
        if (!this.breakpointsListEl) return;
        if (this.breakpoints.size === 0) {
            this.breakpointsListEl.innerHTML = '<div class="debug-empty">No breakpoints set. Click the editor gutter to add.</div>';
            return;
        }

        let html = '<div class="bp-list">';
        for (const bp of this.breakpoints) {
            const [file, line] = bp.split(':');
            html += `<div class="bp-row">
                <span class="bp-icon">●</span>
                <span class="bp-file">${file}</span>
                <span class="bp-line">line ${line}</span>
                <button class="bp-del-btn" data-bp="${bp}" title="Remove breakpoint">×</button>
            </div>`;
        }
        html += '</div>';
        this.breakpointsListEl.innerHTML = html;

        this.breakpointsListEl.querySelectorAll('.bp-del-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const [f, l] = btn.getAttribute('data-bp').split(':');
                this.editorManager.toggleBreakpoint(f, parseInt(l, 10));
            });
        });
    }
}
