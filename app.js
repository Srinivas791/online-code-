/**
 * Main Application Coordinator - CodeStudio Pro
 * Integrates Monaco Editor, Judge0 Execution, Debugger, Visualizer, Playground, File System, and Learning.
 */
import { Judge0Client } from './judge0.js';
import { EditorManager } from './editor.js';
import { WorkspaceManager } from './file-system.js';
import { DebuggerManager } from './debugger.js';
import { VisualizerManager } from './visualizer.js';
import { PlaygroundManager } from './playground.js';
import { LearningManager } from './learning.js';
import { STARTER_TEMPLATES } from './templates.js';

class Application {
    constructor() {
        this.activeActivity = 'explorer'; // 'explorer', 'debug', 'visualizer', 'playground', 'learning', 'settings'
        this.activeTerminalTab = 'stdout'; // 'stdout', 'stderr', 'compile', 'stdin', 'debug', 'tests'
        this.isExecuting = false;

        this.init();
    }

    async init() {
        // Initialize Judge0 Client
        this.judge0 = new Judge0Client();

        // Initialize Workspace Manager
        this.workspace = new WorkspaceManager({
            onFileSelect: (filename, fileData) => this.handleFileSelected(filename, fileData),
            onFilesChange: (files) => this.renderFileTree(files)
        });

        // Initialize Editor Manager
        this.editor = new EditorManager('editor-surface', {
            onBreakpointChange: (bps) => {
                if (this.debugger) this.debugger.setBreakpoints(bps);
            },
            onContentChange: (filename, content) => {
                this.workspace.updateFileContent(filename, content);
                if (['html', 'css', 'javascript'].includes(this.workspace.detectLanguage(filename))) {
                    this.playground?.scheduleAutoReload();
                }
            }
        });

        // Wire existing workspace files into editor
        for (const [name, file] of this.workspace.files.entries()) {
            this.editor.createModel(name, file.language, file.content);
        }

        // Initialize Specialized Managers
        this.debugger = new DebuggerManager({
            editorManager: this.editor,
            onOutput: (msg, type) => this.logToTerminal(msg, type)
        });

        this.visualizer = new VisualizerManager({
            editorManager: this.editor
        });

        this.playground = new PlaygroundManager({
            workspace: this.workspace,
            onConsoleLog: (lvl, msg) => this.logToTerminal(`[Browser Console ${lvl}] ${msg}`, lvl)
        });

        this.learning = new LearningManager({
            editorManager: this.editor
        });

        this.initDOM();
        this.initKeyboardShortcuts();

        // Open initial active file
        if (this.workspace.activeFile) {
            this.handleFileSelected(this.workspace.activeFile, this.workspace.getFile(this.workspace.activeFile));
        }

        this.renderFileTree(Array.from(this.workspace.files.values()));
        this.renderTabs();
    }

    initDOM() {
        // Activity bar icons
        document.querySelectorAll('.activity-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                const act = btn.getAttribute('data-activity');
                this.switchActivity(act);
            });
        });

        // Run Code Button
        const runBtn = document.getElementById('btn-run-code');
        runBtn?.addEventListener('click', () => this.runCode());

        // Debug Button
        const debugBtn = document.getElementById('btn-debug-code');
        debugBtn?.addEventListener('click', () => {
            this.switchActivity('debug');
            this.debugger.startDebugging();
        });

        // Visualize Button
        const visBtn = document.getElementById('btn-visualize-code');
        visBtn?.addEventListener('click', () => {
            this.switchActivity('visualizer');
            this.visualizer.visualizeCurrentCode();
        });

        // Live Preview Button
        const previewBtn = document.getElementById('btn-live-preview');
        previewBtn?.addEventListener('click', () => {
            this.switchActivity('playground');
            this.playground.updatePreview(true);
        });

        // New File Button
        document.getElementById('btn-new-file')?.addEventListener('click', () => {
            const name = prompt('Enter new file name (e.g. test.py, solution.cpp, demo.c):');
            if (name) {
                const success = this.workspace.createFile(name.trim(), '');
                if (success) {
                    this.editor.createModel(name.trim(), this.workspace.detectLanguage(name.trim()), '');
                    this.editor.openFile(name.trim());
                    this.renderTabs();
                }
            }
        });

        // Export Project Button
        document.getElementById('btn-export-project')?.addEventListener('click', () => {
            this.workspace.exportProjectJSON();
        });

        // Download Current File
        document.getElementById('btn-download-file')?.addEventListener('click', () => {
            this.workspace.downloadCurrentFile();
        });

        // Import Project Button
        const fileImportInput = document.getElementById('file-import-input');
        document.getElementById('btn-import-project')?.addEventListener('click', () => {
            fileImportInput?.click();
        });
        fileImportInput?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.workspace.importProject(e.target.files);
            }
        });

        // Reset to Defaults Button
        document.getElementById('btn-reset-templates')?.addEventListener('click', () => {
            if (confirm('Reset workspace to default starter templates? Unsaved changes will be replaced.')) {
                this.workspace.resetToDefaults();
                location.reload();
            }
        });

        // Terminal Panel Tabs
        document.querySelectorAll('.term-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTerminalTab(tab);
            });
        });

        // Clear Terminal Output
        document.getElementById('btn-clear-terminal')?.addEventListener('click', () => {
            this.clearTerminal();
        });

        // Settings Modal
        this.initSettingsModal();

        // Language Selector dropdown in top bar
        const langSelect = document.getElementById('topbar-lang-select');
        langSelect?.addEventListener('change', (e) => {
            const lang = e.target.value;
            const tpl = STARTER_TEMPLATES[lang];
            if (tpl) {
                // If template file doesn't exist, create or open it
                if (!this.workspace.getFile(tpl.filename)) {
                    this.workspace.createFile(tpl.filename, tpl.content);
                    this.editor.createModel(tpl.filename, tpl.language, tpl.content);
                }
                this.workspace.openFile(tpl.filename);
            }
        });
    }

    initSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const openBtn = document.getElementById('btn-settings-open');
        const closeBtn = document.getElementById('btn-settings-close');
        const saveBtn = document.getElementById('btn-settings-save');

        openBtn?.addEventListener('click', () => {
            this.loadSettingsIntoUI();
            modal.classList.add('visible');
        });

        closeBtn?.addEventListener('click', () => {
            modal.classList.remove('visible');
        });

        saveBtn?.addEventListener('click', () => {
            this.saveSettingsFromUI();
            modal.classList.remove('visible');
            alert('Settings saved successfully!');
        });
    }

    loadSettingsIntoUI() {
        const s = this.judge0.settings;
        const typeSelect = document.getElementById('setting-endpoint-type');
        const publicUrlInput = document.getElementById('setting-public-url');
        const rapidKeyInput = document.getElementById('setting-rapidapi-key');
        const customUrlInput = document.getElementById('setting-custom-url');

        if (typeSelect) typeSelect.value = s.endpointType || 'public';
        if (publicUrlInput) publicUrlInput.value = s.publicUrl || 'https://ce.judge0.com';
        if (rapidKeyInput) rapidKeyInput.value = s.rapidApiKey || '';
        if (customUrlInput) customUrlInput.value = s.customUrl || 'http://localhost:2358';
    }

    saveSettingsFromUI() {
        const newSettings = {
            endpointType: document.getElementById('setting-endpoint-type')?.value,
            publicUrl: document.getElementById('setting-public-url')?.value,
            rapidApiKey: document.getElementById('setting-rapidapi-key')?.value,
            customUrl: document.getElementById('setting-custom-url')?.value
        };
        this.judge0.saveSettings(newSettings);
        this.updateStatusIndicator();
    }

    initKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Ctrl + Enter: Run Code
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runCode();
            }
            // F5: Start / Continue Debug
            if (e.key === 'F5') {
                e.preventDefault();
                this.switchActivity('debug');
                this.debugger.startDebugging();
            }
            // Ctrl + B: Toggle Sidebar
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                document.getElementById('sidebar')?.classList.toggle('collapsed');
            }
            // Ctrl + S: Save workspace
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                this.workspace.saveWorkspace();
                this.showStatusNotification('Saved all files to local workspace.');
            }
        });
    }

    switchActivity(act) {
        if (act === 'settings') {
            this.loadSettingsIntoUI();
            document.getElementById('settings-modal')?.classList.add('visible');
            return;
        }

        this.activeActivity = act;
        document.querySelectorAll('.activity-icon').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-activity') === act);
        });

        document.querySelectorAll('.sidebar-view').forEach(view => {
            view.classList.toggle('active', view.id === `view-${act}`);
        });

        // Ensure sidebar is open
        document.getElementById('sidebar')?.classList.remove('collapsed');

        // Secondary / Split panel toggle
        const secondaryPanel = document.getElementById('secondary-panel');
        if (act === 'visualizer' || act === 'playground' || act === 'learning') {
            secondaryPanel?.classList.remove('hidden');
            document.querySelectorAll('.secondary-view').forEach(sv => {
                sv.classList.toggle('active', sv.id === `sec-view-${act}`);
            });

            if (act === 'playground') this.playground.updatePreview();
            if (act === 'visualizer') this.visualizer.visualizeCurrentCode();
        } else {
            // Can remain split or hide if user prefers pure editor
            // Keep split or show if debug/visualizer is desired
        }
    }

    switchTerminalTab(tab) {
        this.activeTerminalTab = tab;
        document.querySelectorAll('.term-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
        });
        document.querySelectorAll('.term-view').forEach(view => {
            view.classList.toggle('active', view.id === `term-view-${tab}`);
        });
    }

    handleFileSelected(filename, fileData) {
        if (!fileData) return;

        this.editor.createModel(filename, fileData.language, fileData.content);
        this.editor.openFile(filename);

        // Update top bar language selector
        const langSelect = document.getElementById('topbar-lang-select');
        if (langSelect && fileData.language) {
            langSelect.value = fileData.language;
        }

        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb-filename');
        if (breadcrumb) {
            breadcrumb.textContent = filename;
        }

        // Update status bar
        const statusLang = document.getElementById('status-language');
        if (statusLang) {
            statusLang.textContent = fileData.language.toUpperCase();
        }

        this.renderTabs();
    }

    renderTabs() {
        const tabsContainer = document.getElementById('editor-tabs-bar');
        if (!tabsContainer) return;

        let html = '';
        this.workspace.openTabs.forEach(filename => {
            const isActive = filename === this.workspace.activeFile;
            const ext = filename.split('.').pop();
            html += `
                <div class="editor-tab ${isActive ? 'active' : ''}" data-file="${filename}">
                    <span class="tab-icon file-${ext}"></span>
                    <span class="tab-name">${filename}</span>
                    <button class="tab-close-btn" data-close="${filename}" title="Close Tab">×</button>
                </div>
            `;
        });

        tabsContainer.innerHTML = html;

        tabsContainer.querySelectorAll('.editor-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close-btn')) return;
                const f = tab.getAttribute('data-file');
                this.workspace.openFile(f);
            });
        });

        tabsContainer.querySelectorAll('.tab-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const f = btn.getAttribute('data-close');
                this.workspace.closeTab(f);
                this.renderTabs();
            });
        });
    }

    renderFileTree(files) {
        const treeContainer = document.getElementById('file-tree');
        if (!treeContainer) return;

        let html = '';
        files.forEach(f => {
            const isActive = f.filename === this.workspace.activeFile;
            const ext = f.filename.split('.').pop();
            html += `
                <div class="file-item ${isActive ? 'active' : ''}" data-file="${f.filename}">
                    <span class="file-icon file-${ext}"></span>
                    <span class="file-label">${f.filename}</span>
                    <div class="file-actions">
                        <button class="file-action-btn btn-rename" title="Rename" data-rename="${f.filename}">✏️</button>
                        <button class="file-action-btn btn-delete" title="Delete" data-del="${f.filename}">🗑️</button>
                    </div>
                </div>
            `;
        });

        treeContainer.innerHTML = html;

        treeContainer.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('file-action-btn')) return;
                const f = item.getAttribute('data-file');
                this.workspace.openFile(f);
            });
        });

        treeContainer.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const f = btn.getAttribute('data-del');
                this.workspace.deleteFile(f);
            });
        });

        treeContainer.querySelectorAll('.btn-rename').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const f = btn.getAttribute('data-rename');
                const newName = prompt(`Rename "${f}" to:`, f);
                if (newName) {
                    this.workspace.renameFile(f, newName.trim());
                    this.renderTabs();
                }
            });
        });
    }

    /**
     * Professional Run Code Feature
     */
    async runCode() {
        if (this.isExecuting) return;

        const activeFilename = this.workspace.activeFile;
        const fileData = this.workspace.getFile(activeFilename);
        if (!fileData) return;

        const code = this.editor.getValue();
        const language = fileData.language;

        // If HTML/CSS/JS, run browser live preview
        if (language === 'html' || language === 'css') {
            this.switchActivity('playground');
            this.playground.updatePreview(true);
            this.showStatusNotification('Running in Live Web Playground...');
            return;
        }

        // Execution via Judge0 execution engine
        this.isExecuting = true;
        const runBtn = document.getElementById('btn-run-code');
        if (runBtn) {
            runBtn.disabled = true;
            runBtn.innerHTML = '<span>⏳ Running...</span>';
        }

        const stdinInput = document.getElementById('term-stdin-input')?.value || '';
        this.switchTerminalTab('stdout');
        this.logToTerminal(`[Execution] Compiling and running ${activeFilename} via ${this.judge0.settings.endpointType.toUpperCase()} Judge0 Engine...\n`, 'info');

        try {
            const result = await this.judge0.executeCode({
                language,
                sourceCode: code,
                stdin: stdinInput,
                onStatusUpdate: (info) => {
                    this.updateExecutionBadge(info.status, 'pending');
                }
            });

            // Display Results
            this.displayExecutionResult(result);

        } catch (error) {
            this.logToTerminal(`[Execution Error] ${error.message}\n`, 'error');
            this.updateExecutionBadge('Execution Failed', 'error');
        } finally {
            this.isExecuting = false;
            if (runBtn) {
                runBtn.disabled = false;
                runBtn.innerHTML = '<span>▶ Run Code</span>';
            }
        }
    }

    displayExecutionResult(result) {
        // Output Console update
        const stdoutEl = document.getElementById('term-stdout');
        const stderrEl = document.getElementById('term-stderr');
        const compileEl = document.getElementById('term-compile');

        if (stdoutEl) stdoutEl.textContent = result.stdout || '(No standard output)';
        if (stderrEl) stderrEl.textContent = result.stderr || '(No runtime errors)';
        if (compileEl) compileEl.textContent = result.compileOutput || '(No compilation errors. Program compiled successfully.)';

        // Automatically switch to compilation/stderr tab if errors exist
        if (result.status.id === 6 && result.compileOutput) {
            this.switchTerminalTab('compile');
        } else if (result.hasError && result.stderr) {
            this.switchTerminalTab('stderr');
        } else {
            this.switchTerminalTab('stdout');
        }

        // Update stats badge
        this.updateStatsBadge(result);
    }

    updateStatsBadge(result) {
        const badge = document.getElementById('term-execution-stats');
        if (!badge) return;

        const isSuccess = !result.hasError;
        badge.className = `term-stats-badge ${isSuccess ? 'badge-success' : 'badge-error'}`;
        badge.innerHTML = `
            <span class="stat-status">Status: <strong>${result.status.name}</strong></span>
            <span class="stat-sep">|</span>
            <span class="stat-time">Time: <strong>${result.executionTime}</strong></span>
            <span class="stat-sep">|</span>
            <span class="stat-mem">Memory: <strong>${result.memoryUsage}</strong></span>
            <span class="stat-sep">|</span>
            <span class="stat-engine">${result.engine}</span>
        `;
    }

    updateExecutionBadge(statusText, type = 'pending') {
        const badge = document.getElementById('term-execution-stats');
        if (!badge) return;
        badge.className = `term-stats-badge badge-${type}`;
        badge.innerHTML = `<span class="stat-status">${statusText}</span>`;
    }

    logToTerminal(message, type = 'info') {
        const stdoutEl = document.getElementById('term-stdout');
        if (stdoutEl) {
            const time = new Date().toLocaleTimeString();
            stdoutEl.textContent += `[${time}] ${message}\n`;
            stdoutEl.scrollTop = stdoutEl.scrollHeight;
        }
    }

    clearTerminal() {
        const stdoutEl = document.getElementById('term-stdout');
        const stderrEl = document.getElementById('term-stderr');
        const compileEl = document.getElementById('term-compile');
        if (stdoutEl) stdoutEl.textContent = '';
        if (stderrEl) stderrEl.textContent = '';
        if (compileEl) compileEl.textContent = '';
    }

    showStatusNotification(text) {
        const notif = document.getElementById('status-notification');
        if (notif) {
            notif.textContent = text;
            notif.classList.add('visible');
            setTimeout(() => notif.classList.remove('visible'), 2500);
        }
    }

    updateStatusIndicator() {
        const ind = document.getElementById('status-engine-indicator');
        if (ind) {
            ind.textContent = `Engine: ${this.judge0.settings.endpointType.toUpperCase()}`;
        }
    }
}

// Instantiate and expose globally
window.addEventListener('DOMContentLoaded', () => {
    window.App = new Application();
});
