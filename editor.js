/**
 * Monaco Editor Controller with Breakpoint Gutter, Active Line Decoration, and Fallback
 */

export class EditorManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.editor = null;
        this.models = new Map(); // filename -> monaco model or fallback state
        this.currentFile = null;
        this.breakpoints = new Set(); // Set of "filename:lineNumber"
        this.activeLineDecoration = [];
        this.breakpointDecorations = [];
        this.isMonacoLoaded = false;
        this.onBreakpointChange = options.onBreakpointChange || (() => {});
        this.onContentChange = options.onContentChange || (() => {});

        this.init();
    }

    async init() {
        if (window.monaco) {
            this.setupMonaco();
            return;
        }

        // Check if require.js is available or inject monaco loader
        try {
            await this.loadMonacoScripts();
            this.setupMonaco();
        } catch (err) {
            console.warn('[Editor] Monaco CDN could not be reached, initializing High-Performance Code Editor Fallback:', err);
            this.setupFallbackEditor();
        }
    }

    loadMonacoScripts() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Monaco loader timed out'));
            }, 6000);

            if (window.require) {
                this.configureMonacoRequire(resolve, reject);
                clearTimeout(timeout);
                return;
            }

            const loaderScript = document.createElement('script');
            loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
            loaderScript.async = true;
            loaderScript.onload = () => {
                clearTimeout(timeout);
                this.configureMonacoRequire(resolve, reject);
            };
            loaderScript.onerror = () => {
                clearTimeout(timeout);
                reject(new Error('Failed to load Monaco loader'));
            };
            document.head.appendChild(loaderScript);
        });
    }

    configureMonacoRequire(resolve, reject) {
        window.require.config({
            paths: {
                vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
            }
        });

        window.require(['vs/editor/editor.main'], () => {
            this.isMonacoLoaded = true;
            resolve();
        }, reject);
    }

    setupMonaco() {
        this.isMonacoLoaded = true;
        this.container.innerHTML = ''; // clear any loading spinner

        // Define VS Code Dark Modern theme
        monaco.editor.defineTheme('codestudio-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
                { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'number', foreground: 'B5CEA8' },
                { token: 'type', foreground: '4EC9B0' },
                { token: 'function', foreground: 'DCDCAA' }
            ],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.foreground': '#d4d4d4',
                'editorGutter.background': '#1e1e1e',
                'editorLineNumber.foreground': '#858585',
                'editorLineNumber.activeForeground': '#c6c6c6',
                'editor.lineHighlightBackground': '#2a2d2e',
                'editor.selectionBackground': '#264f78',
                'editorGlyphMargin.background': '#1e1e1e'
            }
        });

        this.editor = monaco.editor.create(this.container, {
            theme: 'codestudio-dark',
            fontSize: 14,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
            fontLigatures: true,
            automaticLayout: true,
            glyphMargin: true, // Needed for breakpoint dots
            lineNumbers: 'on',
            minimap: { enabled: true, maxColumn: 80 },
            scrollBeyondLastLine: false,
            bracketPairColorization: { enabled: true },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            tabSize: 4,
            wordWrap: 'on'
        });

        // Gutter click to toggle breakpoints
        this.editor.onMouseDown((e) => {
            if (e.target && e.target.position && (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
                e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS)) {
                const line = e.target.position.lineNumber;
                this.toggleBreakpoint(this.currentFile, line);
            }
        });

        // Content change listener
        this.editor.onDidChangeModelContent(() => {
            if (this.currentFile) {
                this.onContentChange(this.currentFile, this.getValue());
            }
        });

        // Global keyboard shortcuts
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            if (window.App && window.App.runCode) window.App.runCode();
        });

        this.editor.addCommand(monaco.KeyCode.F5, () => {
            if (window.App && window.App.startDebugging) window.App.startDebugging();
        });

        // Convert any models created before Monaco finished loading
        for (const [filename, fileData] of this.models.entries()) {
            if (!fileData.model) {
                const uri = monaco.Uri.parse(`inmemory://workspace/${filename}`);
                let model = monaco.editor.getModel(uri);
                if (!model) {
                    model = monaco.editor.createModel(fileData.content || '', this.getMonacoLanguage(fileData.language), uri);
                } else if (fileData.content !== undefined) {
                    model.setValue(fileData.content);
                }
                fileData.model = model;
            }
        }

        // If file was queued, open it
        if (this.currentFile && this.models.has(this.currentFile)) {
            this.openFile(this.currentFile);
        }
    }

    /**
     * Fallback sleek editor when Monaco CDN is not accessible
     */
    setupFallbackEditor() {
        this.isMonacoLoaded = false;
        this.container.innerHTML = `
            <div class="fallback-editor-wrapper">
                <div class="fallback-gutter" id="fallback-gutter"></div>
                <textarea class="fallback-textarea" id="fallback-textarea" spellcheck="false"></textarea>
            </div>
        `;

        this.fallbackTextarea = document.getElementById('fallback-textarea');
        this.fallbackGutter = document.getElementById('fallback-gutter');

        this.fallbackTextarea.addEventListener('input', () => {
            this.updateFallbackGutter();
            if (this.currentFile) {
                this.onContentChange(this.currentFile, this.fallbackTextarea.value);
            }
        });

        this.fallbackTextarea.addEventListener('scroll', () => {
            this.fallbackGutter.scrollTop = this.fallbackTextarea.scrollTop;
        });

        this.fallbackTextarea.addEventListener('keydown', (e) => {
            // Tab key support
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.fallbackTextarea.selectionStart;
                const end = this.fallbackTextarea.selectionEnd;
                this.fallbackTextarea.value = this.fallbackTextarea.value.substring(0, start) + '    ' + this.fallbackTextarea.value.substring(end);
                this.fallbackTextarea.selectionStart = this.fallbackTextarea.selectionEnd = start + 4;
            }
            // Ctrl+Enter to run
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (window.App && window.App.runCode) window.App.runCode();
            }
            // F5 to debug
            if (e.key === 'F5') {
                e.preventDefault();
                if (window.App && window.App.startDebugging) window.App.startDebugging();
            }
        });

        if (this.currentFile) {
            this.openFile(this.currentFile);
        }
    }

    updateFallbackGutter() {
        if (!this.fallbackGutter || !this.fallbackTextarea) return;
        const lineCount = (this.fallbackTextarea.value.split('\n')).length;
        let html = '';
        for (let i = 1; i <= lineCount; i++) {
            const bpKey = `${this.currentFile}:${i}`;
            const hasBp = this.breakpoints.has(bpKey);
            html += `<div class="fallback-line-num ${hasBp ? 'has-breakpoint' : ''}" data-line="${i}">
                <span class="bp-dot">●</span>
                <span class="num">${i}</span>
            </div>`;
        }
        this.fallbackGutter.innerHTML = html;

        // Bind gutter click
        this.fallbackGutter.querySelectorAll('.fallback-line-num').forEach(el => {
            el.addEventListener('click', (e) => {
                const line = parseInt(el.getAttribute('data-line'), 10);
                this.toggleBreakpoint(this.currentFile, line);
            });
        });
    }

    getMonacoLanguage(lang) {
        const map = {
            c: 'c',
            cpp: 'cpp',
            java: 'java',
            python: 'python',
            javascript: 'javascript',
            html: 'html',
            css: 'css',
            json: 'json',
            markdown: 'markdown'
        };
        return map[lang] || 'plaintext';
    }

    createModel(filename, language, content) {
        if (this.isMonacoLoaded && window.monaco) {
            const uri = monaco.Uri.parse(`inmemory://workspace/${filename}`);
            let model = monaco.editor.getModel(uri);
            if (!model) {
                model = monaco.editor.createModel(content, this.getMonacoLanguage(language), uri);
            } else {
                model.setValue(content);
            }
            this.models.set(filename, { model, language });
        } else {
            this.models.set(filename, { content, language });
        }
    }

    openFile(filename) {
        this.currentFile = filename;
        const fileData = this.models.get(filename);
        if (!fileData) return;

        if (this.isMonacoLoaded && this.editor) {
            if (!fileData.model) {
                const uri = monaco.Uri.parse(`inmemory://workspace/${filename}`);
                let model = monaco.editor.getModel(uri);
                if (!model) {
                    model = monaco.editor.createModel(fileData.content || '', this.getMonacoLanguage(fileData.language), uri);
                } else if (fileData.content !== undefined) {
                    model.setValue(fileData.content);
                }
                fileData.model = model;
            }
            this.editor.setModel(fileData.model);
            this.renderBreakpointDecorations();
        } else if (this.fallbackTextarea) {
            this.fallbackTextarea.value = fileData.content || (fileData.model ? fileData.model.getValue() : '');
            this.updateFallbackGutter();
        }
    }

    getValue() {
        if (this.isMonacoLoaded && this.editor) {
            return this.editor.getValue();
        }
        if (this.fallbackTextarea) {
            return this.fallbackTextarea.value;
        }
        if (this.currentFile && this.models.has(this.currentFile)) {
            const m = this.models.get(this.currentFile);
            return m.content || (m.model ? m.model.getValue() : '');
        }
        return '';
    }

    setValue(value) {
        if (this.isMonacoLoaded && this.editor) {
            this.editor.setValue(value);
        } else if (this.fallbackTextarea) {
            this.fallbackTextarea.value = value;
            this.updateFallbackGutter();
        }
    }

    toggleBreakpoint(filename, lineNumber) {
        if (!filename || !lineNumber) return;
        const key = `${filename}:${lineNumber}`;
        if (this.breakpoints.has(key)) {
            this.breakpoints.delete(key);
        } else {
            this.breakpoints.add(key);
        }

        this.renderBreakpointDecorations();
        this.onBreakpointChange(Array.from(this.breakpoints));
    }

    renderBreakpointDecorations() {
        if (this.isMonacoLoaded && this.editor) {
            const decorations = [];
            for (const bp of this.breakpoints) {
                const [file, lineStr] = bp.split(':');
                if (file === this.currentFile) {
                    const line = parseInt(lineStr, 10);
                    decorations.push({
                        range: new monaco.Range(line, 1, line, 1),
                        options: {
                            isWholeLine: false,
                            glyphMarginClassName: 'breakpoint-glyph',
                            glyphMarginHoverMessage: { value: `Breakpoint at line ${line}` }
                        }
                    });
                }
            }
            this.breakpointDecorations = this.editor.deltaDecorations(this.breakpointDecorations, decorations);
        } else {
            this.updateFallbackGutter();
        }
    }

    /**
     * Highlight line during active debugging
     */
    highlightDebugLine(lineNumber) {
        if (this.isMonacoLoaded && this.editor) {
            if (!lineNumber) {
                this.activeLineDecoration = this.editor.deltaDecorations(this.activeLineDecoration, []);
                return;
            }

            this.editor.revealLineInCenter(lineNumber);
            this.activeLineDecoration = this.editor.deltaDecorations(this.activeLineDecoration, [
                {
                    range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                    options: {
                        isWholeLine: true,
                        className: 'debug-active-line',
                        glyphMarginClassName: 'debug-active-arrow'
                    }
                }
            ]);
        } else if (this.fallbackGutter) {
            this.fallbackGutter.querySelectorAll('.fallback-line-num').forEach(el => {
                const line = parseInt(el.getAttribute('data-line'), 10);
                if (line === lineNumber) {
                    el.classList.add('debug-active');
                } else {
                    el.classList.remove('debug-active');
                }
            });
        }
    }

    clearDebugHighlight() {
        this.highlightDebugLine(null);
    }
}
