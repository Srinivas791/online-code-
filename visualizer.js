/**
 * Visual Programming Experience & "Visualize My Code" Component
 * Renders interactive Memory, Pointer, Stack/Heap, Recursion Tree, Linked List, and Sorting diagrams.
 */
import { CodeTracer } from './code-tracer.js';
import { VISUALIZER_DEMOS } from './templates.js';

export class VisualizerManager {
    constructor(options = {}) {
        this.editorManager = options.editorManager;
        this.tracer = new CodeTracer();
        
        this.steps = [];
        this.currentStepIndex = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.playbackSpeed = 1000; // 1s per step

        this.initUI();
    }

    initUI() {
        this.container = document.getElementById('visualizer-stage');
        this.btnPlay = document.getElementById('vis-btn-play');
        this.btnPrev = document.getElementById('vis-btn-prev');
        this.btnNext = document.getElementById('vis-btn-next');
        this.btnReset = document.getElementById('vis-btn-reset');
        this.speedSlider = document.getElementById('vis-speed-slider');
        this.stepIndicator = document.getElementById('vis-step-indicator');
        this.explanationEl = document.getElementById('vis-explanation');
        this.demoSelector = document.getElementById('vis-demo-selector');

        this.btnPlay?.addEventListener('click', () => this.togglePlay());
        this.btnPrev?.addEventListener('click', () => this.prevStep());
        this.btnNext?.addEventListener('click', () => this.nextStep());
        this.btnReset?.addEventListener('click', () => this.reset());

        this.speedSlider?.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.playbackSpeed = Math.round(1000 / val);
            if (this.isPlaying) {
                this.pause();
                this.play();
            }
        });

        this.demoSelector?.addEventListener('change', (e) => {
            const demoKey = e.target.value;
            if (demoKey && VISUALIZER_DEMOS[demoKey]) {
                this.loadDemo(demoKey);
            }
        });
    }

    /**
     * Start "Visualize My Code" for current active editor content
     */
    visualizeCurrentCode() {
        const activeFile = window.App?.workspace?.activeFile || 'script.py';
        const fileData = window.App?.workspace?.getFile(activeFile);
        const code = this.editorManager.getValue();
        const lang = fileData ? fileData.language : 'python';

        this.steps = this.tracer.trace(code, lang);
        this.currentStepIndex = 0;
        this.renderCurrentStep();
        this.updateControls();
    }

    loadDemo(demoKey) {
        const demo = VISUALIZER_DEMOS[demoKey];
        if (!demo) return;

        // Switch to matching file template if exists
        if (demo.language && window.App?.workspace) {
            const extMap = { c: 'main.c', cpp: 'main.cpp', java: 'Main.java', python: 'script.py' };
            const targetFile = extMap[demo.language];
            if (targetFile && window.App.workspace.getFile(targetFile)) {
                window.App.workspace.openFile(targetFile);
            }
        }

        // Set code in editor
        this.editorManager.setValue(demo.code);
        if (window.App?.workspace?.activeFile) {
            window.App.workspace.updateFileContent(window.App.workspace.activeFile, demo.code);
        }

        // Trace specialized demo
        this.steps = this.tracer.trace(demo.code, demo.language, demo.type);
        this.currentStepIndex = 0;
        this.renderCurrentStep();
        this.updateControls();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (this.steps.length === 0) return;
        if (this.currentStepIndex >= this.steps.length - 1) {
            this.currentStepIndex = 0;
        }

        this.isPlaying = true;
        if (this.btnPlay) this.btnPlay.innerHTML = '<span>⏸ Pause</span>';

        this.playInterval = setInterval(() => {
            if (this.currentStepIndex < this.steps.length - 1) {
                this.nextStep();
            } else {
                this.pause();
            }
        }, this.playbackSpeed);
    }

    pause() {
        this.isPlaying = false;
        if (this.playInterval) clearInterval(this.playInterval);
        if (this.btnPlay) this.btnPlay.innerHTML = '<span>▶ Play</span>';
    }

    nextStep() {
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            this.renderCurrentStep();
            this.updateControls();
        }
    }

    prevStep() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.renderCurrentStep();
            this.updateControls();
        }
    }

    reset() {
        this.pause();
        this.currentStepIndex = 0;
        this.renderCurrentStep();
        this.updateControls();
    }

    updateControls() {
        if (this.stepIndicator) {
            const total = this.steps.length;
            this.stepIndicator.textContent = total > 0 ? `Step ${this.currentStepIndex + 1} of ${total}` : 'No steps';
        }
        if (this.btnPrev) this.btnPrev.disabled = this.currentStepIndex <= 0;
        if (this.btnNext) this.btnNext.disabled = this.currentStepIndex >= this.steps.length - 1;
    }

    renderCurrentStep() {
        if (!this.container || this.steps.length === 0) return;

        const stepData = this.steps[this.currentStepIndex];
        
        // Highlight active line in Monaco editor
        if (stepData.line) {
            this.editorManager.highlightDebugLine(stepData.line);
        }

        // Scroll diagram stage to top for new steps
        this.container.scrollTop = 0;

        // Update explanation text
        if (this.explanationEl) {
            this.explanationEl.innerHTML = `
                <div class="exp-badge">Step ${this.currentStepIndex + 1}</div>
                <div class="exp-text">${stepData.explanation || ''}</div>
                ${stepData.codeSnippet ? `<code class="exp-code">${stepData.codeSnippet}</code>` : ''}
            `;
        }

        // Render appropriate visualization based on type
        switch (stepData.type) {
            case 'c_pointer':
            case 'c_memory':
                this.renderCMemory(stepData);
                break;
            case 'c_array':
                this.renderCArray(stepData);
                break;
            case 'sorting':
                this.renderSorting(stepData);
                break;
            case 'linked_list':
                this.renderLinkedList(stepData);
                break;
            case 'java_heap':
                this.renderJavaHeap(stepData);
                break;
            case 'java_inheritance':
                this.renderJavaInheritance(stepData);
                break;
            case 'python_recursion':
                this.renderPythonRecursion(stepData);
                break;
            case 'python_structures':
                this.renderPythonStructures(stepData);
                break;
            default:
                this.renderGenericVisual(stepData);
                break;
        }
    }

    /**
     * Render C/C++ Stack Memory & Pointer Reference Arrows
     */
    renderCMemory(step) {
        let html = `
            <div class="vis-memory-container">
                <div class="vis-title">Stack Memory & Pointers Map (RAM Simulation)</div>
                <div class="vis-stack-frames">
        `;

        if (step.stackFrames && step.stackFrames.length > 0) {
            for (const frame of step.stackFrames) {
                html += `
                    <div class="stack-frame-box">
                        <div class="frame-header">
                            <span class="frame-name">${frame.name}</span>
                            <span class="frame-addr">${frame.memoryStart || '0x7ffee3b0'}</span>
                        </div>
                        <div class="frame-memory-cells">
                `;

                for (const [varName, varInfo] of Object.entries(frame.vars || {})) {
                    const isPointer = varInfo.type && varInfo.type.includes('*');
                    html += `
                        <div class="mem-cell ${isPointer ? 'is-pointer' : ''}">
                            <div class="cell-addr">${varInfo.address}</div>
                            <div class="cell-content">
                                <span class="cell-var">${varName}</span>
                                <span class="cell-val">${varInfo.value}</span>
                            </div>
                            ${isPointer ? `<div class="pointer-arrow">➔ points to [${varInfo.pointsTo}]</div>` : ''}
                        </div>
                    `;
                }

                html += `</div></div>`;
            }
        } else {
            html += `<div class="vis-empty">All stack frames unwound and freed.</div>`;
        }

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    /**
     * Render C/C++ Array Contiguous Memory
     */
    renderCArray(step) {
        let html = `
            <div class="vis-array-container">
                <div class="vis-title">Contiguous Array Memory Block (sizeof = 20 Bytes)</div>
                <div class="array-cells">
        `;

        const arr = step.arrays?.numbers || [10, 20, 30, 40, 50];
        arr.forEach((val, idx) => {
            const addr = `0x7ffee45${idx * 4}`;
            html += `
                <div class="array-cell">
                    <div class="cell-index">numbers[${idx}]</div>
                    <div class="cell-val-box">${val}</div>
                    <div class="cell-addr-sub">${addr}</div>
                </div>
            `;
        });

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    /**
     * Render Sorting Algorithm Bar Visualization
     */
    renderSorting(step) {
        const arr = step.array || [45, 12, 89, 23, 7, 56];
        const maxVal = Math.max(...arr, 100);

        let html = `
            <div class="vis-sorting-container">
                <div class="vis-title">Bubble Sort Step-by-Step Execution</div>
                <div class="bars-wrapper">
        `;

        arr.forEach((val, idx) => {
            const isComparing = step.comparing && step.comparing.includes(idx);
            const heightPercent = Math.max(15, (val / maxVal) * 100);
            const barClass = step.sorted ? 'bar-sorted' : (isComparing ? (step.swapped ? 'bar-swap' : 'bar-compare') : 'bar-normal');

            html += `
                <div class="sort-bar-col">
                    <div class="sort-bar ${barClass}" style="height: ${heightPercent}%">
                        <span class="bar-val">${val}</span>
                    </div>
                    <div class="bar-idx">[${idx}]</div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="sort-legend">
                    <span class="legend-item"><span class="legend-color normal"></span> In place</span>
                    <span class="legend-item"><span class="legend-color compare"></span> Comparing</span>
                    <span class="legend-item"><span class="legend-color swap"></span> Swapping</span>
                    <span class="legend-item"><span class="legend-color sorted"></span> Sorted</span>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Render Linked List Pointer Chain
     */
    renderLinkedList(step) {
        let html = `
            <div class="vis-linkedlist-container">
                <div class="vis-title">Singly Linked List (Heap Nodes & Pointer Links)</div>
                <div class="node-chain">
        `;

        const nodes = step.nodes || [];
        nodes.forEach((node, idx) => {
            html += `
                <div class="ll-node">
                    <div class="node-badge">${node.label}</div>
                    <div class="node-box">
                        <div class="node-field data-field">
                            <span class="field-label">data</span>
                            <span class="field-val">${node.data}</span>
                        </div>
                        <div class="node-field next-field">
                            <span class="field-label">next*</span>
                            <span class="field-val">${node.next ? node.next : 'NULL'}</span>
                        </div>
                    </div>
                    <div class="node-addr">${node.address}</div>
                </div>
            `;

            if (node.next) {
                html += `<div class="ll-arrow">➔</div>`;
            } else {
                html += `<div class="ll-arrow null-target">➔ ✕</div>`;
            }
        });

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    /**
     * Render Java JVM Stack vs Heap & Object References
     */
    renderJavaHeap(step) {
        let html = `
            <div class="vis-jvm-container">
                <div class="jvm-panel jvm-stack">
                    <div class="jvm-header">JVM Stack (Frames & References)</div>
                    <div class="jvm-content">
        `;

        const stackFrames = step.stackFrames || [];
        for (const frame of stackFrames) {
            html += `
                <div class="stack-box">
                    <div class="stack-method-title">${frame.name}</div>
                    <div class="stack-vars">
            `;
            for (const [varName, varData] of Object.entries(frame.vars || {})) {
                html += `
                    <div class="stack-var-row">
                        <span class="s-name">${varName}</span>
                        <span class="s-ref">${varData.ref || varData.value}</span>
                        ${varData.ref ? `<span class="s-ptr">➔ (points to Heap ${varData.ref})</span>` : ''}
                    </div>
                `;
            }
            html += `</div></div>`;
        }

        html += `
                    </div>
                </div>
                <div class="jvm-divider">➔ Reference Pointers ➔</div>
                <div class="jvm-panel jvm-heap">
                    <div class="jvm-header">JVM Heap (Allocated Objects)</div>
                    <div class="jvm-content">
        `;

        const heap = step.heap || {};
        const heapKeys = Object.keys(heap);
        if (heapKeys.length === 0) {
            html += `<div class="vis-empty">No objects allocated on Heap yet.</div>`;
        } else {
            for (const key of heapKeys) {
                const obj = heap[key];
                html += `
                    <div class="heap-obj-card">
                        <div class="obj-header">
                            <span class="obj-class">${obj.className}</span>
                            <span class="obj-id">${key}</span>
                        </div>
                        <div class="obj-fields">
                `;
                for (const [fName, fVal] of Object.entries(obj.fields || {})) {
                    html += `
                        <div class="obj-field-row">
                            <span class="f-name">${fName}:</span>
                            <span class="f-val">${fVal}</span>
                        </div>
                    `;
                }
                html += `</div></div>`;
            }
        }

        html += `
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Render Java Class Inheritance & Dynamic Dispatch
     */
    renderJavaInheritance(step) {
        let html = `
            <div class="vis-inheritance-container">
                <div class="vis-title">Class Hierarchy & Dynamic Method Dispatch</div>
                <div class="class-hierarchy">
        `;

        const classes = step.classes || [];
        classes.forEach(cls => {
            html += `
                <div class="class-card ${cls.active ? 'active-class' : ''}">
                    <div class="class-title">${cls.name} ${cls.parent ? `<span class="extends-pill">extends ${cls.parent}</span>` : ''}</div>
                    <div class="class-body">
                        <div class="methods-title">Methods:</div>
                        <ul>
                            ${cls.methods.map(m => `<li class="${cls.executingMethod && m.includes(cls.executingMethod) ? 'executing-method' : ''}">${m}</li>`).join('')}
                        </ul>
                        ${cls.fields ? `<div class="fields-title">Fields: ${cls.fields.join(', ')}</div>` : ''}
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    /**
     * Render Python Recursion Tree Visualizer
     */
    renderPythonRecursion(step) {
        let html = `
            <div class="vis-recursion-container">
                <div class="vis-title">Recursion Tree (Call Stack Frames)</div>
                <div class="tree-wrapper">
        `;

        if (step.recursionTree) {
            html += this.renderRecursionNode(step.recursionTree);
        } else {
            html += `<div class="vis-empty">Building recursive call tree...</div>`;
        }

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    renderRecursionNode(node) {
        let html = `
            <div class="tree-node ${node.status || 'active'}">
                <div class="node-card">
                    <div class="node-call">${node.name}</div>
                    ${node.result !== undefined ? `<div class="node-return">returns <strong>${node.result}</strong></div>` : ''}
                </div>
        `;

        if (node.children && node.children.length > 0) {
            html += `<div class="tree-children">`;
            for (const child of node.children) {
                html += this.renderRecursionNode(child);
            }
            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    /**
     * Render Python Lists and Dictionaries
     */
    renderPythonStructures(step) {
        let html = `
            <div class="vis-python-structures">
                <div class="vis-title">Python Data Structures in Memory</div>
                <div class="structures-grid">
        `;

        for (const [varName, val] of Object.entries(step.variables || {})) {
            const isArray = Array.isArray(val);
            const isDict = typeof val === 'object' && val !== null && !isArray;

            html += `
                <div class="structure-card">
                    <div class="struct-header">
                        <span class="struct-name">${varName}</span>
                        <span class="struct-type">${isArray ? 'list' : (isDict ? 'dict' : typeof val)}</span>
                    </div>
                    <div class="struct-body">
            `;

            if (isArray) {
                html += `<div class="py-list-items">`;
                val.forEach((item, idx) => {
                    html += `
                        <div class="py-list-cell">
                            <span class="idx-badge">${idx}</span>
                            <span class="item-val">${item}</span>
                        </div>
                    `;
                });
                html += `</div>`;
            } else if (isDict) {
                html += `<div class="py-dict-items">`;
                for (const [k, v] of Object.entries(val)) {
                    html += `
                        <div class="dict-row">
                            <span class="d-key">"${k}"</span>:
                            <span class="d-val">${typeof v === 'object' ? JSON.stringify(v) : v}</span>
                        </div>
                    `;
                }
                html += `</div>`;
            } else {
                html += `<div class="primitive-val">${val}</div>`;
            }

            html += `</div></div>`;
        }

        html += `</div></div>`;
        this.container.innerHTML = html;
    }

    renderGenericVisual(step) {
        this.container.innerHTML = `
            <div class="vis-generic-container">
                <div class="vis-title">Program Execution State</div>
                <pre class="json-state">${JSON.stringify(step.state || step, null, 2)}</pre>
            </div>
        `;
    }
}
