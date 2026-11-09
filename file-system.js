/**
 * Virtual Workspace File System and Project Management
 */
import { STARTER_TEMPLATES } from './templates.js';

export class WorkspaceManager {
    constructor(options = {}) {
        this.storageKey = 'codestudio_workspace_v1';
        this.files = new Map(); // filename -> { filename, content, language, isFolder }
        this.openTabs = []; // list of filenames
        this.activeFile = null;
        this.onFileSelect = options.onFileSelect || (() => {});
        this.onFilesChange = options.onFilesChange || (() => {});

        this.loadWorkspace();
    }

    loadWorkspace() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.files && Object.keys(parsed.files).length > 0) {
                    this.files.clear();
                    for (const [name, file] of Object.entries(parsed.files)) {
                        this.files.set(name, file);
                    }
                    this.openTabs = parsed.openTabs || [];
                    this.activeFile = parsed.activeFile || this.files.keys().next().value;
                    return;
                }
            } catch (e) {
                console.error('Failed to parse saved workspace:', e);
            }
        }

        // Initialize with default template project files
        this.resetToDefaults();
    }

    resetToDefaults() {
        this.files.clear();
        for (const [key, tpl] of Object.entries(STARTER_TEMPLATES)) {
            this.files.set(tpl.filename, {
                filename: tpl.filename,
                content: tpl.content,
                language: tpl.language,
                isFolder: false
            });
        }

        this.openTabs = ['script.py', 'main.c', 'main.cpp', 'Main.java', 'index.html', 'style.css', 'app.js'];
        this.activeFile = 'script.py';
        this.saveWorkspace();
    }

    saveWorkspace() {
        const fileObj = {};
        for (const [name, file] of this.files.entries()) {
            fileObj[name] = file;
        }
        localStorage.setItem(this.storageKey, JSON.stringify({
            files: fileObj,
            openTabs: this.openTabs,
            activeFile: this.activeFile
        }));
        this.onFilesChange(Array.from(this.files.values()));
    }

    detectLanguage(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const map = {
            'c': 'c',
            'h': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'hpp': 'cpp',
            'java': 'java',
            'py': 'python',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'js': 'javascript',
            'json': 'json',
            'md': 'markdown'
        };
        return map[ext] || 'plaintext';
    }

    createFile(filename, initialContent = '') {
        if (!filename || this.files.has(filename)) {
            alert(`A file named "${filename}" already exists.`);
            return false;
        }
        const language = this.detectLanguage(filename);
        this.files.set(filename, {
            filename,
            content: initialContent,
            language,
            isFolder: false
        });

        this.openFile(filename);
        this.saveWorkspace();
        return true;
    }

    deleteFile(filename) {
        if (!this.files.has(filename)) return;
        if (confirm(`Are you sure you want to delete "${filename}"?`)) {
            this.files.delete(filename);
            this.closeTab(filename);
            if (this.activeFile === filename) {
                this.activeFile = this.openTabs[0] || (this.files.keys().next().value || null);
                if (this.activeFile) {
                    this.onFileSelect(this.activeFile, this.getFile(this.activeFile));
                }
            }
            this.saveWorkspace();
        }
    }

    renameFile(oldName, newName) {
        if (!newName || oldName === newName || !this.files.has(oldName)) return false;
        if (this.files.has(newName)) {
            alert(`A file with name "${newName}" already exists.`);
            return false;
        }

        const file = this.files.get(oldName);
        this.files.delete(oldName);
        file.filename = newName;
        file.language = this.detectLanguage(newName);
        this.files.set(newName, file);

        // Update tabs
        const tabIndex = this.openTabs.indexOf(oldName);
        if (tabIndex !== -1) {
            this.openTabs[tabIndex] = newName;
        }
        if (this.activeFile === oldName) {
            this.activeFile = newName;
        }

        this.saveWorkspace();
        this.onFileSelect(newName, file);
        return true;
    }

    getFile(filename) {
        return this.files.get(filename);
    }

    updateFileContent(filename, content) {
        const file = this.files.get(filename);
        if (file) {
            file.content = content;
            // Debounced save
            this.debouncedSave();
        }
    }

    debouncedSave() {
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            this.saveWorkspace();
        }, 1000);
    }

    openFile(filename) {
        if (!this.files.has(filename)) return;
        if (!this.openTabs.includes(filename)) {
            this.openTabs.push(filename);
        }
        this.activeFile = filename;
        this.saveWorkspace();
        this.onFileSelect(filename, this.getFile(filename));
    }

    closeTab(filename) {
        const index = this.openTabs.indexOf(filename);
        if (index === -1) return;

        this.openTabs.splice(index, 1);
        if (this.activeFile === filename) {
            if (this.openTabs.length > 0) {
                const nextIndex = Math.min(index, this.openTabs.length - 1);
                this.activeFile = this.openTabs[nextIndex];
                this.onFileSelect(this.activeFile, this.getFile(this.activeFile));
            } else {
                this.activeFile = null;
            }
        }
        this.saveWorkspace();
    }

    /**
     * Download current active file
     */
    downloadCurrentFile() {
        if (!this.activeFile) return;
        const file = this.getFile(this.activeFile);
        if (!file) return;

        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export all project files as a JSON package
     */
    exportProjectJSON() {
        const projectData = {
            name: "CodeStudio-Project",
            version: "1.0",
            exportedAt: new Date().toISOString(),
            files: Object.fromEntries(this.files)
        };
        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `codestudio-project-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import project JSON or source files
     */
    importProject(fileList) {
        for (const file of fileList) {
            const reader = new FileReader();
            if (file.name.endsWith('.json')) {
                reader.onload = (e) => {
                    try {
                        const parsed = JSON.parse(e.target.result);
                        if (parsed.files) {
                            for (const [name, fData] of Object.entries(parsed.files)) {
                                this.files.set(name, fData);
                            }
                            this.saveWorkspace();
                            alert('Project imported successfully!');
                        }
                    } catch (err) {
                        alert('Error importing JSON project: ' + err.message);
                    }
                };
                reader.readAsText(file);
            } else {
                reader.onload = (e) => {
                    this.createFile(file.name, e.target.result);
                };
                reader.readAsText(file);
            }
        }
    }
}
