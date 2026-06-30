"""
========================================
web/v2_static.py — v2 前端静态文件服务
========================================

从 OmbreBrain-folio 迁移的 v2 React SPA（时间线 / Cells / Console）静态资源托管。
路由 /v2/{rel:path} 映射到 frontend/v2/ 目录。

对外暴露：register(mcp)。
========================================
"""

import os as _os
import re as _re
from starlette.requests import Request
from starlette.responses import Response

from . import _shared as sh


def _serve_v2(rel_path: str) -> Response:
    """Serves a file from frontend/v2/ with correct MIME and caching."""
    from starlette.responses import Response, JSONResponse, RedirectResponse
    import mimetypes

    rel = (rel_path or "").lstrip("/")
    if not rel:
        rel = "index.html"

    # Security: reject absolute paths and traversal
    norm = _os.path.normpath(rel).replace("\\", "/")
    if norm.startswith("..") or _os.path.isabs(norm):
        return JSONResponse({"error": "bad path"}, status_code=400)

    base = _os.path.join(sh.repo_root, "frontend", "v2")
    abs_path = _os.path.join(base, norm)

    # Double-check abs_path is still inside v2/
    if not _os.path.realpath(abs_path).startswith(_os.path.realpath(base)):
        return JSONResponse({"error": "bad path"}, status_code=400)

    # Console sub-tabs (breath, config, import, trash) all map to console/index.html
    console_base = _os.path.join(base, "console")
    if abs_path.startswith(console_base) and not _os.path.exists(abs_path):
        tail = abs_path[len(console_base):].replace("\\", "/").strip("/")
        if tail in ("breath", "config", "import", "trash"):
            if not rel_path.endswith("/"):
                return RedirectResponse(
                    url="/v2/console/" + tail + "/", status_code=301
                )
            abs_path = _os.path.join(console_base, "index.html")

    # Directory handling: /v2/cells/ → /v2/cells/index.html
    # /v2/cells (no trailing slash) → 301 → /v2/cells/
    if _os.path.isdir(abs_path):
        if not rel_path.endswith("/"):
            return RedirectResponse(url="/v2/" + norm + "/", status_code=301)
        candidate = _os.path.join(abs_path, "index.html")
        if _os.path.isfile(candidate):
            abs_path = candidate

    if not _os.path.isfile(abs_path):
        return JSONResponse({"error": "not found", "path": norm}, status_code=404)

    mime, _ = mimetypes.guess_type(abs_path)
    # MIME fallbacks
    if not mime:
        if abs_path.endswith(".woff2"):
            mime = "font/woff2"
        elif abs_path.endswith(".jsx"):
            mime = "text/javascript"
        else:
            mime = "application/octet-stream"

    # Cache-Control: hashed UUID assets are immutable (1 year); fonts/images by week; HTML/hand-edited scripts no-cache
    rel_under_v2 = _os.path.relpath(abs_path, base).replace("\\", "/")
    fname = _os.path.basename(rel_under_v2)
    is_hashed_asset = (
        "/assets/" in ("/" + rel_under_v2)
        and bool(
            _re.match(
                r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(js|jsx|woff2)$",
                fname,
            )
        )
    )
    if is_hashed_asset:
        cache_header = "public, max-age=31536000, immutable"
    elif fname.endswith((".woff2", ".ico", ".png", ".svg")):
        cache_header = "public, max-age=604800"
    else:
        cache_header = "no-cache"

    with open(abs_path, "rb") as f:
        return Response(f.read(), media_type=mime, headers={"Cache-Control": cache_header})


def register(mcp) -> None:

    @mcp.custom_route("/v2/{rel:path}", methods=["GET"])
    async def v2_static(request: Request) -> Response:
        """Serve v2 frontend static files.

        Examples:
          /v2/              → timeline index.html
          /v2/cells/        → cells/index.html
          /v2/console/      → console/index.html
          /v2/console/breath/ → console/index.html (JS reads pathname)
          /v2/assets/xxx.woff2 → cached 1yr
        """
        rel = request.path_params.get("rel", "")
        return _serve_v2(rel)

    @mcp.custom_route("/v2", methods=["GET"])
    async def v2_root(request: Request) -> Response:
        """/v2 without trailing slash → redirect to /v2/ for correct relative paths."""
        from starlette.responses import RedirectResponse
        return RedirectResponse(url="/v2/", status_code=302)
