// network-app.jsx — Canvas 版记忆网络（跟原版 dashboard 逻辑一致，v2 冷紫色调）
const { useState, useEffect, useRef, useMemo, useCallback } = React;

var C2 = { accent: '#6e4f9a', rose: '#d291b3', gold: '#b8a3d8', sage: '#8a8898', bg: '#f4f3f7', paper: '#ffffff', ink: '#1a1922', ink3: '#8c889c', ink4: '#b8aecf', line: 'rgba(26,25,34,0.12)' };
function nodeColor(kind) { return kind === 'tag' ? C2.gold : kind === 'mixed' ? C2.rose : C2.accent; }

// ── 力导向布局（算完就停）──
function computeLayout(nodes, edges, W, H, focusId) {
  var cx = W / 2, cy = H / 2;
  var pos = {};
  nodes.forEach(function(n, i) {
    if (focusId && n.id === focusId) { pos[n.id] = { x: cx, y: cy }; return; }
    var a = (i / nodes.length) * Math.PI * 2;
    var r = Math.min(W, H) * 0.32;
    pos[n.id] = { x: cx + Math.cos(a) * r + (Math.random() - 0.5) * 40, y: cy + Math.sin(a) * r + (Math.random() - 0.5) * 40 };
  });

  var nodeArr = nodes;
  var iters = Math.min(120, 30 + nodeArr.length * 2);
  for (var iter = 0; iter < iters; iter++) {
    // 节点间斥力
    for (var i = 0; i < nodeArr.length; i++) {
      for (var j = i + 1; j < nodeArr.length; j++) {
        var pa = pos[nodeArr[i].id], pb = pos[nodeArr[j].id];
        if (!pa || !pb) continue;
        var dx = pb.x - pa.x, dy = pb.y - pa.y;
        var dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        var force = 1400 / (dist * dist);
        if (dist < 30) force *= 2;
        dx = (dx / dist) * force; dy = (dy / dist) * force;
        pa.x -= dx; pa.y -= dy; pb.x += dx; pb.y += dy;
      }
    }
    // 边拉力
    edges.forEach(function(e) {
      var pa = pos[e.source], pb = pos[e.target];
      if (!pa || !pb) return;
      var dx = pb.x - pa.x, dy = pb.y - pa.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var ideal = nodes.length < 20 ? 140 : 110;
      var pull = Math.min(1, (e.weight || 1) / 4);
      var force = (dist - ideal) * 0.014 * pull;
      dx = (dx / Math.max(1, dist)) * force; dy = (dy / Math.max(1, dist)) * force;
      pa.x += dx; pa.y += dy; pb.x -= dx; pb.y -= dy;
    });
    // 向心力
    nodeArr.forEach(function(n) {
      if (n.id === focusId) return;
      var p = pos[n.id]; if (!p) return;
      p.x += (cx - p.x) * 0.005;
      p.y += (cy - p.y) * 0.005;
    });
  }
  // 限制在画布内
  nodeArr.forEach(function(n) {
    var p = pos[n.id]; if (!p) return;
    var r = nodeRadius(n);
    p.x = Math.max(r, Math.min(W - r, p.x));
    p.y = Math.max(r, Math.min(H - r, p.y));
  });
  return pos;
}

function nodeRadius(n) { return Math.max(3, Math.min(9, 1.8 + Math.sqrt(n.freq || 1) * 1.3)); }

// ── 绘制网络 ──
function drawNetwork(ctx, W, H, nodes, edges, positions, focusId, hoverId) {
  var cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C2.paper; ctx.fillRect(0, 0, W, H);

  // 网格背景
  var GRID = 22, MAJOR = 5;
  ctx.beginPath();
  for (var gx = GRID; gx < W; gx += GRID) {
    if (Math.round(gx / GRID) % MAJOR === 0) continue;
    ctx.moveTo(gx, 0); ctx.lineTo(gx, H);
  }
  for (var gy = GRID; gy < H; gy += GRID) {
    if (Math.round(gy / GRID) % MAJOR === 0) continue;
    ctx.moveTo(0, gy); ctx.lineTo(W, gy);
  }
  ctx.strokeStyle = 'rgba(26,25,34,0.06)'; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.beginPath();
  for (var gx2 = 0; gx2 <= W; gx2 += GRID * MAJOR) { ctx.moveTo(gx2, 0); ctx.lineTo(gx2, H); }
  for (var gy2 = 0; gy2 <= H; gy2 += GRID * MAJOR) { ctx.moveTo(0, gy2); ctx.lineTo(W, gy2); }
  ctx.strokeStyle = 'rgba(26,25,34,0.10)'; ctx.lineWidth = 0.7; ctx.stroke();

  if (!nodes.length) {
    ctx.fillStyle = C2.ink4; ctx.font = '14px serif'; ctx.textAlign = 'center';
    ctx.fillText('还没有 [[双链]] 或 #tag', cx, cy); return;
  }

  // 边
  edges.forEach(function(e) {
    var pa = positions[e.source], pb = positions[e.target];
    if (!pa || !pb) return;
    var isF = e.source === focusId || e.target === focusId;
    var alpha = isF ? 0.4 : 0.12;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
    ctx.strokeStyle = 'rgba(110,79,154,' + alpha + ')'; ctx.lineWidth = isF ? 1.0 : 0.5; ctx.stroke();
  });

  // 节点
  nodes.forEach(function(n) {
    var p = positions[n.id]; if (!p) return;
    var isFocus = n.id === focusId, isHover = n.id === hoverId;
    var r = nodeRadius(n);
    if (isFocus) r *= 1.3; else if (isHover) r *= 1.15;
    var col = nodeColor(n.kind);

    // 光晕
    var glowR = r + (isFocus ? 12 : isHover ? 8 : 4);
    var glowA = isFocus ? 0.25 : isHover ? 0.18 : 0.05;
    var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
    grd.addColorStop(0, col.replace('rgb', 'rgba').replace(')', ', ' + glowA + ')'));
    grd.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();

    // 点
    var alpha = isFocus || isHover ? 0.95 : 0.65;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = col.replace('rgb', 'rgba').replace(')', ', ' + alpha + ')'); ctx.fill();

    // 焦点环
    if (isFocus || n.anchor) {
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = isFocus ? C2.accent : C2.gold; ctx.lineWidth = 1.2; ctx.stroke();
    }

    // 标签
    if (isFocus || (n.freq >= 4 && nodes.length < 40)) {
      ctx.fillStyle = isFocus ? C2.accent : C2.ink4;
      ctx.font = (isFocus ? 'bold ' : '') + '10px sans-serif';
      ctx.textAlign = 'center';
      var label = n.label || n.id;
      if (label.length > 12) label = label.slice(0, 12) + '…';
      ctx.fillText((n.kind === 'tag' ? '#' : '') + label, p.x, p.y + r + 14);
    }
  });

  // 提示信息
  if (focusId) {
    ctx.fillStyle = C2.accent; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText(nodes.length + ' nodes · 点击节点返回全局', cx, 22);
  } else {
    ctx.fillStyle = C2.ink4; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('TOP ' + nodes.length + ' NODES · 悬浮看详情 · 点击展开邻居', cx, 22);
  }
}

// ═══════════════════════════════════════
function NetworkApp() {
  var [graph, setGraph] = useState(null);
  var [bucketsData, setBucketsData] = useState([]);
  var [dark, setDark] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [focusId, setFocusId] = useState(null);
  var [hoverNode, setHoverNode] = useState(null);
  var [hoverPos, setHoverPos] = useState(null); // { x, y } for tooltip

  var canvasRef = useRef(null);
  var adjRef = useRef({});
  var posRef = useRef({});

  // 加载数据
  useEffect(function() {
    (async function() {
      try {
        var [gr, br] = await Promise.all([
          fetch('/api/network?mode=concept', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (!gr.ok) throw new Error('HTTP ' + gr.status);
        var gd = await gr.json();
        setGraph(gd);
        if (br.ok) { var bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
        // 建邻接表
        var adj = {};
        (gd.nodes || []).forEach(function(n) { adj[n.id] = []; });
        (gd.edges || []).forEach(function(e) { if (adj[e.source]) adj[e.source].push(e.target); if (adj[e.target]) adj[e.target].push(e.source); });
        adjRef.current = adj;
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  // 可见节点
  var visibleData = useMemo(function() {
    if (!graph) return { nodes: [], edges: [] };
    var allN = graph.nodes || [], allE = graph.edges || [];
    if (!focusId) {
      var sorted = allN.slice().sort(function(a, b) { return (b.freq || 1) - (a.freq || 1); });
      var ids = new Set(sorted.slice(0, 30).map(function(n) { return n.id; }));
      return { nodes: allN.filter(function(n) { return ids.has(n.id); }), edges: allE.filter(function(e) { return ids.has(e.source) && ids.has(e.target); }) };
    }
    // focus 模式：BFS 邻居
    var visited = new Set([focusId]);
    var frontier = [focusId];
    for (var d = 0; d < 2; d++) {
      var next = [];
      frontier.forEach(function(id) { (adjRef.current[id] || []).forEach(function(nb) { if (!visited.has(nb)) { visited.add(nb); next.push(nb); } }); });
      frontier = next;
      if (!frontier.length) break;
    }
    return { nodes: allN.filter(function(n) { return visited.has(n.id); }), edges: allE.filter(function(e) { return visited.has(e.source) && visited.has(e.target); }) };
  }, [graph, focusId]);

  // 布局
  var positions = useMemo(function() {
    if (!graph || !visibleData.nodes.length) return {};
    var W = 900, H = 550;
    // 尝试获取 canvas 尺寸
    if (canvasRef.current) { W = canvasRef.current.parentElement.clientWidth || 900; H = Math.min(W * 0.62, 550); }
    return computeLayout(visibleData.nodes, visibleData.edges, W, H, focusId);
  }, [visibleData, focusId]);

  // 绘制
  useEffect(function() {
    var canvas = canvasRef.current; if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var W = rect.width, H = Math.min(W * 0.62, 550);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
    posRef.current = { positions: positions, W: W, H: H };
    drawNetwork(ctx, W, H, visibleData.nodes, visibleData.edges, positions, focusId, hoverNode ? hoverNode.id : null);
  }, [visibleData, positions, focusId, hoverNode]);

  // 事件
  var handleMouseMove = function(e) {
    var p = posRef.current; if (!p.positions || !Object.keys(p.positions).length) return;
    var rect = canvasRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var found = null;
    visibleData.nodes.forEach(function(n) {
      var pp = p.positions[n.id]; if (!pp) return;
      var r = nodeRadius(n) + 6;
      if (Math.hypot(mx - pp.x, my - pp.y) < r) found = n;
    });
    setHoverNode(found);
    setHoverPos(found ? { x: e.clientX, y: e.clientY } : null);
  };
  var handleMouseLeave = function() { setHoverNode(null); setHoverPos(null); };
  var handleClick = function(e) {
    var p = posRef.current; if (!p.positions) return;
    var rect = canvasRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    visibleData.nodes.forEach(function(n) {
      var pp = p.positions[n.id]; if (!pp) return;
      var r = nodeRadius(n) + 6;
      if (Math.hypot(mx - pp.x, my - pp.y) < r) {
        setFocusId(function(prev) { return prev === n.id ? null : n.id; });
      }
    });
  };

  var topbar = React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark });
  var nav = React.createElement(window.SharedNav, { active: 'network' });
  if (loading) return React.createElement('div', null, topbar, nav, React.createElement('div', { className: 'nw-loading' }, '载入记忆网络…'));
  if (error) return React.createElement('div', null, topbar, nav, React.createElement('div', { className: 'nw-loading' }, '加载失败: ' + error));

  return React.createElement('div', null,
    topbar, nav,
    React.createElement('div', { style: { textAlign: 'center', padding: '20px 20px 0' } },
      React.createElement('h1', { style: { fontFamily: 'var(--serif)', fontSize: 24, margin: 0 } }, '记忆网络'),
      React.createElement('p', { style: { fontSize: 12, color: 'var(--ink-3)', margin: '4px 0 16px' } }, '概念共现图 · 节点 = 标签/双链 · 连线 = 同一记忆里出现'),
    ),
    React.createElement('div', { style: { background: 'var(--paper)', border: '0.5px solid var(--line)', borderRadius: 'var(--r-md)', margin: '0 24px 40px', padding: 4, position: 'relative' } },
      React.createElement('canvas', { ref: canvasRef, style: { width: '100%', display: 'block', cursor: hoverNode ? 'pointer' : 'default' }, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave, onClick: handleClick }),
      // 图例
      React.createElement('div', { style: { position: 'absolute', bottom: 10, right: 16, display: 'flex', gap: 14, fontSize: 11, color: 'var(--ink-3)' } },
        React.createElement('span', null, React.createElement('span', { style: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C2.accent, marginRight: 4 } }), '[[双链]]'),
        React.createElement('span', null, React.createElement('span', { style: { display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: C2.gold, marginRight: 4 } }), '# 标签'),
      ),
      // hover 浮层
      hoverNode && hoverPos && React.createElement('div', { style: { position: 'fixed', zIndex: 300, pointerEvents: 'none', left: (hoverPos.x + 16) + 'px', top: (hoverPos.y + 16) + 'px', background: 'var(--paper)', border: '0.5px solid var(--line-2)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(26,25,34,0.15)', maxWidth: 260, fontSize: 12, fontFamily: 'var(--sans)', lineHeight: 1.6, color: 'var(--ink)' } },
        React.createElement('div', { style: { fontWeight: 600 } }, (hoverNode.kind === 'tag' ? '#' : '') + (hoverNode.label || hoverNode.id)),
        React.createElement('div', { style: { color: 'var(--ink-3)', fontSize: 11 } }, 'freq ' + (hoverNode.freq || 1) + ' · ' + ((adjRef.current[hoverNode.id] || []).length) + ' 关联'),
        hoverNode.anchor ? React.createElement('div', { style: { color: C2.gold, fontSize: 10, marginTop: 2 } }, '⚓ anchor') : null,
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(NetworkApp));
