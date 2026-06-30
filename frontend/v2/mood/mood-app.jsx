const { useState, useEffect, useRef, useMemo } = React;

function quadKey(v, a) {
  return (a >= 0.5 ? 'ha' : 'la') + '_' + (v >= 0.5 ? 'hv' : 'lv');
}
const QUAD_LABELS = { ha_hv: '兴奋', ha_lv: '紧张', la_hv: '放松', la_lv: '悲伤' };

function MoodApp(opts) {
  var embedded = opts && opts.embedded;
  const [feelBuckets, setFeelBuckets] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const svgRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [resp, br] = await Promise.all([
          fetch('/api/buckets', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        const all = Array.isArray(data) ? data : [];
        const feels = all.filter(b => b.feel || b.type === 'feel');
        setFeelBuckets(feels);
        if (br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  // Build day-indexed data
  const dayData = useMemo(() => {
    if (!feelBuckets) return [];
    const map = new Map();
    feelBuckets.forEach(b => {
      const d = (b.date || '').slice(0, 10);
      if (!d) return;
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(b);
    });
    const days = [];
    map.forEach((items, date) => {
      const vs = items.map(i => i.valence ?? 0.5);
      const as = items.map(i => i.arousal ?? 0.3);
      const avgV = vs.reduce((s, v) => s + v, 0) / vs.length;
      const avgA = as.reduce((s, v) => s + v, 0) / as.length;
      days.push({ date, items, avgV, avgA, count: items.length, minV: Math.min(...vs), maxV: Math.max(...vs), minA: Math.min(...as), maxA: Math.max(...as) });
    });
    days.sort((a, b) => a.date.localeCompare(b.date));
    return days;
  }, [feelBuckets]);

  const quadStats = useMemo(() => {
    if (!feelBuckets) return {};
    const q = {};
    feelBuckets.forEach(b => { const k = quadKey(b.valence ?? 0.5, b.arousal ?? 0.3); q[k] = (q[k] || 0) + 1; });
    return q;
  }, [feelBuckets]);

  // D3 scatter plot
  useEffect(() => {
    if (!svgRef.current || !feelBuckets || feelBuckets.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const w = svgRef.current.clientWidth || 700;
    const h = svgRef.current.clientHeight || 450;
    const pad = { t: 24, r: 20, b: 36, l: 42 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const x = d3.scaleLinear().domain([-0.05, 1.05]).range([0, pw]);
    const y = d3.scaleLinear().domain([1.05, -0.05]).range([0, ph]);
    const r = d3.scaleLinear().domain([1, 10]).range([4, 16]);
    const color = d3.scaleLinear().domain([0, 0.5, 1]).range(['#6b9ec4', '#8a8898', '#d291b3']);
    const g = svg.append('g').attr('transform', 'translate(' + pad.l + ',' + pad.t + ')');
    const bgQuads = [{ x: 0, y: 0, w: 0.5, h: 0.5, fill: 'rgba(210,145,179,0.06)' }, { x: 0.5, y: 0, w: 0.5, h: 0.5, fill: 'rgba(110,79,154,0.06)' }, { x: 0, y: 0.5, w: 0.5, h: 0.5, fill: 'rgba(138,136,152,0.04)' }, { x: 0.5, y: 0.5, w: 0.5, h: 0.5, fill: 'rgba(212,168,95,0.06)' }];
    bgQuads.forEach(q => g.append('rect').attr('x', x(q.x)).attr('y', y(q.y + q.h)).attr('width', x(q.w) - x(0)).attr('height', y(0) - y(q.h)).attr('fill', q.fill));
    g.append('line').attr('x1', x(0.5)).attr('x2', x(0.5)).attr('y1', y(0)).attr('y2', y(1)).attr('stroke', 'var(--line)').attr('stroke-width', 1).attr('stroke-dasharray', '4 4');
    g.append('line').attr('x1', x(0)).attr('x2', x(1)).attr('y1', y(0.5)).attr('y2', y(0.5)).attr('stroke', 'var(--line)').attr('stroke-width', 1).attr('stroke-dasharray', '4 4');
    // Quad labels
    [{ v: 0.25, a: 0.75, t: '紧张' }, { v: 0.75, a: 0.75, t: '兴奋' }, { v: 0.25, a: 0.25, t: '悲伤' }, { v: 0.75, a: 0.25, t: '放松' }].forEach(ql => {
      g.append('text').attr('x', x(ql.v)).attr('y', y(ql.a)).attr('text-anchor', 'middle').attr('dy', '0.35em').attr('font-size', 12).attr('fill', 'var(--ink-4)').attr('font-family', 'var(--serif)').attr('opacity', 0.5).text(ql.t);
    });
    // Points
    g.selectAll('circle.dot').data(feelBuckets).join('circle').attr('class', 'dot')
      .attr('cx', d => x(d.valence ?? 0.5)).attr('cy', d => y(d.arousal ?? 0.3))
      .attr('r', d => r(d.importance || 5)).attr('fill', d => color(d.valence ?? 0.5))
      .attr('fill-opacity', 0.7).attr('stroke', d => d.highlight ? 'var(--rose)' : 'transparent').attr('stroke-width', d => d.highlight ? 2 : 0)
      .style('cursor', 'pointer')
      .on('click', (evt, d) => window.open('/v2/?id=' + d.id, '_blank'))
      .append('title').text(d => (d.title || d.id) + '\nV:' + (d.valence ?? 0.5).toFixed(2) + ' A:' + (d.arousal ?? 0.3).toFixed(2));
    // Axes
    g.append('g').attr('transform', 'translate(0,' + ph + ')').call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('.0%'))).selectAll('text').attr('font-size', 10).attr('fill', 'var(--ink-4)');
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('.0%'))).selectAll('text').attr('font-size', 10).attr('fill', 'var(--ink-4)');
    g.append('text').attr('x', pw / 2).attr('y', ph + 28).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', 'var(--ink-4)').text('愉悦度 →');
    g.append('text').attr('x', -ph / 2).attr('y', -28).attr('text-anchor', 'middle').attr('font-size', 10).attr('fill', 'var(--ink-4)').attr('transform', 'rotate(-90)').text('唤醒度 →');
  }, [feelBuckets]);

  // Time-series chart
  useEffect(() => {
    if (!chartRef.current || dayData.length === 0) return;
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();
    const w = chartRef.current.clientWidth || 700;
    const h = 200;
    const pad = { t: 10, r: 16, b: 30, l: 36 };
    const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
    const dates = dayData.map(d => d.date);
    const x = d3.scalePoint().domain(dates).range([0, pw]).padding(0.3);
    const y = d3.scaleLinear().domain([-0.05, 1.05]).range([ph, 0]);
    const g = svg.append('g').attr('transform', 'translate(' + pad.l + ',' + pad.t + ')');
    const lineV = d3.line().x(d => x(d.date)).y(d => y(d.avgV)).curve(d3.curveMonotoneX);
    const lineA = d3.line().x(d => x(d.date)).y(d => y(d.avgA)).curve(d3.curveMonotoneX);
    g.append('path').datum(dayData).attr('fill', 'none').attr('stroke', '#6e4f9a').attr('stroke-width', 2).attr('d', lineV);
    g.append('path').datum(dayData).attr('fill', 'none').attr('stroke', '#d291b3').attr('stroke-width', 2).attr('stroke-dasharray', '4 3').attr('d', lineA);
    g.selectAll('circle.v').data(dayData).join('circle').attr('cx', d => x(d.date)).attr('cy', d => y(d.avgV)).attr('r', 3).attr('fill', '#6e4f9a');
    g.selectAll('circle.a').data(dayData).join('circle').attr('cx', d => x(d.date)).attr('cy', d => y(d.avgA)).attr('r', 3).attr('fill', '#d291b3');
    g.append('g').attr('transform', 'translate(0,' + ph + ')').call(d3.axisBottom(x).tickFormat(d => d.slice(5))).selectAll('text').attr('font-size', 9).attr('fill', 'var(--ink-4)');
    g.append('g').call(d3.axisLeft(y).ticks(3).tickFormat(d3.format('.0%'))).selectAll('text').attr('font-size', 9).attr('fill', 'var(--ink-4)');
    // Legend
    g.append('text').attr('x', pw - 60).attr('y', 10).attr('font-size', 10).attr('fill', '#6e4f9a').text('─ V');
    g.append('text').attr('x', pw - 30).attr('y', 10).attr('font-size', 10).attr('fill', '#d291b3').text('┅ A');
  }, [dayData]);

  var topbar = React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark });
  var nav = React.createElement(window.SharedNav, { active: 'mood' });
  if (loading) return embedded ? React.createElement('div', { className: 'md-loading' }, '绘制情绪星图…') : React.createElement('div', null, topbar, nav, React.createElement('div', { className: 'md-loading' }, '绘制情绪星图…'));

  var content = React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'md-hd' },
      React.createElement('h1', null, '情绪星图'),
      React.createElement('p', null, '横轴愉悦度 · 纵轴唤醒度 · 每颗星 = 一个 feel 记忆 · ' + (feelBuckets ? feelBuckets.length : 0) + ' 条'),
    ),
    React.createElement('div', { className: 'md-main' },
      React.createElement('aside', { className: 'md-left' },
        React.createElement('div', null,
          React.createElement('h3', null, '象限'),
          Object.entries(quadStats).map(([k, n]) => React.createElement('div', { key: k, className: 'md-stat' }, (QUAD_LABELS[k] || k) + ' · ' + React.createElement('b', null, n))),
          React.createElement('div', { className: 'md-stat', style: { marginTop: 6 } }, '共 ' + dayData.length + ' 天'),
        ),
      ),
      React.createElement('div', { style: { flex: 1, overflow: 'auto' } },
        // Scatter
        React.createElement('div', { style: { background: 'var(--paper)', borderBottom: '0.5px solid var(--line)', padding: 12 } },
          React.createElement('svg', { ref: svgRef, style: { width: '100%', height: 450, display: 'block' } }),
        ),
        // Time series
        dayData.length > 0 && React.createElement('div', { style: { background: 'var(--paper)', borderBottom: '0.5px solid var(--line)', padding: '12px 20px' } },
          React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontFamily: 'var(--serif)' } }, '情绪趋势'),
          React.createElement('svg', { ref: chartRef, style: { width: '100%', height: 200, display: 'block' } }),
        ),
        // Day list
        React.createElement('div', { style: { padding: '0 20px 40px' } },
          dayData.map(dd => React.createElement('div', { key: dd.date,
            style: {
              background: selectedDay === dd.date ? 'var(--accent-3)' : 'var(--paper)',
              border: '0.5px solid ' + (selectedDay === dd.date ? 'var(--accent)' : 'var(--line)'),
              borderRadius: 'var(--r-sm)', padding: '10px 14px', marginTop: 8, cursor: 'pointer',
            },
            onClick: () => { setExpandedDay(expandedDay === dd.date ? null : dd.date); setSelectedDay(dd.date); },
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } },
              React.createElement('span', { style: { fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' } }, dd.date),
              React.createElement('span', { style: { fontSize: 11, color: 'var(--ink-3)' } }, dd.count + ' 条'),
              React.createElement('span', { style: { fontSize: 11, color: '#6e4f9a' } }, 'V ' + dd.avgV.toFixed(2)),
              React.createElement('span', { style: { fontSize: 11, color: '#d291b3' } }, 'A ' + dd.avgA.toFixed(2)),
            ),
            expandedDay === dd.date && dd.items.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(b => React.createElement('div', {
              key: b.id,
              style: { padding: '6px 0 6px 12px', borderTop: '0.5px dashed var(--line)', fontSize: 12, cursor: 'pointer' },
              onClick: (e) => { e.stopPropagation(); window.open('/v2/?id=' + b.id, '_blank'); },
            },
              React.createElement('span', { style: { color: 'var(--ink-3)', marginRight: 8 } }, (b.time || '').slice(0, 5)),
              React.createElement('span', { style: { color: 'var(--ink)' } }, b.title || b.id),
              b.highlight && ' ⭐',
              React.createElement('span', { style: { color: 'var(--ink-4)', marginLeft: 8, fontSize: 10 } }, 'V' + (b.valence ?? 0.5).toFixed(1) + ' A' + (b.arousal ?? 0.3).toFixed(1)),
            )),
          )),
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
