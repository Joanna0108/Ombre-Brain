"""
========================================
web/replay.py — 人生电影 / Life Replay
========================================

- GET /api/replay?start=YYYY-MM-DD&end=YYYY-MM-DD
  Uses a dedicated replay LLM (separate from dehydration) to generate
  cinematic film-style narration from memories in the given time range.

对外暴露：register(mcp)。
========================================
"""

import json as _json
import logging

from starlette.requests import Request
from starlette.responses import Response

from . import _shared as sh

logger = logging.getLogger("ombre_brain")

# ---- Replay LLM call (OpenAI-compatible, same pattern as dehydrator._chat) ----

_REPLAY_SYSTEM_PROMPT = """你是一位纪录片导演兼编剧。

用户会给你一段「记忆时间线」——按日期排列的事件列表。请你根据这些记忆，为一部人生纪录短片撰写旁白。

要求：
1. 给这部短片起一个**标题**（10字以内，诗意、有电影感）
2. 一句**副标题**（20字以内，点题）
3. 一句**封面描述**（30字以内，描述一个抽象的画面意象，用于生成封面）
4. 按**月份**分段，每段包含：
   - 该月的标题（5字以内）
   - 一段旁白（80-150字，第一人称或第二人称皆可，温暖、娓娓道来）

**重要规则：**
- 旁白必须基于真实记忆，不要编造事件。
- 如果某个月没有记忆，跳过该月。
- 语言：中文。风格：像纪录片《人生一串》或《是面包是空气是奇迹啊》——有温度、有细节、不做作。
- 不要用「用户」「她/他」这样的第三人称——用「你」。

返回纯 JSON（不要 markdown 代码块）：
{
  "title": "...",
  "subtitle": "...",
  "cover_description": "...",
  "scenes": [
    {
      "month": "6月",
      "title": "...",
      "narration": "..."
    }
  ]
}"""


def _build_memories_prompt(buckets: list) -> str:
    """Build a user prompt from a list of sorted bucket dicts."""
    lines = ["以下是这段时间的记忆时间线：", ""]
    for b in buckets:
        meta = b.get("metadata", {})
        event = meta.get("event_time", "") or meta.get("created", "")
        date = event[:10] if event else "?"
        name = meta.get("name", b.get("id", "?"))
        summary = meta.get("summary", "")
        content = b.get("content", "")
        # Use summary if available, else content snippet
        snippet = summary if summary else (content[:120] + "…" if len(content) > 120 else content)
        domain = "/".join(meta.get("domain", [])) if meta.get("domain") else ""
        v = meta.get("valence")
        a = meta.get("arousal")
        emotion = ""
        if v is not None and a is not None:
            if v >= 0.62:
                emotion = " [正面]" if a >= 0.5 else " [平静满足]"
            elif v <= 0.38:
                emotion = " [负面]" if a >= 0.5 else " [低落]"
            else:
                emotion = " [中性]"

        line = f"📅 {date} | {name}"
        if domain:
            line += f" | 领域:{domain}"
        if emotion:
            line += emotion
        if snippet:
            line += f"\n   {snippet}"
        lines.append(line)
    lines.append("")
    lines.append("请根据以上记忆时间线，为这部人生纪录片生成旁白。")
    return "\n".join(lines)


async def _call_replay_llm(prompt: str) -> dict:
    """Call the replay LLM and parse the JSON response."""
    cfg = sh.config.get("replay", {})
    api_key = cfg.get("api_key", "")
    base_url = cfg.get("base_url", "https://api.deepseek.com/v1")
    model = cfg.get("model", "deepseek-chat")
    max_tokens = cfg.get("max_tokens", 4096)
    temperature = cfg.get("temperature", 0.7)

    if not api_key:
        raise RuntimeError(
            "Replay LLM 未配置 API Key。请在 .env 中设置 OMBRE_REPLAY_API_KEY，"
            "或在 config.yaml 的 replay.api_key 中填写。"
        )

    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx 未安装，无法调用 Replay LLM")

    url = base_url.rstrip("/") + "/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": _REPLAY_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        resp.raise_for_status()
        data = resp.json()

    raw = ""
    try:
        choices = data.get("choices", [])
        if choices:
            raw = choices[0].get("message", {}).get("content", "")
    except Exception:
        raw = ""

    if not raw:
        raise RuntimeError("Replay LLM 返回为空，请检查 API Key 和模型配置。")

    # Strip markdown code fences if present
    raw = raw.strip()
    if raw.startswith("```"):
        # Remove opening ```json or ```
        raw = raw.split("\n", 1)[-1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        result = _json.loads(raw)
    except _json.JSONDecodeError:
        # Try to extract JSON from the response
        import re
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            try:
                result = _json.loads(match.group())
            except _json.JSONDecodeError:
                raise RuntimeError(f"Replay LLM 返回了无法解析的内容: {raw[:200]}")
        else:
            raise RuntimeError(f"Replay LLM 返回了无法解析的内容: {raw[:200]}")

    # Validate expected fields
    if not isinstance(result, dict):
        raise RuntimeError("Replay LLM 返回不是 JSON 对象")
    if "title" not in result:
        result["title"] = "记忆纪录片"
    if "scenes" not in result or not isinstance(result.get("scenes"), list):
        result["scenes"] = []
    return result


def register(mcp) -> None:

    @mcp.custom_route("/api/replay", methods=["GET"])
    async def api_replay(request: Request) -> Response:
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err

        start = request.query_params.get("start", "").strip()
        end = request.query_params.get("end", "").strip()

        if not start or not end:
            return JSONResponse(
                {"error": "需要 start 和 end 参数，格式 YYYY-MM-DD，例如 /api/replay?start=2026-06-01&end=2026-06-30"},
                status_code=400,
            )

        try:
            all_buckets = await sh.bucket_mgr.list_all(include_archive=False)

            # Filter by event_time in range, exclude certain types
            filtered = []
            for b in all_buckets:
                meta = b.get("metadata", {})
                if meta.get("deleted_at"):
                    continue
                t = meta.get("type", "dynamic")
                # Skip internal/structural buckets
                if t in ("plan", "letter", "self"):
                    continue
                event = meta.get("event_time") or meta.get("created", "")
                if not event:
                    continue
                date_str = event[:10]  # YYYY-MM-DD
                if start <= date_str <= end:
                    filtered.append(b)

            if not filtered:
                return JSONResponse(
                    {"error": f"在 {start} 到 {end} 之间没有找到记忆。"},
                    status_code=404,
                )

            # Sort by event_time
            def _sort_key(b):
                meta = b.get("metadata", {})
                return meta.get("event_time") or meta.get("created") or ""
            filtered.sort(key=_sort_key)

            # Build prompt and call LLM
            prompt = _build_memories_prompt(filtered)
            result = await _call_replay_llm(prompt)

            return JSONResponse({
                "start": start,
                "end": end,
                "memory_count": len(filtered),
                "title": result.get("title", ""),
                "subtitle": result.get("subtitle", ""),
                "cover_description": result.get("cover_description", ""),
                "scenes": result.get("scenes", []),
            })

        except RuntimeError as e:
            logger.warning(f"Replay generation failed: {e}")
            return JSONResponse({"error": str(e)}, status_code=500)
        except Exception as e:
            logger.error(f"Replay API error: {e}", exc_info=True)
            return JSONResponse({"error": f"生成失败: {e}"}, status_code=500)
