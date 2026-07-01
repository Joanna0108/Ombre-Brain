// mood-app.jsx — Canvas 版情绪星图（跟原版 dashboard 逻辑一致，v2 冷紫色调）
const { useState, useEffect, useRef, useMemo } = React;

function quadKey(v, a) { return (a >= 0.5 ? 'ha' : 'la') + '_' + (v >= 0.5 ? 'hv' : 'lv'); }
const QUAD_LABELS = { ha_hv: '兴奋', ha_lv: '紧张', la_hv: '放松', la_lv: '悲伤' };

// v2 色板
var C = { accent: '#6e4f9a', rose: '#d291b3', gold: '#b8a3d8', sage: '#8a8898', bg: '#f4f3f7', paper: '#ffffff', ink: '#1a1922', ink3: '#8c889c', ink4: '#b8aecf', line: 'rgba(26,25,34,0.12)' };
function valenceRGB(v) {
  var r = Math.round(210 - v * 100), g = Math.round(145 - v * 30), b = Math.round(179 + v * 30);
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

// ── 罗盘 Canvas ──
function drawCompass(canvas, feelBuckets, dayItems, dotDataRef) {
  if (!canvas || !feelBuckets || !feelBuckets.length) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  var W = rect.width, H = Math.min(rect.width, 450);
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.height = H + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);

  var pad = { t: 20, r: 20, b: 34, l: 44 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
  var cx = pad.l + pw / 2, cy = pad.t + ph / 2, R = Math.min(pw, ph) * 0.45;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  // 四象限
  var quads = [
    [0, Math.PI/2, 'rgba(210,145,179,0.06)'],        // 右下
    [Math.PI/2, Math.PI, 'rgba(110,79,154,0.06)'],   // 左下
    [Math.PI, -Math.PI/2, 'rgba(138,136,152,0.04)'], // 左上
    [-Math.PI/2, 0, 'rgba(184,163,216,0.06)'],       // 右上
  ];
  quads.forEach(function(q) {
    var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    grad.addColorStop(0, q[2]); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, q[0], q[1]); ctx.lineTo(cx, cy); ctx.fill();
  });

  // 十字
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

  // 轴标签
  ctx.fillStyle = C.ink4; ctx.font = '10px ' + getComputedStyle(canvas).fontFamily; ctx.textAlign = 'center';
  ctx.fillText('▲ 高唤醒', cx, pad.t - 4);
  ctx.fillText('▼ 低唤醒', cx, H - pad.b + 16);
  ctx.fillText('◀ 负面', pad.l - 4, cy + 4);
  ctx.fillText('正面 ▶', W - pad.r + 4, cy + 4);

  // 散点
  var allDots = [];
  var daySet = dayItems ? new Set(dayItems.map(function(b) { return b.id; })) : null;
  feelBuckets.forEach(function(b) {
    var px = cx + ((b.valence ?? 0.5) - 0.5) * 2 * R;
    var py = cy - ((b.arousal ?? 0.3) - 0.5) * 2 * R;
    var r = 2.5 + (b.importance || 5) / 10 * 3;
    var alpha = daySet ? (daySet.has(b.id) ? 0.9 : 0.12) : 0.7;
    var col = valenceRGB(b.valence ?? 0.5);
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = col.replace('rgb', 'rgba').replace(')', ', ' + alpha + ')');
    var isHi = b.highlight || (b.importance || 5) >= 8;
    if (isHi && alpha > 0.5) { ctx.shadowColor = C.accent; ctx.shadowBlur = 6; }
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    if (isHi) { ctx.strokeStyle = C.rose; ctx.lineWidth = 1.5; ctx.stroke(); }
    allDots.push({ x: px, y: py, r: r + 3, item: b });
  });

  // 外环
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = C.line; ctx.lineWidth = 0.8; ctx.stroke();

  dotDataRef.current = { dots: allDots, cx: cx, cy: cy, R: R };
}

// ── 折线图 Canvas ──
function drawChart(canvasRef, dayData) {
  var canvas = canvasRef;
  if (!canvas || !dayData || !dayData.length) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var Wcss = canvas.getBoundingClientRect().width, Hcss = 200;
  canvas.width = Wcss * dpr; canvas.height = Hcss * dpr;
  canvas.style.height = Hcss + 'px';
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
  var W = Wcss, H = Hcss;
  var pad = { t: 12, r: 20, b: 30, l: 36 };
  var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

  // 参考线
  [0.25, 0.5, 0.75].forEach(function(yv) {
    var gy = pad.t + ph * (1 - yv);
    ctx.beginPath(); ctx.moveTo(pad.l, gy); ctx.lineTo(W - pad.r, gy);
    ctx.strokeStyle = yv === 0.5 ? C.line : 'rgba(26,25,34,0.06)';
    ctx.lineWidth = yv === 0.5 ? 0.6 : 0.4;
    ctx.setLineDash(yv === 0.5 ? [] : [4, 6]); ctx.stroke();
  });
  ctx.setLineDash([]);

  if (dayData.length < 2) {
    ctx.fillStyle = C.ink4; ctx.font = '12px serif'; ctx.textAlign = 'center';
    ctx.fillText('数据不足，需要至少 2 天', W / 2, H / 2); return;
  }

  var xStep = pw / (dayData.length - 1);
  var xOf = function(i) { return pad.l + i * xStep; };
  var yOf = function(v) { return pad.t + ph * (1 - v); };

  // 折线 V
  ctx.beginPath(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2;
  dayData.forEach(function(d, i) { var px = xOf(i), py = yOf(d.avgV); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }); ctx.stroke();
  // 折线 A
  ctx.beginPath(); ctx.strokeStyle = C.rose; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
  dayData.forEach(function(d, i) { var px = xOf(i), py = yOf(d.avgA); i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }); ctx.stroke();
  ctx.setLineDash([]);

  // 点
  dayData.forEach(function(d, i) {
    ctx.beginPath(); ctx.arc(xOf(i), yOf(d.avgV), 3, 0, Math.PI * 2); ctx.fillStyle = C.accent; ctx.fill();
    ctx.beginPath(); ctx.arc(xOf(i), yOf(d.avgA), 3, 0, Math.PI * 2); ctx.fillStyle = C.rose; ctx.fill();
  });

  // 日期轴
  ctx.fillStyle = C.ink4; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  dayData.forEach(function(d, i) {
    if (dayData.length <= 14 || i % Math.ceil(dayData.length / 12) === 0)
      ctx.fillText(d.date.slice(5), xOf(i), H - pad.b + 14);
  });

  // 图例
  ctx.fillStyle = C.accent; ctx.textAlign = 'right'; ctx.fillText('─ V', W - pad.r - 30, pad.t);
  ctx.fillStyle = C.rose; ctx.textAlign = 'left'; ctx.fillText('┅ A', W - pad.r - 20, pad.t);
}

// ═══════════════════════════════════════
function MoodApp(opts) {
  var embedded = opts && opts.embedded;
  var [feelBuckets, setFeelBuckets] = useState(null);
  var [bucketsData, setBucketsData] = useState([]);
  var [dark, setDark] = useState(false);
  var [loading, setLoading] = useState(true);
  var [error, setError] = useState(null);
  var [expandedDay, setExpandedDay] = useState(null);
  var [selectedDay, setSelectedDay] = useState(null);
  var compassRef = useRef(null);
  var chartRef = useRef(null);
  var dotsRef = useRef({ dots: [] });

  useEffect(function() {
    (async function() {
      try {
        var resp = await fetch('/api/buckets', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        var data = await resp.json();
        var all = Array.isArray(data) ? data : [];
        var feels = all.filter(function(b) { return b.feel || b.type === 'feel'; });
        setFeelBuckets(feels);
        setBucketsData(all);
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  var dayData = useMemo(function() {
    if (!feelBuckets) return [];
    var map = new Map();
    feelBuckets.forEach(function(b) {
      var d = (b.date || b.event_time || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(b);
    });
    var days = [];
    map.forEach(function(items, date) {
      var vs = items.map(function(i) { return i.valence ?? 0.5; });
      var as = items.map(function(i) { return i.arousal ?? 0.3; });
      days.push({ date: date, items: items, avgV: vs.reduce(function(s, v) { return s + v; }, 0) / vs.length, avgA: as.reduce(function(s, v) { return s + v; }, 0) / as.length, count: items.length });
    });
    days.sort(function(a, b) { return a.date.localeCompare(b.date); });
    return days;
  }, [feelBuckets]);

  var quadStats = useMemo(function() {
    if (!feelBuckets) return {};
    var q = {};
    feelBuckets.forEach(function(b) { var k = quadKey(b.valence ?? 0.5, b.arousal ?? 0.3); q[k] = (q[k] || 0) + 1; });
    return q;
  }, [feelBuckets]);

  // 画布
  useEffect(function() {
    var selItems = selectedDay ? (dayData.find(function(d) { return d.date === selectedDay; }) || {}).items : null;
    drawCompass(compassRef.current, feelBuckets, selItems, dotsRef);
  }, [feelBuckets, selectedDay]);

  useEffect(function() { drawChart(chartRef.current, dayData); }, [dayData]);

  // Canvas hover
  var handleCompassMove = function(e) {
    var d = dotsRef.current; if (!d.dots.length) return;
    var rect = compassRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    var found = null;
    for (var i = 0; i < d.dots.length; i++) {
      var dot = d.dots[i];
      if (Math.hypot(mx - dot.x, my - dot.y) < dot.r) { found = dot; break; }
    }
    compassRef.current.style.cursor = found ? 'pointer' : 'default';
    compassRef.current.title = found ? (found.item.title || found.item.id) + '\nV' + (found.item.valence ?? 0.5).toFixed(2) + ' A' + (found.item.arousal ?? 0.3).toFixed(2) : '';
  };
  var handleCompassClick = function(e) {
    var d = dotsRef.current;
    var rect = compassRef.current.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (var i = 0; i < d.dots.length; i++) {
      var dot = d.dots[i];
      if (Math.hypot(mx - dot.x, my - dot.y) < dot.r) { window.open('/v2/?id=' + dot.item.id, '_blank'); return; }
    }
  };

  var topbar = React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark });
  var nav = React.createElement(window.SharedNav, { active: 'mood' });
  if (loading) return embedded ? React.createElement('div', { className: 'md-loading' }, '绘制情绪星图…') : React.createElement('div', null, topbar, nav, React.createElement('div', { className: 'md-loading' }, '绘制情绪星图…'));

  var content = React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'md-hd' },
      React.createElement('h1', null, '情绪星图'),
      React.createElement('p', null, '横轴愉悦度 · 纵轴唤醒度 · ' + (feelBuckets ? feelBuckets.length : 0) + ' 条 feel 记忆'),
    ),
    React.createElement('div', { className: 'md-main' },
      React.createElement('aside', { className: 'md-left' },
        React.createElement('h3', null, '象限'),
        Object.entries(quadStats).map(function(e) { return React.createElement('div', { key: e[0], className: 'md-stat' }, (QUAD_LABELS[e[0]] || e[0]) + ' · ' + React.createElement('b', null, e[1])); }),
        React.createElement('div', { className: 'md-stat', style: { marginTop: 6 } }, '共 ' + dayData.length + ' 天'),
      ),
      React.createElement('div', { style: { flex: 1, overflow: 'auto' } },
        React.createElement('div', { style: { background: 'var(--paper)', borderBottom: '0.5px solid var(--line)', padding: 12 } },
          React.createElement('canvas', { ref: compassRef, style: { width: '100%', display: 'block', cursor: 'default' }, onMouseMove: handleCompassMove, onClick: handleCompassClick }),
        ),
        dayData.length > 0 && React.createElement('div', { style: { background: 'var(--paper)', borderBottom: '0.5px solid var(--line)', padding: '12px 20px' } },
          React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--serif)' } }, '情绪趋势'),
          React.createElement('canvas', { ref: function(el) { chartRef.current = el; }, style: { width: '100%', height: 200, display: 'block' } }),
        ),
        React.createElement('div', { style: { padding: '0 20px 40px' } },
          dayData.map(function(dd) {
            return React.createElement('div', {
              key: dd.date,
              style: { background: selectedDay === dd.date ? 'var(--accent-3)' : 'var(--paper)', border: '0.5px solid ' + (selectedDay === dd.date ? 'var(--accent)' : 'var(--line)'), borderRadius: 'var(--r-sm)', padding: '10px 14px', marginTop: 8, cursor: 'pointer' },
              onClick: function() { setExpandedDay(expandedDay === dd.date ? null : dd.date); setSelectedDay(function(p) { return p === dd.date ? null : dd.date; }); },
            },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
                React.createElement('span', { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' } }, dd.date),
                React.createElement('span', { style: { fontSize: 11, color: 'var(--ink-3)' } }, dd.count + ' 条'),
                React.createElement('span', { style: { fontSize: 11, color: C.accent } }, 'V ' + dd.avgV.toFixed(2)),
                React.createElement('span', { style: { fontSize: 11, color: C.rose } }, 'A ' + dd.avgA.toFixed(2)),
              ),
              expandedDay === dd.date && dd.items.sort(function(a, b) { return (a.time || '').localeCompare(b.time || ''); }).map(function(b) {
                return React.createElement('div', { key: b.id, style: { padding: '6px 0 6px 12px', borderTop: '0.5px dashed var(--line)', fontSize: 12, cursor: 'pointer' }, onClick: function(e) { e.stopPropagation(); window.open('/v2/?id=' + b.id, '_blank'); } },
                  React.createElement('span', { style: { color: 'var(--ink-3)', marginRight: 8 } }, (b.time || '').slice(0, 5)),
                  React.createElement('span', { style: { color: 'var(--ink)' } }, b.title || b.id),
                  b.highlight && ' ⭐',
                  React.createElement('span', { style: { color: 'var(--ink-4)', marginLeft: 8, fontSize: 10 } }, 'V' + (b.valence ?? 0.5).toFixed(1) + ' A' + (b.arousal ?? 0.3).toFixed(1)),
                );
              }),
            );
          }),
        ),
      ),
    ),
  );
  if (embedded) return content;
  return React.createElement('div', null, topbar, nav, content);
}

window.MoodApp = MoodApp;
var root = document.getElementById('root');
if (root && !window.__OB_SPA) ReactDOM.createRoot(root).render(React.createElement(MoodApp));
