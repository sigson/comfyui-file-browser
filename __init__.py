"""
ComfyUI File Browser Node
"""

import os
import json
import shutil
from aiohttp import web
from server import PromptServer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _safe_path(requested_path):
    if not requested_path or requested_path == ".":
        return os.path.realpath(BASE_DIR)
    resolved = os.path.realpath(os.path.join(BASE_DIR, requested_path))
    if not resolved.startswith(os.path.realpath(BASE_DIR)):
        raise PermissionError("Access denied: path outside base directory")
    return resolved


def _get_dir_contents(dir_path):
    entries = []
    try:
        for name in os.listdir(dir_path):
            full = os.path.join(dir_path, name)
            is_dir = os.path.isdir(full)
            try:
                size = os.path.getsize(full) if not is_dir else 0
                mtime = os.path.getmtime(full)
            except OSError:
                size = 0
                mtime = 0
            entries.append({
                "name": name,
                "is_dir": is_dir,
                "size": size,
                "mtime": mtime,
            })
    except PermissionError:
        pass
    entries.sort(key=lambda e: (not e["is_dir"], e["name"].lower()))
    return entries


# ── API Routes ──

@PromptServer.instance.routes.get("/file_browser/list")
async def list_directory(request):
    rel_path = request.query.get("path", ".")
    try:
        abs_path = _safe_path(rel_path)
        if not os.path.isdir(abs_path):
            return web.json_response({"error": "Not a directory"}, status=400)
        entries = _get_dir_contents(abs_path)
        current_rel = os.path.relpath(abs_path, BASE_DIR)
        if current_rel == ".":
            current_rel = ""
        return web.json_response({
            "current_path": current_rel,
            "base_dir": BASE_DIR,
            "entries": entries,
            "is_root": os.path.realpath(abs_path) == os.path.realpath(BASE_DIR),
        })
    except PermissionError as e:
        return web.json_response({"error": str(e)}, status=403)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/file_browser/create_folder")
async def create_folder(request):
    data = await request.json()
    rel_path = data.get("path", "")
    folder_name = data.get("name", "")
    if not folder_name:
        return web.json_response({"error": "Folder name required"}, status=400)
    try:
        target = os.path.join(_safe_path(rel_path), folder_name)
        if not os.path.realpath(target).startswith(os.path.realpath(BASE_DIR)):
            raise PermissionError("Access denied")
        os.makedirs(target, exist_ok=True)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/file_browser/create_file")
async def create_file_route(request):
    data = await request.json()
    rel_path = data.get("path", "")
    file_name = data.get("name", "")
    content = data.get("content", "")
    if not file_name:
        return web.json_response({"error": "File name required"}, status=400)
    try:
        target = os.path.join(_safe_path(rel_path), file_name)
        if not os.path.realpath(target).startswith(os.path.realpath(BASE_DIR)):
            raise PermissionError("Access denied")
        with open(target, "w", encoding="utf-8") as f:
            f.write(content)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/file_browser/delete")
async def delete_item(request):
    """Delete a single file or folder."""
    data = await request.json()
    rel_path = data.get("path", "")
    name = data.get("name", "")
    if not name:
        return web.json_response({"error": "Name required"}, status=400)
    try:
        target = os.path.join(_safe_path(rel_path), name)
        if not os.path.realpath(target).startswith(os.path.realpath(BASE_DIR)):
            raise PermissionError("Access denied")
        if not os.path.exists(target):
            return web.json_response({"error": "Not found"}, status=404)
        if os.path.isdir(target):
            shutil.rmtree(target)
        else:
            os.remove(target)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/file_browser/delete_batch")
async def delete_batch(request):
    """Delete multiple files/folders at once."""
    data = await request.json()
    rel_path = data.get("path", "")
    names = data.get("names", [])
    if not names:
        return web.json_response({"error": "Names list required"}, status=400)

    deleted = []
    errors = []
    base = _safe_path(rel_path)

    for name in names:
        try:
            target = os.path.join(base, name)
            if not os.path.realpath(target).startswith(os.path.realpath(BASE_DIR)):
                errors.append(f"{name}: access denied")
                continue
            if not os.path.exists(target):
                errors.append(f"{name}: not found")
                continue
            if os.path.isdir(target):
                shutil.rmtree(target)
            else:
                os.remove(target)
            deleted.append(name)
        except Exception as e:
            errors.append(f"{name}: {str(e)}")

    return web.json_response({
        "success": True,
        "deleted": deleted,
        "errors": errors,
    })


@PromptServer.instance.routes.post("/file_browser/rename")
async def rename_item(request):
    data = await request.json()
    rel_path = data.get("path", "")
    old_name = data.get("old_name", "")
    new_name = data.get("new_name", "")
    if not old_name or not new_name:
        return web.json_response({"error": "Both names required"}, status=400)
    try:
        base = _safe_path(rel_path)
        old_target = os.path.join(base, old_name)
        new_target = os.path.join(base, new_name)
        for t in [old_target, new_target]:
            if not os.path.realpath(t).startswith(os.path.realpath(BASE_DIR)):
                raise PermissionError("Access denied")
        if not os.path.exists(old_target):
            return web.json_response({"error": "Not found"}, status=404)
        os.rename(old_target, new_target)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


@PromptServer.instance.routes.post("/file_browser/upload")
async def upload_files(request):
    reader = await request.multipart()
    rel_path = ""
    uploaded = []
    while True:
        part = await reader.next()
        if part is None:
            break
        if part.name == "path":
            rel_path = (await part.text()).strip()
        elif part.name == "files":
            filename = part.filename
            if not filename:
                continue
            try:
                dest_dir = _safe_path(rel_path)
                dest_file = os.path.join(dest_dir, filename)
                if not os.path.realpath(dest_file).startswith(os.path.realpath(BASE_DIR)):
                    continue
                with open(dest_file, "wb") as f:
                    while True:
                        chunk = await part.read_chunk()
                        if not chunk:
                            break
                        f.write(chunk)
                uploaded.append(filename)
            except Exception as e:
                print(f"[FileBrowser] Upload error for {filename}: {e}")
    return web.json_response({"success": True, "uploaded": uploaded})


@PromptServer.instance.routes.get("/file_browser/download")
async def download_file(request):
    rel_path = request.query.get("path", "")
    try:
        abs_path = _safe_path(rel_path)
        if not os.path.isfile(abs_path):
            return web.json_response({"error": "Not a file"}, status=400)
        return web.FileResponse(abs_path)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)


# ── Node ──

class FileBrowserNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                # Добавляем виджет 'path', чтобы JS мог записывать сюда текущий путь
                "path": ("STRING", {"default": "", "multiline": False}),
            },
            "optional": {
                "trigger": ("*", {}),
            },
            "hidden": {
                "unique_id": "UNIQUE_ID",
            },
        }

    RETURN_TYPES = ("STRING", "STRING",)
    RETURN_NAMES = ("file_path", "directory_path",)
    FUNCTION = "execute"
    CATEGORY = "utils"
    OUTPUT_NODE = True

    def execute(self, path="", unique_id=None, **kwargs):
        # Если путь пустой, используем корень
        rel_path = path if path else ""
        
        # Формируем полный абсолютный путь
        full_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
        
        # Проверяем безопасность (чтобы не выйти за пределы папки ComfyUI, если это важно)
        if not full_path.startswith(os.path.abspath(BASE_DIR)):
             # Если путь выходит за пределы, возвращаем BASE_DIR во избежание ошибок
            full_path = os.path.abspath(BASE_DIR)

        # Возвращаем полный путь в оба выхода
        return (full_path, full_path,)


NODE_CLASS_MAPPINGS = {"FileBrowser": FileBrowserNode}
NODE_DISPLAY_NAME_MAPPINGS = {"FileBrowser": "📁 File Browser"}
WEB_DIRECTORY = "./js"
__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
