#!/usr/bin/env python3
"""
导入 seed-memories.md 到 Ombre Brain（Zeabur 部署版）

用法:
  # Zeabur 部署后自动执行（在 Zeabur 的 post-deploy command 里配）
  python scripts/seed-import.py

  # 本地预览
  python scripts/seed-import.py --dry-run

Zeabur 里需要配环境变量:
  OMBRE_URL   你的 Zeabur 服务地址 (例 https://xxx.zeabur.app)
  OMBRE_PWD   Dashboard 密码（如果设了密码的话）
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
SEED_FILE = os.path.join(HERE, "seed-memories.md")


def api(path, data=None):
    url = urljoin(OMBRE_URL.rstrip("/") + "/", path.lstrip("/"))
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if OMBRE_PWD:
        headers["Authorization"] = "Bearer " + OMBRE_PWD
    with urlopen(Request(url, data=body, headers=headers), timeout=30) as r:
        return json.loads(r.read().decode())


def parse_memories(filepath):
    """拆出 YAML 头 + 正文"""
    text = open(filepath, "r", encoding="utf-8").read()
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


def to_body(m):
    title = m.get("title", "")
    body = {
        "name": title,
        "content": m.get("_body", ""),
        "importance": m.get("importance", 5),
        "tags": m.get("tags", []),
        "protected": m.get("protected", False),
        "highlight": m.get("highlight", False),
        "internalized": False,
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
        body["_meta"] = {"weight": m.get("weight", 0.5), "status": m.get("status", "active")}
    elif typ == "letter":
        body["type"] = "letter"
    elif typ == "anchor" or m.get("anchor"):
        body["anchor"] = True

    body["summary"] = body["content"][:80].replace("\n", " ") + ("…" if len(body["content"]) > 80 else "")
    return body


def main():
    dry = "--dry-run" in sys.argv
    memories = parse_memories(SEED_FILE)
    print(f"📄 {len(memories)} 条记忆 | {OMBRE_URL}\n")

    ok = 0
    for i, m in enumerate(memories):
        body = to_body(m)
        label = body["name"]
        emoji = ""
        if body.get("type") == "feel":    emoji = " ♡"
        elif body.get("anchor"):          emoji = " ★"
        elif m.get("type") == "plan":     emoji = " 🎯"
        elif m.get("type") == "letter":   emoji = " 💌"

        print(f"[{i+1:02d}] {label}{emoji}")
        if dry: ok += 1; continue

        try:
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
