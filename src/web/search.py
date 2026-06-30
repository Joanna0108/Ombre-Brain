"""
========================================
web/search.py — 检索 / 重复 / 概念网络 / breath 调试
========================================

- /api/search：关键词+向量检索
- /api/duplicates：重复候选 pair（记忆健康面板）
- /api/network：概念网络图（wikilink + tag 共现）
- /api/breath、/api/breath-debug：breath 浮现结果 / 四维评分分解

对外暴露：register(mcp)。
========================================
"""

from starlette.requests import Request
from starlette.responses import Response

from . import _shared as sh

logger = sh.logger

try:
    from utils import strip_wikilinks, extract_wikilinks  # type: ignore
except ImportError:  # pragma: no cover
    from ..utils import strip_wikilinks, extract_wikilinks  # type: ignore


import json as _json_lib_inline
import os as _os_inline
from datetime import datetime, timezone as _timezone


def _now_iso() -> str:
    return datetime.now(_timezone.utc).isoformat()


class _SearchLog:
    """In-memory ring buffer for search traces (hit-stats + recent-searches API)."""

    def __init__(self, max_entries: int = 200):
        self._hits: dict[str, int] = {}       # bucket_id → cumulative surface_count
        self._searches: list[dict] = []       # recent search entries
        self._max = max_entries
        self._total_searches = 0
        self._load()

    def _path(self) -> str:
        return _os_inline.path.join(sh.config.get("buckets_dir", "data/buckets"), ".search_log.json")

    def _load(self) -> None:
        try:
            p = self._path()
            if _os_inline.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    data = _json_lib_inline.load(f)
                self._hits = data.get("hits", {})
                self._searches = data.get("searches", [])[-self._max:]
                self._total_searches = data.get("total_searches", 0)
        except Exception:
            pass

    def _save(self) -> None:
        try:
            p = self._path()
            _os_inline.makedirs(_os_inline.path.dirname(p), exist_ok=True)
            tmp = p + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                _json_lib_inline.dump({
                    "hits": self._hits,
                    "searches": self._searches[-self._max:],
                    "total_searches": self._total_searches,
                }, f)
            _os_inline.replace(tmp, p)
        except Exception:
            pass

    def record(self, kind: str, query: str, results: list[dict]) -> None:
        self._total_searches += 1
        for r in results:
            bid = r.get("id", "")
            if bid:
                self._hits[bid] = self._hits.get(bid, 0) + 1
        entry = {
            "ts": _now_iso(),
            "kind": kind,
            "query": query[:200],
            "result_count": len(results),
            "top": [{
                "id": r.get("id", ""),
                "name": r.get("name", ""),
                "score": r.get("score", 0),
                "protected": r.get("protected", False),
                "highlight": r.get("highlight", False),
                "type": r.get("type", "dynamic"),
                "title_hit": bool(query and query.lower() in (r.get("name", "") or "").lower()),
                "matched_in": r.get("matched_in", None),
            } for r in results[:5]],
        }
        self._searches.append(entry)
        if len(self._searches) > self._max:
            self._searches = self._searches[-self._max:]
        try:
            self._save()
        except Exception:
            pass

    def get_stats(self):
        return {
            "total_searches": self._total_searches,
            "total_buckets": len(self._hits),
            "hit_buckets": sum(1 for v in self._hits.values() if v > 0),
            "zero_buckets": 0,
        }

    def get_items(self, order: str = "desc", limit: int = 50):
        sorted_hits = sorted(self._hits.items(), key=lambda x: x[1], reverse=(order == "desc"))
        return [{"id": bid, "count": cnt} for bid, cnt in sorted_hits[:limit]]

    def get_recent(self, limit: int = 10):
        return self._searches[-limit:][::-1]


_search_log = _SearchLog()


def register(mcp) -> None:

    @mcp.custom_route("/api/search", methods=["GET"])
    async def api_search(request: Request) -> Response:
        """Search buckets by query. Supports ?simulate=true for Breath debug dry-run."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        query = request.query_params.get("q", "")
        if not query:
            return JSONResponse({"error": "missing q parameter"}, status_code=400)
        simulate = request.query_params.get("simulate", "").lower() == "true"
        include_vector = request.query_params.get("include_vector", "").lower() == "true"
        try:
            limit = int(request.query_params.get("limit", "10"))
        except (ValueError, TypeError):
            limit = 10

        try:
            matches = await sh.bucket_mgr.search(query, limit=max(limit, 10))
            result = []
            for b in matches:
                meta = b.get("metadata", {})
                result.append({
                    "id": b["id"],
                    "name": meta.get("name", b["id"]),
                    "score": b.get("score", 0),
                    "domain": meta.get("domain", []),
                    "valence": meta.get("valence", 0.5),
                    "arousal": meta.get("arousal", 0.3),
                    "content_preview": strip_wikilinks(b.get("content", ""))[:200],
                    "protected": bool(meta.get("protected", False)),
                    "highlight": bool(meta.get("highlight", False)),
                    "type": meta.get("type", "dynamic"),
                    "matched_in": b.get("matched_in", None),
                })

            _search_log.record("search", query, result)

            if simulate:
                keyword_hits = result[:limit]
                vector_hits = []
                if include_vector and sh.embedding_engine and sh.embedding_engine.enabled:
                    try:
                        vec_results = await sh.embedding_engine.search_similar(query, top_k=limit)
                        for bid, sim in vec_results:
                            b = await sh.bucket_mgr.get(bid)
                            if b:
                                meta = b.get("metadata", {})
                                vector_hits.append({
                                    "id": bid,
                                    "name": meta.get("name", bid),
                                    "similarity": round(sim, 4),
                                })
                    except Exception:
                        pass
                return JSONResponse({
                    "keyword_hits": keyword_hits,
                    "vector_hits": vector_hits,
                })

            return JSONResponse(result)
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)

    @mcp.custom_route("/api/duplicates", methods=["GET"])
    async def api_duplicates(request: Request) -> Response:
        """List bucket pairs flagged as duplicate candidates (sim > 0.95).

        iter 1.6 §4：每次 hold/grow 写完后 _check_duplicate_for 在两边写 dup_candidate +
        dup_score。本接口把所有这种标记的桶聚合成 pair，前端「记忆健康」面板可据此让
        她/他挨个确认是否合并。返回去重后的 pair 列表。
        """
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        try:
            all_b = await sh.bucket_mgr.list_all(include_archive=False)
            seen: set[frozenset] = set()
            pairs: list[dict] = []
            index = {b["id"]: b for b in all_b}
            for b in all_b:
                meta = b.get("metadata", {}) or {}
                other_id = meta.get("dup_candidate")
                if not other_id or other_id not in index:
                    continue
                key = frozenset((b["id"], other_id))
                if key in seen:
                    continue
                seen.add(key)
                other = index[other_id]
                pairs.append({
                    "a": {"id": b["id"], "name": meta.get("name", b["id"])},
                    "b": {"id": other_id, "name": other["metadata"].get("name", other_id)},
                    "score": meta.get("dup_score") or other["metadata"].get("dup_score"),
                })
            pairs.sort(key=lambda p: p.get("score") or 0, reverse=True)
            return JSONResponse({"pairs": pairs, "total": len(pairs)})
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)


    @mcp.custom_route("/api/network", methods=["GET"])
    async def api_network(request: Request) -> Response:
        """Concept graph for visualization.

        iter 2.0+ §network rewrite: nodes are CONCEPT TOKENS that the user types
        inside their notes — `[[wikilinks]]` and frontmatter `tags`. Bucket
        filenames are NOT nodes. Two tokens get an edge whenever they co-occur
        in the same bucket. Edge weight = number of buckets containing both.

        iter 2.0+：节点 = 笔记里的双链词与 tag，不是文件名。两个词在同一个桶里出现就连一条边，
        边权重 = 共同出现的桶数。文件名只在前端搜索/详情里出现。

        Modes:
          - default `concept`：concept token graph (wikilinks + tags)
          - `embedding`：保留旧的桶级语义相似度网络（备用）
        """
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        mode = (request.query_params.get("mode") or "concept").strip().lower()
        # 兼容旧入口 mode=wikilinks → 等价 concept
        if mode == "wikilinks":
            mode = "concept"
        try:
            all_buckets = await sh.bucket_mgr.list_all(include_archive=False)

            if mode == "embedding":
                # 旧的桶→桶相似度图（保留）
                nodes = []
                for b in all_buckets:
                    meta = b.get("metadata", {})
                    bid = b["id"]
                    nodes.append({
                        "id": bid,
                        "name": meta.get("name", bid),
                        "kind": "bucket",
                        "type": meta.get("type", "dynamic"),
                        "score": sh.decay_engine.calculate_score(meta),
                        "resolved": meta.get("resolved", False),
                        "pinned": meta.get("pinned", False),
                        "anchor": bool(meta.get("anchor")),  # #10
                    })
                edges = []
                embeddings = {}
                if sh.embedding_engine and sh.embedding_engine.enabled:
                    for b in all_buckets:
                        emb = await sh.embedding_engine.get_embedding(b["id"])
                        if emb is not None:
                            embeddings[b["id"]] = emb
                ids = list(embeddings.keys())
                for i, id_a in enumerate(ids):
                    for id_b in ids[i + 1:]:
                        sim = sh.embedding_engine._cosine_similarity(embeddings[id_a], embeddings[id_b])
                        if sim > 0.5:
                            edges.append({"source": id_a, "target": id_b, "weight": round(sim, 3), "kind": "similarity"})
                return JSONResponse({"nodes": nodes, "edges": edges, "mode": mode})

            # ---- concept mode ----
            # token_id → {"label": str, "kind": "wiki"|"tag"|"mixed", "freq": int, "buckets": [bucket_id...]}
            # token_id 用规范化后的 lower-case 文本作 key，避免 "Memory" 与 "memory" 拆成两个节点
            tokens: dict[str, dict] = {}
            # bucket_id → set(token_id)，给后面共现统计用
            bucket_tokens: dict[str, set] = {}

            def _norm(s: str) -> str:
                return (s or "").strip()

            for b in all_buckets:
                bid = b["id"]
                meta = b.get("metadata", {}) or {}
                content = b.get("content", "") or ""

                seen: set[str] = set()
                # 1) 笔记正文里的 [[wikilinks]]
                for ref in extract_wikilinks(content):
                    label = _norm(ref)
                    if not label:
                        continue
                    key = label.lower()
                    node = tokens.setdefault(key, {"label": label, "kind": "wiki", "freq": 0, "buckets": []})
                    if key not in seen:
                        node["freq"] += 1
                        node["buckets"].append(bid)
                        seen.add(key)
                    # wiki 优先；若曾被标记为 tag，升级为 mixed
                    if node["kind"] == "tag":
                        node["kind"] = "mixed"

                # 2) frontmatter 的 tags（list 或字符串都兼容）
                raw_tags = meta.get("tags") or []
                if isinstance(raw_tags, str):
                    raw_tags = [t.strip() for t in raw_tags.split(",")]
                for t in raw_tags:
                    label = _norm(str(t)).lstrip("#")
                    if not label:
                        continue
                    key = label.lower()
                    node = tokens.setdefault(key, {"label": label, "kind": "tag", "freq": 0, "buckets": []})
                    if key not in seen:
                        node["freq"] += 1
                        node["buckets"].append(bid)
                        seen.add(key)
                    if node["kind"] == "wiki":
                        node["kind"] = "mixed"

                if seen:
                    bucket_tokens[bid] = seen

            # 共现边：同一个桶里的 token 两两相连，权重 = 共同出现的桶数
            # 复杂度上限是 sum(k_i^2) 其中 k_i 是单桶 token 数；正常都很小
            co_count: dict[tuple[str, str], int] = {}
            for bid, toks in bucket_tokens.items():
                ts = sorted(toks)
                for i, a in enumerate(ts):
                    for b_ in ts[i + 1:]:
                        co_key: tuple[str, str] = (a, b_)
                        co_count[co_key] = co_count.get(co_key, 0) + 1

            # #10: 标记「出现在至少一个 anchor 桶里」的 concept token
            anchor_bucket_ids = {
                b["id"] for b in all_buckets
                if (b.get("metadata") or {}).get("anchor")
            }
            nodes = [
                {
                    "id": k, "label": v["label"], "kind": v["kind"],
                    "freq": v["freq"], "buckets": v["buckets"],
                    "anchor": bool(anchor_bucket_ids and any(bid in anchor_bucket_ids for bid in v["buckets"])),
                }
                for k, v in tokens.items()
            ]
            edges = [{"source": a, "target": b_, "weight": w, "kind": "cooccur"} for (a, b_), w in co_count.items()]

            return JSONResponse({"nodes": nodes, "edges": edges, "mode": mode})
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)


    @mcp.custom_route("/api/breath", methods=["GET"])
    async def api_breath(request: Request) -> Response:
        """Lightweight breath surface: returns top-N buckets by decay score."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        try:
            n = min(int(request.query_params.get("n", "10")), 50)
            all_buckets = await sh.bucket_mgr.list_all(include_archive=False)
            results = []
            for bucket in all_buckets:
                meta = bucket.get("metadata", {})
                score = sh.decay_engine.calculate_score(meta)
                if meta.get("resolved"):
                    score *= 0.3
                results.append({
                    "id": bucket["id"],
                    "name": meta.get("name", bucket["id"]),
                    "score": round(score, 4),
                    "domain": meta.get("domain", []),
                    "type": meta.get("type", "dynamic"),
                })
            results.sort(key=lambda x: x["score"], reverse=True)
            return JSONResponse({"buckets": results[:n]})
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)


    @mcp.custom_route("/api/breath-debug", methods=["GET"])
    async def api_breath_debug(request: Request) -> Response:
        """Debug endpoint: simulate breath scoring and return per-bucket breakdown."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        query = request.query_params.get("q", "")
        _qv_raw = request.query_params.get("valence")
        _qa_raw = request.query_params.get("arousal")
        q_valence: float | None = float(_qv_raw) if _qv_raw else None
        q_arousal: float | None = float(_qa_raw) if _qa_raw else None

        try:
            all_buckets = await sh.bucket_mgr.list_all(include_archive=False)
            results = []
            w = {
                "topic": sh.bucket_mgr.w_topic,
                "emotion": sh.bucket_mgr.w_emotion,
                "time": sh.bucket_mgr.w_time,
                "importance": sh.bucket_mgr.w_importance,
            }
            w_sum = sum(w.values())

            for bucket in all_buckets:
                meta = bucket.get("metadata", {})
                bid = bucket["id"]
                try:
                    topic = sh.bucket_mgr._calc_topic_score(query, bucket) if query else 0.0
                    emotion = sh.bucket_mgr._calc_emotion_score(q_valence if q_valence is not None else 0.5, q_arousal if q_arousal is not None else 0.5, meta)
                    time_s = sh.bucket_mgr._calc_time_score(meta)
                    imp = max(1, min(10, int(meta.get("importance") or 5))) / 10.0

                    raw_total = (
                        topic * w["topic"]
                        + emotion * w["emotion"]
                        + time_s * w["time"]
                        + imp * w["importance"]
                    )
                    normalized = (raw_total / w_sum) * 100 if w_sum > 0 else 0
                    resolved = meta.get("resolved", False)
                    if resolved:
                        normalized *= 0.3

                    results.append({
                        "id": bid,
                        "name": meta.get("name", bid),
                        "domain": meta.get("domain", []),
                        "type": meta.get("type", "dynamic"),
                        "resolved": resolved,
                        "pinned": meta.get("pinned", False),
                        "scores": {
                            "topic": round(topic, 4),
                            "emotion": round(emotion, 4),
                            "time": round(time_s, 4),
                            "importance": round(imp, 4),
                        },
                        "weights": w,
                        "raw_total": round(raw_total, 4),
                        "normalized": round(normalized, 2),
                        "passed_threshold": normalized >= sh.bucket_mgr.fuzzy_threshold,
                    })
                except Exception as _score_exc:
                    logger.error(
                        f"Scoring failed for bucket {bid!r}: {type(_score_exc).__name__}: {_score_exc}",
                        exc_info=True,
                    )
                    continue

            results.sort(key=lambda x: x["normalized"], reverse=True)
            passed = [r for r in results if r["passed_threshold"]]
            return JSONResponse({
                "query": query,
                "valence": q_valence,
                "arousal": q_arousal,
                "weights": w,
                "threshold": sh.bucket_mgr.fuzzy_threshold,
                "total_candidates": len(results),
                "passed_count": len(passed),
                "results": results[:50],  # top 50 for debug
            })
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)

    # --- Scoring config (Breath console knob panel) ---

    @mcp.custom_route("/api/scoring-config", methods=["GET"])
    async def api_scoring_config_get(request: Request) -> Response:
        """Get current scoring weights and schema for the Breath debug panel."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        defaults = {"topic_relevance": 4.0, "emotion_resonance": 2.0,
                    "time_proximity": 1.5, "importance": 1.0,
                    "content_weight": 1.0, "touch_weight": 1.0,
                    "semantic_weight": 2.5, "bm25_weight": 1.5}
        mgr = sh.bucket_mgr
        current = {
            "topic_relevance": getattr(mgr, "w_topic", defaults["topic_relevance"]),
            "emotion_resonance": getattr(mgr, "w_emotion", defaults["emotion_resonance"]),
            "time_proximity": getattr(mgr, "w_time", defaults["time_proximity"]),
            "importance": getattr(mgr, "w_importance", defaults["importance"]),
            "content_weight": getattr(mgr, "content_weight", defaults["content_weight"]),
            "touch_weight": getattr(mgr, "w_touch", defaults["touch_weight"]),
            "semantic_weight": getattr(mgr, "w_semantic", defaults["semantic_weight"]),
            "bm25_weight": getattr(mgr, "w_bm25", defaults["bm25_weight"]),
        }
        schema = [
            {"key": k, "label": k.replace("_", " ").title(), "min": 0.0, "max": 10.0, "step": 0.1,
             "default": defaults[k]} for k in defaults
        ]
        return JSONResponse({"current": current, "defaults": defaults, "schema": schema})

    @mcp.custom_route("/api/scoring-config", methods=["POST"])
    async def api_scoring_config_update(request: Request) -> Response:
        """Update a single scoring weight knob."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        try:
            body = await request.json()
        except Exception:
            return JSONResponse({"error": "Invalid JSON"}, status_code=400)
        key = body.get("key", "")
        value = body.get("value")
        if not key or value is None:
            return JSONResponse({"error": "missing key or value"}, status_code=400)

        key_map = {
            "topic_relevance": "w_topic", "emotion_resonance": "w_emotion",
            "time_proximity": "w_time", "importance": "w_importance",
            "content_weight": "content_weight", "touch_weight": "w_touch",
            "semantic_weight": "w_semantic", "bm25_weight": "w_bm25",
        }
        attr = key_map.get(key)
        if not attr:
            return JSONResponse({"error": f"unknown key: {key}"}, status_code=400)
        try:
            setattr(sh.bucket_mgr, attr, float(value))
        except (ValueError, TypeError):
            return JSONResponse({"error": "invalid numeric value"}, status_code=400)

        try:
            import yaml as _yaml
            config_path = _os_inline.path.join(
                _os_inline.path.dirname(sh.config.get("buckets_dir", "")), "config.yaml")
            if _os_inline.path.exists(config_path):
                with open(config_path, "r", encoding="utf-8") as f:
                    cfg = _yaml.safe_load(f) or {}
            else:
                cfg = {}
            scoring = cfg.setdefault("scoring_weights", {})
            scoring[key] = float(value)
            with open(config_path, "w", encoding="utf-8") as f:
                _yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True)
        except Exception:
            pass

        defaults = {"topic_relevance": 4.0, "emotion_resonance": 2.0,
                    "time_proximity": 1.5, "importance": 1.0,
                    "content_weight": 1.0, "touch_weight": 1.0,
                    "semantic_weight": 2.5, "bm25_weight": 1.5}
        mgr = sh.bucket_mgr
        current = {
            "topic_relevance": getattr(mgr, "w_topic", defaults["topic_relevance"]),
            "emotion_resonance": getattr(mgr, "w_emotion", defaults["emotion_resonance"]),
            "time_proximity": getattr(mgr, "w_time", defaults["time_proximity"]),
            "importance": getattr(mgr, "w_importance", defaults["importance"]),
            "content_weight": getattr(mgr, "content_weight", defaults["content_weight"]),
            "touch_weight": getattr(mgr, "w_touch", defaults["touch_weight"]),
            "semantic_weight": getattr(mgr, "w_semantic", defaults["semantic_weight"]),
            "bm25_weight": getattr(mgr, "w_bm25", defaults["bm25_weight"]),
        }
        return JSONResponse({"current": current, "ok": True})

    @mcp.custom_route("/api/scoring-config/reset", methods=["POST"])
    async def api_scoring_config_reset(request: Request) -> Response:
        """Reset all scoring weights to defaults."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        defaults = {"w_topic": 4.0, "w_emotion": 2.0, "w_time": 1.5,
                    "w_importance": 1.0, "content_weight": 1.0,
                    "w_touch": 1.0, "w_semantic": 2.5, "w_bm25": 1.5}
        for attr, val in defaults.items():
            setattr(sh.bucket_mgr, attr, val)
        return JSONResponse({
            "current": {
                "topic_relevance": 4.0, "emotion_resonance": 2.0,
                "time_proximity": 1.5, "importance": 1.0,
                "content_weight": 1.0, "touch_weight": 1.0,
                "semantic_weight": 2.5, "bm25_weight": 1.5,
            },
            "ok": True,
        })

    # --- Hit stats (Breath console cold/hot views) ---

    @mcp.custom_route("/api/hit-stats", methods=["GET"])
    async def api_hit_stats(request: Request) -> Response:
        """Return per-bucket search hit statistics."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        try:
            limit = int(request.query_params.get("limit", "50"))
        except (ValueError, TypeError):
            limit = 50
        order = request.query_params.get("order", "desc")
        include_zero = request.query_params.get("include_zero", "0") == "1"

        stats = _search_log.get_stats()
        items = _search_log.get_items(order=order, limit=limit)

        enriched = []
        for item in items:
            b = await sh.bucket_mgr.get(item["id"])
            meta = (b.get("metadata", {}) if b else {})
            enriched.append({
                "id": item["id"],
                "name": meta.get("name", item["id"]),
                "count": item["count"],
                "surface_count": item["count"],
                "last_hit": meta.get("last_active", ""),
                "type": meta.get("type", "dynamic"),
                "missing": b is None,
            })

        if include_zero and order == "asc":
            all_b = await sh.bucket_mgr.list_all(include_archive=False)
            hit_ids = {it["id"] for it in enriched}
            for b in all_b:
                if b["id"] not in hit_ids:
                    meta = b.get("metadata", {})
                    enriched.append({
                        "id": b["id"],
                        "name": meta.get("name", b["id"]),
                        "count": 0,
                        "surface_count": 0,
                        "last_hit": "",
                        "type": meta.get("type", "dynamic"),
                        "missing": False,
                    })

        stats["items"] = enriched
        return JSONResponse(stats)

    # --- Recent searches (Breath console trace view) ---

    @mcp.custom_route("/api/recent-searches", methods=["GET"])
    async def api_recent_searches(request: Request) -> Response:
        """Return recent search traces."""
        from starlette.responses import JSONResponse
        err = sh._require_auth(request)
        if err:
            return err
        try:
            limit = int(request.query_params.get("limit", "10"))
        except (ValueError, TypeError):
            limit = 10
        return JSONResponse({"items": _search_log.get_recent(limit=limit)})
