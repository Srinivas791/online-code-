/**
 * Interactive HTML, CSS, JavaScript Playground with sandboxed live preview,
 * device switcher (Mobile, Tablet, Desktop), DOM Tree Visualizer, and Event Inspector.
 */

export class PlaygroundManager {
    constructor(options = {}) {
        this.workspace = options.workspace;
        this.onConsoleLog = options.onConsoleLog || (() => {});
        this.activeTab = 'preview'; // 'preview', 'dom', 'events'
        this.deviceMode = 'desktop'; // 'desktop', 'tablet', 'mobile'
        this.autoReload = true;
        this.reloadDebounceTimer = null;

        this.initUI();
    }

    initUI() {
        this.previewIframe = document.getElementById('playground-iframe');
        this.previewContainer = document.getElementById('playground-preview-container');
        this.deviceButtons = document.querySelectorAll('.device-btn');
        this.fullscreenBtn = document.getElementById('playground-btn-fullscreen');
        this.refreshBtn = document.getElementById('playground-btn-refresh');
        this.domTreeContainer = document.getElementById('playground-dom-tree');
        this.eventListContainer = document.getElementById('playground-event-list');
        this.consoleContainer = document.getElementById('playground-console-logs');

        // Sub-tabs in playground panel
        document.querySelectorAll('.pg-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = btn.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        // Device switcher buttons
        this.deviceButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const device = btn.getAttribute('data-device');
                this.setDevice(device);
            });
        });

        this.refreshBtn?.addEventListener('click', () => {
            this.updatePreview(true);
        });

        this.fullscreenBtn?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Listen for postMessage from sandboxed iframe
        window.addEventListener('message', (event) => {
            if (!event.data || !event.data.type) return;

            if (event.data.type === 'PLAYGROUND_LOG') {
                this.handleIframeLog(event.data.level, event.data.message);
            } else if (event.data.type === 'PLAYGROUND_EVENT') {
                this.handleIframeEvent(event.data.eventInfo);
            } else if (event.data.type === 'PLAYGROUND_DOM_UPDATE') {
                this.renderDOMTree(event.data.domTree);
            }
        });
    }

    switchTab(tabName) {
        this.activeTab = tabName;
        document.querySelectorAll('.pg-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        document.querySelectorAll('.pg-tab-content').forEach(view => {
            view.classList.toggle('active', view.id === `pg-view-${tabName}`);
        });

        if (tabName === 'dom' || tabName === 'events') {
            this.requestDOMState();
        }
    }

    setDevice(device) {
        this.deviceMode = device;
        this.deviceButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-device') === device);
        });

        if (!this.previewContainer) return;

        this.previewContainer.classList.remove('device-desktop', 'device-tablet', 'device-mobile');
        this.previewContainer.classList.add(`device-${device}`);
    }

    toggleFullscreen() {
        if (!this.previewContainer) return;
        if (!document.fullscreenElement) {
            this.previewContainer.requestFullscreen().catch(err => {
                alert(`Error entering fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    scheduleAutoReload() {
        if (!this.autoReload) return;
        if (this.reloadDebounceTimer) clearTimeout(this.reloadDebounceTimer);
        this.reloadDebounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 500);
    }

    /**
     * Build combined HTML, CSS, JS document with sandboxed bridge script
     */
    updatePreview(forced = false) {
        if (!this.previewIframe) return;

        let activeHtmlName = 'index.html';
        if (this.workspace.activeFile && (this.workspace.activeFile.endsWith('.html') || this.workspace.activeFile.endsWith('.htm'))) {
            activeHtmlName = this.workspace.activeFile;
        }

        const htmlFile = this.workspace.getFile(activeHtmlName) || this.workspace.getFile('index.html');
        const cssFile = this.workspace.getFile('style.css');
        const jsFile = this.workspace.getFile('app.js');

        const htmlContent = htmlFile ? htmlFile.content : '<h1>Welcome to Live Playground</h1>';
        const cssContent = cssFile ? cssFile.content : '';
        const jsContent = jsFile ? jsFile.content : '';

        // Injection script to capture console, events, and DOM tree
        const bridgeScript = `
            <script>
            (function() {
                // Console capture
                const levels = ['log', 'info', 'warn', 'error'];
                levels.forEach(lvl => {
                    const orig = console[lvl];
                    console[lvl] = function(...args) {
                        orig.apply(console, args);
                        try {
                            const serialized = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
                            window.parent.postMessage({ type: 'PLAYGROUND_LOG', level: lvl, message: serialized }, '*');
                        } catch(e) {}
                    };
                });

                // Error capture
                window.addEventListener('error', function(e) {
                    window.parent.postMessage({ 
                        type: 'PLAYGROUND_LOG', 
                        level: 'error', 
                        message: e.message + ' at line ' + e.lineno 
                    }, '*');
                });

                // Event listener visualizer
                ['click', 'keydown', 'input', 'submit'].forEach(evName => {
                    document.addEventListener(evName, function(e) {
                        try {
                            const target = e.target;
                            const targetStr = target.tagName.toLowerCase() + 
                                (target.id ? '#' + target.id : '') + 
                                (target.className ? '.' + String(target.className).replace(/\\s+/g, '.') : '');
                            window.parent.postMessage({
                                type: 'PLAYGROUND_EVENT',
                                eventInfo: {
                                    eventType: evName,
                                    target: targetStr,
                                    time: new Date().toLocaleTimeString()
                                }
                            }, '*');
                        } catch(e) {}
                    }, true);
                });

                // DOM Tree extractor
                function extractNode(node) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        const txt = node.textContent.trim();
                        return txt ? { type: 'text', text: txt } : null;
                    }
                    if (node.nodeType !== Node.ELEMENT_NODE) return null;
                    
                    const children = [];
                    node.childNodes.forEach(child => {
                        const extracted = extractNode(child);
                        if (extracted) children.push(extracted);
                    });

                    const attrs = {};
                    for (let i = 0; i < node.attributes.length; i++) {
                        attrs[node.attributes[i].name] = node.attributes[i].value;
                    }

                    return {
                        type: 'element',
                        tag: node.tagName.toLowerCase(),
                        id: node.id || null,
                        classes: node.className || null,
                        attrs,
                        children
                    };
                }

                function sendDOM() {
                    try {
                        const tree = extractNode(document.body);
                        window.parent.postMessage({ type: 'PLAYGROUND_DOM_UPDATE', domTree: tree }, '*');
                    } catch(e) {}
                }

                window.addEventListener('DOMContentLoaded', sendDOM);
                setTimeout(sendDOM, 300);

                window.addEventListener('message', function(ev) {
                    if (ev.data && ev.data.action === 'GET_DOM') {
                        sendDOM();
                    }
                });
            })();
            </script>
        `;

        // Assemble full document
        let docContent = htmlContent;

        // Inject CSS
        if (docContent.includes('</head>')) {
            docContent = docContent.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
        } else {
            docContent = `<style>\n${cssContent}\n</style>\n` + docContent;
        }

        // Replace relative script src with inline script
        docContent = docContent.replace(/<script[^>]*src=["']app\.js["'][^>]*><\/script>/i, '');
        
        // Inject JS and bridge
        const scriptTags = `${bridgeScript}\n<script>\ntry {\n${jsContent}\n} catch(err) { console.error(err); }\n</script>`;
        if (docContent.includes('</body>')) {
            docContent = docContent.replace('</body>', `${scriptTags}\n</body>`);
        } else {
            docContent += scriptTags;
        }

        // Write to iframe via srcdoc for proper isolation
        this.previewIframe.srcdoc = docContent;
    }

    requestDOMState() {
        if (this.previewIframe && this.previewIframe.contentWindow) {
            this.previewIframe.contentWindow.postMessage({ action: 'GET_DOM' }, '*');
        }
    }

    handleIframeLog(level, message) {
        if (!this.consoleContainer) return;
        const logRow = document.createElement('div');
        logRow.className = `pg-log-row pg-log-${level}`;
        logRow.innerHTML = `<span class="log-tag">[${level.toUpperCase()}]</span> <span class="log-msg">${this.escapeHTML(message)}</span>`;
        this.consoleContainer.appendChild(logRow);
        this.consoleContainer.scrollTop = this.consoleContainer.scrollHeight;
    }

    handleIframeEvent(eventInfo) {
        if (!this.eventListContainer) return;
        const evRow = document.createElement('div');
        evRow.className = 'pg-event-row';
        evRow.innerHTML = `
            <span class="ev-time">${eventInfo.time}</span>
            <span class="ev-type badge">${eventInfo.eventType}</span>
            <span class="ev-target">${this.escapeHTML(eventInfo.target)}</span>
        `;
        this.eventListContainer.insertBefore(evRow, this.eventListContainer.firstChild);
    }

    renderDOMTree(domTree) {
        if (!this.domTreeContainer) return;
        if (!domTree) {
            this.domTreeContainer.innerHTML = '<div class="vis-empty">No DOM elements found</div>';
            return;
        }

        this.domTreeContainer.innerHTML = `
            <div class="dom-tree-view">
                <div class="dom-tree-title">DOM Hierarchy Visualizer</div>
                ${this.renderDOMNode(domTree)}
            </div>
        `;
    }

    renderDOMNode(node, depth = 0) {
        if (!node) return '';
        if (node.type === 'text') {
            return `<div class="dom-text-node" style="margin-left: ${depth * 16}px">"${this.escapeHTML(node.text)}"</div>`;
        }

        let attrStr = '';
        if (node.id) attrStr += ` <span class="dom-attr-id">#${node.id}</span>`;
        if (node.classes) attrStr += ` <span class="dom-attr-class">.${String(node.classes).split(' ').join('.')}</span>`;

        let html = `
            <div class="dom-element-node" style="margin-left: ${depth * 16}px">
                <span class="dom-tag">&lt;${node.tag}${attrStr}&gt;</span>
        `;

        if (node.children && node.children.length > 0) {
            for (const child of node.children) {
                html += this.renderDOMNode(child, depth + 1);
            }
        }

        html += `<span class="dom-tag close">&lt;/${node.tag}&gt;</span></div>`;
        return html;
    }

    escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}
