#!/usr/bin/env python3
"""
导入种子记忆到 Ombre Brain

用法:
  python scripts/seed-import.py                 # JSON 优先，没有则读 MD
  python scripts/seed-import.py --dry-run       # 预览不写入
  python scripts/seed-import.py --json          # 强制读 seed-memories.json
  python scripts/seed-import.py --md            # 强制读 seed-memories.md

环境变量:
  OMBRE_URL   服务地址 (默认 http://localhost:8000)
  OMBRE_PWD   Dashboard 密码
"""

import json
import os
import re
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin

OMBRE_URL = os.environ.get("OMBRE_URL", "http://localhost:8000")
OMBRE_PWD = os.environ.get("OMBRE_PWD", "")
HERE = os.path.dirname(os.path.abspath(__file__))


def api(path, data=None):
    url = urljoin(OMBRE_URL.rstrip("/") + "/", path.lstrip("/"))
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if OMBRE_PWD:
        headers["Authorization"] = "Bearer " + OMBRE_PWD
    with urlopen(Request(url, data=body, headers=headers), timeout=30) as r:
        return json.loads(r.read().decode())


def load_json():
    fp = os.path.join(HERE, "seed-memories.json")
    if not os.path.isfile(fp):
        return None
    with open(fp, "r", encoding="utf-8") as f:
        return json.load(f)


def load_md():
    """解析 YAML 头 + 正文（兜底用）"""
    fp = os.path.join(HERE, "seed-memories.md")
    if not os.path.isfile(fp):
        return None
    text = open(fp, "r", encoding="utf-8").read()
    blocks, buf = [], []
    for line in text.split("\n"):
        if line.strip() == "---":
            if buf:
                blocks.append("\n".join(buf)); buf = []
        else:
            buf.append(line)
    if buf:
        blocks.append("\n".join(buf))

    out = []
    for raw in blocks:
        raw = raw.strip()
        if not raw.startswith("title:"):
            continue
        parts = raw.split("\n\n", 1)
        header = parts[0]
        body = parts[1].strip() if len(parts) > 1 else ""
        meta = {}
        for line in header.split("\n"):
            m = re.match(r'^(\w+):\s*(.+)$', line.strip())
            if not m: continue
            k, v = m.group(1), m.group(2).strip()
            if v.lower() in ('true','false'):   meta[k] = v.lower() == 'true'
            elif re.match(r'^-?\d+\.?\d*$', v): meta[k] = float(v) if '.' in v else int(v)
            elif v.startswith('['):
                meta[k] = [s.strip().strip('"').strip("'") for s in v[1:-1].split(',') if s.strip()]
            elif v.startswith('"'):
                meta[k] = v[1:-1]
            else:
                meta[k] = v
        meta["_body"] = body
        out.append(meta)
    return out


def md_to_body(m):
    body = {
        "name": m.get("title", ""),
        "content": m.get("_body", ""),
        "importance": m.get("importance", 5),
        "tags": m.get("tags", []),
        "protected": m.get("protected", False),
        "highlight": m.get("highlight", False),
        "event_time": m.get("date", "2026-07-01") + "T12:00:00",
    }
    if m.get("domain"):
        body["domain"] = m["domain"]
    typ = m.get("type", "")
    if typ == "feel":
        body["type"] = "feel"
        body["valence"] = m.get("valence", 0.5)
        body["arousal"] = m.get("arousal", 0.3)
    elif typ == "plan":
        body["type"] = "plan"
    elif typ == "letter":
        body["type"] = "letter"
    elif typ == "anchor" or m.get("anchor"):
        body["anchor"] = True
    body["summary"] = body["content"][:80].replace("\n", " ") + ("…" if len(body["content"]) > 80 else "")
    return body


def emoji(b):
    t = b.get("type", "")
    if b.get("anchor"):    return " ★"
    if t == "feel":         return " ♡"
    if t == "plan":         return " 🎯"
    if t == "letter":       return " 💌"
    return ""


def main():
    args = set(sys.argv[1:])
    dry = "--dry-run" in args
    force_json = "--json" in args
    force_md = "--md" in args

    # 加载
    memories = None
    if force_json or (not force_md):
        memories = load_json()
        source = "seed-memories.json"
    if (not memories) or force_md:
        raw_md = load_md()
        if raw_md:
            memories = [md_to_body(m) for m in raw_md]
            source = "seed-memories.md"
    if not memories:
        print("❌ 找不到种子记忆文件 (seed-memories.json 或 .md)")
        return

    print(f"📄 {len(memories)} 条记忆 ({source}) | {OMBRE_URL}\n")

    ok = 0
    for i, body in enumerate(memories):
        label = body.get("name", body.get("title", "?"))
        print(f"[{i+1:02d}] {label}{emoji(body)}")
        if dry:
            ok += 1
            continue
        try:
            # summary 兜底
            if "summary" not in body or not body.get("summary"):
                cnt = body.get("content", "")
                body["summary"] = cnt[:80].replace("\n", " ") + ("…" if len(cnt) > 80 else "")
            resp = api("/api/bucket/create", body)
            print(f"     ✅ {resp.get('id','?')}")
            ok += 1
        except HTTPError as e:
            print(f"     ❌ HTTP {e.code}: {e.read().decode('utf-8','replace')[:150]}")
        except URLError:
            print(f"     ❌ 连不上 {OMBRE_URL}——确认服务在跑且 OMBRE_URL 设对了")
            break
        print()

    print(f"\n{ok}/{len(memories)} 完成")


if __name__ == "__main__":
    main()
