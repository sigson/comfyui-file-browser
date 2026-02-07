import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

/* ═══════════════════════════════════════════════════════════
   ComfyUI File Browser — DOM-based Frontend
   Multi-select: Ctrl+Click, Shift+Click
   ═══════════════════════════════════════════════════════════ */

const CSS = `
.fb-root {
    position: absolute;
    display: flex;
    flex-direction: column;
    background: #1a1a2e;
    border: 1px solid #3a3a5c;
    border-radius: 8px;
    overflow: hidden;
    font-family: 'Segoe UI', system-ui, sans-serif;
    color: #cdd6f4;
    font-size: 13px;
    user-select: none;
    z-index: 10;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

/* ── Toolbar ── */
.fb-toolbar {
    display: flex;
    gap: 3px;
    padding: 6px 8px;
    background: #232340;
    border-bottom: 1px solid #3a3a5c;
    flex-shrink: 0;
    flex-wrap: wrap;
}
.fb-toolbar button {
    background: #2e2e50;
    border: 1px solid #3a3a5c;
    color: #cdd6f4;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: background 0.15s;
    white-space: nowrap;
}
.fb-toolbar button:hover {
    background: #4a4a72;
}
.fb-toolbar button .btn-icon {
    font-size: 15px;
}

/* ── Path bar ── */
.fb-pathbar {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background: #1e1e36;
    border-bottom: 1px solid #3a3a5c;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    color: #b4a7f5;
    flex-shrink: 0;
    gap: 6px;
    min-height: 28px;
    overflow: hidden;
}
.fb-pathbar .path-icon {
    font-size: 15px;
    flex-shrink: 0;
}
.fb-pathbar .path-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    direction: rtl;
    text-align: left;
}
.fb-pathbar .path-text span {
    unicode-bidi: plaintext;
}

/* ── Selection info bar ── */
.fb-selbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 4px 10px;
    background: #2a2a52;
    border-bottom: 1px solid #3a3a5c;
    font-size: 11px;
    color: #b4befe;
    flex-shrink: 0;
    min-height: 24px;
}
.fb-selbar.active {
    display: flex;
}
.fb-selbar .sel-count {
    font-weight: 600;
}
.fb-selbar .sel-actions {
    display: flex;
    gap: 6px;
}
.fb-selbar .sel-actions button {
    background: none;
    border: none;
    color: #89b4fa;
    cursor: pointer;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    transition: background 0.1s;
}
.fb-selbar .sel-actions button:hover {
    background: #3a3a5c;
}
.fb-selbar .sel-actions button.danger {
    color: #f38ba8;
}

/* ── File list ── */
.fb-list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0;
}
.fb-list::-webkit-scrollbar {
    width: 8px;
}
.fb-list::-webkit-scrollbar-track {
    background: #1a1a2e;
}
.fb-list::-webkit-scrollbar-thumb {
    background: #4a4a6a;
    border-radius: 4px;
}
.fb-list::-webkit-scrollbar-thumb:hover {
    background: #5a5a8a;
}

/* ── File item ── */
.fb-item {
    display: flex;
    align-items: center;
    padding: 6px 10px;
    cursor: pointer;
    border-bottom: 1px solid #2a2a44;
    gap: 8px;
    transition: background 0.1s;
    min-height: 32px;
}
.fb-item:hover {
    background: #2a2a4a;
}
.fb-item.selected {
    background: #3a3a68;
}
.fb-item.selected:hover {
    background: #44448a;
}
.fb-item .item-check {
    width: 16px;
    height: 16px;
    border: 2px solid #4a4a6a;
    border-radius: 3px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: all 0.1s;
    cursor: pointer;
}
.fb-item .item-check:hover {
    border-color: #89b4fa;
    background: #89b4fa33;
}
.fb-item.selected .item-check {
    background: #89b4fa;
    border-color: #89b4fa;
    color: #1a1a2e;
}
.fb-item .item-icon {
    font-size: 16px;
    flex-shrink: 0;
    width: 22px;
    text-align: center;
}
.fb-item .item-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
}
.fb-item .item-name.is-folder {
    color: #f9e2af;
    font-weight: 600;
}
.fb-item .item-name.is-back {
    color: #89b4fa;
    font-style: italic;
}
.fb-item .item-size {
    font-size: 11px;
    color: #6c7086;
    font-family: monospace;
    flex-shrink: 0;
    margin-left: auto;
}

/* ── Back item has no checkbox ── */
.fb-item.back-item .item-check {
    display: none;
}

/* ── Status bar ── */
.fb-statusbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 10px;
    background: #232340;
    border-top: 1px solid #3a3a5c;
    font-size: 11px;
    color: #6c7086;
    flex-shrink: 0;
    min-height: 24px;
}

/* ── Loading / Error ── */
.fb-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px;
    color: #89b4fa;
    font-size: 14px;
    gap: 8px;
}
.fb-error {
    padding: 6px 12px;
    background: #f38ba833;
    color: #f38ba8;
    font-size: 12px;
    text-align: center;
    border-top: 1px solid #f38ba844;
    flex-shrink: 0;
}

/* ── Empty state ── */
.fb-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #585b70;
    gap: 8px;
}
.fb-empty .empty-icon { font-size: 36px; }
.fb-empty .empty-text { font-size: 13px; }

/* ── Drag overlay ── */
.fb-drag-overlay {
    display: none;
    position: absolute;
    inset: 0;
    background: rgba(137,180,250,0.12);
    border: 2px dashed #89b4fa;
    border-radius: 8px;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    color: #89b4fa;
    z-index: 100;
    pointer-events: none;
}
.fb-drag-overlay.active {
    display: flex;
}
`;

/* ─── Helpers ─── */
const FILE_ICONS = {
    image: "🖼️", video: "🎬", audio: "🎵", code: "💻",
    archive: "📦", text: "📝", model: "🧠", data: "📊",
};
const EXT_MAP = {
    image:   ["png","jpg","jpeg","gif","bmp","webp","svg","tiff","ico"],
    video:   ["mp4","avi","mkv","mov","wmv","flv","webm"],
    audio:   ["mp3","wav","ogg","flac","aac","wma","m4a"],
    code:    ["py","js","ts","html","css","json","xml","yaml","yml","toml","sh","bat","c","cpp","h","rs","go","java","lua"],
    archive: ["zip","tar","gz","bz2","7z","rar","xz"],
    text:    ["txt","md","log","csv","ini","cfg","conf"],
    model:   ["safetensors","ckpt","pt","pth","bin","onnx","gguf"],
    data:    ["db","sqlite","sql","parquet"],
};

function getFileIcon(name) {
    const ext = name.split(".").pop().toLowerCase();
    for (const [type, exts] of Object.entries(EXT_MAP)) {
        if (exts.includes(ext)) return FILE_ICONS[type];
    }
    return "📄";
}

function formatSize(bytes) {
    if (!bytes) return "";
    const units = ["B","KB","MB","GB","TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function escHtml(str) {
    const el = document.createElement("span");
    el.textContent = str;
    return el.innerHTML;
}

/* ─── API ─── */
async function apiGet(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${endpoint}?${qs}` : endpoint;
    const resp = await api.fetchApi(url);
    return resp.json();
}

async function apiPost(endpoint, body) {
    const resp = await api.fetchApi(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return resp.json();
}

async function apiUpload(path, files) {
    const fd = new FormData();
    fd.append("path", path);
    for (const f of files) fd.append("files", f, f.name);
    const resp = await api.fetchApi("/file_browser/upload", { method: "POST", body: fd });
    return resp.json();
}


/* ═══════════════════════════════════════════════════════════
   FileBrowser — full multi-select support
   ═══════════════════════════════════════════════════════════ */

class FileBrowser {
    constructor(node) {
        this.node = node;
        this.currentPath = "";
        this.entries = [];       // raw entries from server (no "..")
        this.displayList = [];   // entries + ".." prepended if needed
        this.isRoot = true;
        this.loading = false;
        this.error = null;

        // ── Multi-selection state ──
        this.selected = new Set();    // Set of entry names currently selected
        this.lastClickedIdx = -1;     // index in displayList for Shift range
        this._itemEls = new Map();    // name -> DOM element for fast highlight update

        this._injectCSS();
        this._buildDOM();
        this._setupDragDrop();
        this.loadDirectory("");
    }

    /* ═══════════ DOM Construction ═══════════ */

    _injectCSS() {
        if (document.getElementById("fb-styles")) return;
        const style = document.createElement("style");
        style.id = "fb-styles";
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    _buildDOM() {
        this.el = document.createElement("div");
        this.el.className = "fb-root";

        // ── Toolbar ──
        this.toolbar = document.createElement("div");
        this.toolbar.className = "fb-toolbar";

        const buttons = [
            { icon: "🏠", label: "", tip: "Root",       action: () => this.navigate("") },
            { icon: "⬆️", label: "", tip: "Up",         action: () => this.goUp() },
            { icon: "🔄", label: "", tip: "Refresh",    action: () => this.refresh() },
            { icon: "📤", label: "Upload",              action: () => this.uploadDialog() },
            { icon: "📁", label: "Folder",              action: () => this.createFolderDialog() },
            { icon: "📄", label: "File",                action: () => this.createFileDialog() },
            { icon: "✏️", label: "Rename",              action: () => this.renameDialog() },
            { icon: "🗑️", label: "Delete",              action: () => this.deleteSelected() },
            { icon: "📥", label: "Download",            action: () => this.downloadSelected() },
        ];

        for (const b of buttons) {
            const btn = document.createElement("button");
            btn.title = b.tip || b.label;
            btn.innerHTML = `<span class="btn-icon">${b.icon}</span>${b.label ? `<span>${b.label}</span>` : ""}`;
            btn.addEventListener("click", (e) => { e.stopPropagation(); b.action(); });
            btn.addEventListener("pointerdown", (e) => e.stopPropagation());
            btn.addEventListener("mousedown", (e) => e.stopPropagation());
            this.toolbar.appendChild(btn);
        }
        this.el.appendChild(this.toolbar);

        // ── Path bar ──
        this.pathBar = document.createElement("div");
        this.pathBar.className = "fb-pathbar";
        this.pathBar.innerHTML = `<span class="path-icon">📂</span><div class="path-text"><span>/</span></div>`;
        this.el.appendChild(this.pathBar);

        // ── Selection info bar ──
        this.selBar = document.createElement("div");
        this.selBar.className = "fb-selbar";
        this.selBar.innerHTML = `
            <span class="sel-count"></span>
            <div class="sel-actions">
                <button class="sel-all" title="Select all">☑ All</button>
                <button class="sel-none" title="Deselect all">☐ None</button>
                <button class="sel-invert" title="Invert selection">⇄ Invert</button>
                <button class="danger sel-del" title="Delete selected">🗑️ Delete</button>
                <button class="sel-dl" title="Download selected">📥 Download</button>
            </div>
        `;
        this.selBar.querySelector(".sel-all").addEventListener("click", (e) => { e.stopPropagation(); this.selectAll(); });
        this.selBar.querySelector(".sel-none").addEventListener("click", (e) => { e.stopPropagation(); this.selectNone(); });
        this.selBar.querySelector(".sel-invert").addEventListener("click", (e) => { e.stopPropagation(); this.selectInvert(); });
        this.selBar.querySelector(".sel-del").addEventListener("click", (e) => { e.stopPropagation(); this.deleteSelected(); });
        this.selBar.querySelector(".sel-dl").addEventListener("click", (e) => { e.stopPropagation(); this.downloadSelected(); });
        this.selBar.querySelectorAll("button").forEach(b => {
            b.addEventListener("pointerdown", (e) => e.stopPropagation());
            b.addEventListener("mousedown", (e) => e.stopPropagation());
        });
        this.el.appendChild(this.selBar);

        // ── File list ──
        this.listEl = document.createElement("div");
        this.listEl.className = "fb-list";
        this.listEl.addEventListener("pointerdown", (e) => e.stopPropagation());
        this.listEl.addEventListener("mousedown", (e) => e.stopPropagation());
        this.listEl.addEventListener("wheel", (e) => e.stopPropagation());
        // Click on empty area -> deselect
        this.listEl.addEventListener("click", (e) => {
            if (e.target === this.listEl) this.selectNone();
        });
        this.el.appendChild(this.listEl);

        // ── Status bar ──
        this.statusBar = document.createElement("div");
        this.statusBar.className = "fb-statusbar";
        this.statusBar.textContent = "Ready";
        this.el.appendChild(this.statusBar);

        // ── Error bar ──
        this.errorBar = document.createElement("div");
        this.errorBar.className = "fb-error";
        this.errorBar.style.display = "none";
        this.el.appendChild(this.errorBar);

        // ── Drag overlay ──
        this.dragOverlay = document.createElement("div");
        this.dragOverlay.className = "fb-drag-overlay";
        this.dragOverlay.textContent = "📤 Drop files here to upload";
        this.el.appendChild(this.dragOverlay);

        document.body.appendChild(this.el);
    }

    _setupDragDrop() {
        let dragCounter = 0;
        this.el.addEventListener("dragenter", (e) => { e.preventDefault(); dragCounter++; this.dragOverlay.classList.add("active"); });
        this.el.addEventListener("dragleave", (e) => { e.preventDefault(); dragCounter--; if (dragCounter <= 0) { dragCounter = 0; this.dragOverlay.classList.remove("active"); } });
        this.el.addEventListener("dragover", (e) => e.preventDefault());
        this.el.addEventListener("drop", async (e) => {
            e.preventDefault(); dragCounter = 0; this.dragOverlay.classList.remove("active");
            if (e.dataTransfer?.files?.length) await this._doUpload(e.dataTransfer.files);
        });
    }

    /* ═══════════ Position Sync ═══════════ */

    updatePosition() {
        const canvas = app.canvas;
        if (!canvas || !this.node) { this.el.style.display = "none"; return; }
        if (this.node.flags?.collapsed) { this.el.style.display = "none"; return; }

        const scale = canvas.ds.scale;
        const offset = canvas.ds.offset;
        const rect = canvas.canvas.getBoundingClientRect();

        const nodeX = this.node.pos[0] * scale + offset[0] * scale + rect.left;
        const nodeY = this.node.pos[1] * scale + offset[1] * scale + rect.top;
        const nodeW = this.node.size[0] * scale;
        const nodeH = this.node.size[1] * scale;
        const titleH = 30 * scale;

        this.el.style.display = "flex";
        this.el.style.left = nodeX + "px";
        this.el.style.top = (nodeY + titleH) + "px";
        this.el.style.width = nodeW + "px";
        this.el.style.height = (nodeH - titleH) + "px";
        this.el.style.fontSize = Math.max(10, 13 * scale) + "px";
    }

    /* ═══════════ Data Loading ═══════════ */

    async loadDirectory(path) {
        this.loading = true;
        this.error = null;
        this.selected.clear();
        this.lastClickedIdx = -1;
        this._renderLoading();

        try {
            const data = await apiGet("/file_browser/list", { path: path || "." });
            if (data.error) {
                this.error = data.error;
            } else {
                this.currentPath = data.current_path || "";
                this.entries = data.entries || [];
                this.isRoot = data.is_root;

                // ─── ДОБАВЛЕННЫЙ КОД НАЧАЛО ───
                // Находим виджет 'path' в узле и обновляем его значение
                if (this.node && this.node.widgets) {
                    const pathWidget = this.node.widgets.find(w => w.name === "path");
                    if (pathWidget) {
                        pathWidget.value = this.currentPath;
                    }
                }
                // ─── ДОБАВЛЕННЫЙ КОД КОНЕЦ ───
            }
        } catch (e) {
            this.error = "Connection error: " + e.message;
        }

        this.loading = false;
        this._rebuildDisplayList();
        this._render();
    }

    _rebuildDisplayList() {
        this.displayList = [];
        if (!this.isRoot) {
            this.displayList.push({ name: "..", is_dir: true, size: 0, _isBack: true });
        }
        this.displayList.push(...this.entries);
    }

    async refresh() { await this.loadDirectory(this.currentPath); }
    async navigate(path) { await this.loadDirectory(path); }

    goUp() {
        if (this.isRoot) return;
        const parts = this.currentPath.split("/").filter(Boolean);
        parts.pop();
        this.navigate(parts.join("/"));
    }

    /* ═══════════ Selection Logic ═══════════ */

    /**
     * Handle a click on item at displayList[index].
     * @param {number} idx — index in displayList
     * @param {boolean} ctrlKey
     * @param {boolean} shiftKey
     */
    _handleItemClick(idx, ctrlKey, shiftKey) {
        const entry = this.displayList[idx];
        if (!entry || entry._isBack) return;

        if (shiftKey && this.lastClickedIdx >= 0) {
            // ── Shift+Click: range select ──
            const from = Math.min(this.lastClickedIdx, idx);
            const to = Math.max(this.lastClickedIdx, idx);
            if (!ctrlKey) this.selected.clear();
            for (let i = from; i <= to; i++) {
                const e = this.displayList[i];
                if (e && !e._isBack) this.selected.add(e.name);
            }
        } else if (ctrlKey) {
            // ── Ctrl+Click: toggle single ──
            if (this.selected.has(entry.name)) {
                this.selected.delete(entry.name);
            } else {
                this.selected.add(entry.name);
            }
            this.lastClickedIdx = idx;
        } else {
            // ── Fallback: toggle (should not normally be reached) ──
            if (this.selected.has(entry.name)) {
                this.selected.delete(entry.name);
            } else {
                this.selected.add(entry.name);
            }
            this.lastClickedIdx = idx;
        }

        this._syncSelectionUI();
    }

    selectAll() {
        this.selected.clear();
        for (const e of this.entries) {
            this.selected.add(e.name);
        }
        this._syncSelectionUI();
    }

    selectNone() {
        this.selected.clear();
        this.lastClickedIdx = -1;
        this._syncSelectionUI();
    }

    selectInvert() {
        const newSet = new Set();
        for (const e of this.entries) {
            if (!this.selected.has(e.name)) newSet.add(e.name);
        }
        this.selected = newSet;
        this._syncSelectionUI();
    }

    /** Efficiently update .selected class + selBar without full re-render */
    _syncSelectionUI() {
        // Update item highlights
        for (const [name, el] of this._itemEls) {
            el.classList.toggle("selected", this.selected.has(name));
            const chk = el.querySelector(".item-check");
            if (chk) chk.textContent = this.selected.has(name) ? "✓" : "";
        }

        // Update selection bar
        const count = this.selected.size;
        if (count > 0) {
            this.selBar.classList.add("active");
            const selEntries = this.entries.filter(e => this.selected.has(e.name));
            const dirs = selEntries.filter(e => e.is_dir).length;
            const files = selEntries.filter(e => !e.is_dir).length;
            const size = selEntries.reduce((s, e) => s + (e.is_dir ? 0 : e.size), 0);
            let text = `✅ ${count} selected`;
            const parts = [];
            if (dirs) parts.push(`${dirs} folder(s)`);
            if (files) parts.push(`${files} file(s)`);
            if (parts.length) text += ` — ${parts.join(", ")}`;
            if (size > 0) text += ` — ${formatSize(size)}`;
            this.selBar.querySelector(".sel-count").textContent = text;
        } else {
            this.selBar.classList.remove("active");
        }

        // Update status bar
        this._updateStatusBar();
    }

    /** Get array of selected entry names (excluding "..") */
    _getSelectedNames() {
        return [...this.selected];
    }

    /* ═══════════ Actions ═══════════ */

    uploadDialog() {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.style.display = "none";
        input.onchange = async () => {
            if (input.files?.length) await this._doUpload(input.files);
            input.remove();
        };
        document.body.appendChild(input);
        input.click();
    }

    async _doUpload(files) {
        this.loading = true;
        this._renderLoading();
        try {
            const res = await apiUpload(this.currentPath || ".", files);
            if (res.error) this._showError(res.error);
            else this._showStatus(`✅ Uploaded ${res.uploaded?.length || 0} file(s)`);
        } catch (e) {
            this._showError("Upload failed: " + e.message);
        }
        await this.refresh();
    }

    createFolderDialog() {
        const name = prompt("📁 New folder name:");
        if (!name) return;
        this._doAction("/file_browser/create_folder", { path: this.currentPath || ".", name });
    }

    createFileDialog() {
        const name = prompt("📄 New file name:");
        if (!name) return;
        this._doAction("/file_browser/create_file", { path: this.currentPath || ".", name, content: "" });
    }

    renameDialog() {
        const names = this._getSelectedNames();
        if (names.length === 0) return alert("⚠️ Select an item first!");
        if (names.length > 1) return alert("⚠️ Rename works on a single item. Select only one!");
        const oldName = names[0];
        const newName = prompt("✏️ Rename to:", oldName);
        if (!newName || newName === oldName) return;
        this._doAction("/file_browser/rename", {
            path: this.currentPath || ".",
            old_name: oldName,
            new_name: newName,
        });
    }

    async deleteSelected() {
        const names = this._getSelectedNames();
        if (names.length === 0) return alert("⚠️ Select item(s) first!");

        const msg = names.length === 1
            ? `🗑️ Delete "${names[0]}"?`
            : `🗑️ Delete ${names.length} items?\n\n${names.join("\n")}`;
        if (!confirm(msg)) return;

        this.loading = true;
        this._renderLoading();

        try {
            if (names.length === 1) {
                const res = await apiPost("/file_browser/delete", {
                    path: this.currentPath || ".",
                    name: names[0],
                });
                if (res.error) this._showError(res.error);
                else this._showStatus(`✅ Deleted "${names[0]}"`);
            } else {
                const res = await apiPost("/file_browser/delete_batch", {
                    path: this.currentPath || ".",
                    names: names,
                });
                if (res.errors?.length) {
                    this._showError(`Deleted ${res.deleted?.length || 0}, errors: ${res.errors.join("; ")}`);
                } else {
                    this._showStatus(`✅ Deleted ${res.deleted?.length || 0} item(s)`);
                }
            }
        } catch (e) {
            this._showError(e.message);
        }
        await this.refresh();
    }

    downloadSelected() {
        const names = this._getSelectedNames();
        if (names.length === 0) return alert("⚠️ Select file(s) first!");

        // Filter to files only
        const fileNames = names.filter(n => {
            const entry = this.entries.find(e => e.name === n);
            return entry && !entry.is_dir;
        });

        if (fileNames.length === 0) return alert("⚠️ No files selected (only folders are selected).");

        // Download each file
        for (const name of fileNames) {
            const filePath = this.currentPath ? this.currentPath + "/" + name : name;
            const a = document.createElement("a");
            a.href = `/file_browser/download?path=${encodeURIComponent(filePath)}`;
            a.download = name;
            a.click();
        }

        this._showStatus(`📥 Downloading ${fileNames.length} file(s)...`);
    }

    async _doAction(endpoint, body) {
        this.loading = true;
        this._renderLoading();
        try {
            const res = await apiPost(endpoint, body);
            if (res.error) this._showError(res.error);
        } catch (e) {
            this._showError(e.message);
        }
        await this.refresh();
    }

    /* ═══════════ Rendering ═══════════ */

    _render() {
        // Path bar
        this.pathBar.querySelector(".path-text span").textContent = "/" + (this.currentPath || "");

        // Clear list & item map
        this.listEl.innerHTML = "";
        this._itemEls.clear();

        // Error
        if (this.error) {
            this._showError(this.error);
        } else {
            this.errorBar.style.display = "none";
        }

        // Build items
        if (this.displayList.length === 0) {
            const empty = document.createElement("div");
            empty.className = "fb-empty";
            empty.innerHTML = `<div class="empty-icon">📭</div><div class="empty-text">Empty directory</div>`;
            this.listEl.appendChild(empty);
        } else {
            for (let i = 0; i < this.displayList.length; i++) {
                const entry = this.displayList[i];
                const el = this._createItemEl(entry, i);
                this.listEl.appendChild(el);
                if (!entry._isBack) {
                    this._itemEls.set(entry.name, el);
                }
            }
        }

        this._syncSelectionUI();
    }

    _createItemEl(entry, displayIdx) {
        const div = document.createElement("div");
        div.className = "fb-item" + (entry._isBack ? " back-item" : "");
        if (!entry._isBack && this.selected.has(entry.name)) div.classList.add("selected");

        const icon = entry._isBack ? "⬆️" : (entry.is_dir ? "📁" : getFileIcon(entry.name));
        const nameClass = entry._isBack ? "is-back" : (entry.is_dir ? "is-folder" : "");
        const checkMark = (!entry._isBack && this.selected.has(entry.name)) ? "✓" : "";

        div.innerHTML = `
            <div class="item-check">${checkMark}</div>
            <span class="item-icon">${icon}</span>
            <span class="item-name ${nameClass}">${escHtml(entry.name)}</span>
            ${!entry.is_dir && entry.size ? `<span class="item-size">${formatSize(entry.size)}</span>` : ""}
        `;

        // ── Checkbox click → always toggle selection ──
        const checkEl = div.querySelector(".item-check");
        if (checkEl) {
            checkEl.addEventListener("click", (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (entry._isBack) return;
                // Checkbox click = toggle like Ctrl+Click
                this._handleItemClick(displayIdx, true, e.shiftKey);
            });
        }

        // ── Row click: select ONLY with Ctrl or Shift ──
        div.addEventListener("click", (e) => {
            e.stopPropagation();
            if (entry._isBack) {
                this.goUp();
                return;
            }
            const isCtrl = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;
            // Normal click without modifiers → do nothing (don't select)
            if (!isCtrl && !isShift) return;
            this._handleItemClick(displayIdx, isCtrl, isShift);
        });

        // ── Double click → navigate ──
        div.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            if (entry._isBack) {
                this.goUp();
            } else if (entry.is_dir) {
                const newPath = this.currentPath ? this.currentPath + "/" + entry.name : entry.name;
                this.navigate(newPath);
            }
        });

        return div;
    }

    _updateStatusBar() {
        const dirs = this.entries.filter(e => e.is_dir).length;
        const files = this.entries.filter(e => !e.is_dir).length;
        const totalSize = this.entries.reduce((s, e) => s + (e.is_dir ? 0 : e.size), 0);
        let text = `${dirs} folder(s), ${files} file(s)`;
        if (totalSize > 0) text += ` — ${formatSize(totalSize)}`;
        if (this.selected.size > 0) text += `  |  ${this.selected.size} selected`;
        this.statusBar.textContent = text;
    }

    _renderLoading() {
        this.listEl.innerHTML = `<div class="fb-loading">⏳ Loading...</div>`;
    }

    _showError(msg) {
        this.errorBar.textContent = "⚠ " + msg;
        this.errorBar.style.display = "block";
        setTimeout(() => { this.errorBar.style.display = "none"; }, 4000);
    }

    _showStatus(msg) {
        this.statusBar.textContent = msg;
    }

    destroy() {
        this.el?.remove();
    }
}


/* ═══════════════════════════════════════════════════════════
   Register Extension
   ═══════════════════════════════════════════════════════════ */

app.registerExtension({
    name: "comfy.FileBrowser",

    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== "FileBrowser") return;

        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            origCreated?.apply(this, arguments);

            this.size = [480, 550];
            this.resizable = true;
            this.serialize_widgets = true;

            this._fileBrowser = new FileBrowser(this);

            this._fbRAF = null;
            const updateLoop = () => {
                if (this._fileBrowser) this._fileBrowser.updatePosition();
                this._fbRAF = requestAnimationFrame(updateLoop);
            };
            updateLoop();
        };

        const origRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            if (this._fbRAF) cancelAnimationFrame(this._fbRAF);
            this._fileBrowser?.destroy();
            this._fileBrowser = null;
            origRemoved?.apply(this, arguments);
        };
    },
});
