// ============================================================
// mood-app.jsx — Ombre Brain 情绪星图
// 2D 散点图：valence (愉悦度 x轴) × arousal (唤醒度 y轴)
// 仅展示 feel 型记忆，带 D3 渲染 + React 交互
// ============================================================

const { useState, useEffect, useRef, useMemo } = React;

const QUAD_LABELS = {
  ha_hv: '兴奋 😄',   // high arousal, high valence
  ha_lv: '紧张 😰',   // high arousal, low valence
  la_hv: '放松 😌',   // low arousal, high valence
  la_lv: '悲伤 😢',   // low arousal, low valence
};

function quadKey(v, a) {
  const hiV = v >= 0.5; const hiA = a >= 0.5;
  return (hiA ? 'ha' : 'la') + '_' + (hiV ? 'hv' : 'lv');
}

// ============================================================
function MoodApp() {
  const [feelBuckets, setFeelBuckets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/buckets', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        // Filter feel-type memories
        const feels = (Array.isArray(data) ? data : []).filter(b => b.feel || b.type === 'feel');
        setFeelBuckets(feels);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Quadrant stats
  const quadStats = useMemo(() => {
    if (!feelBuckets) return {};
    const q = {};
    for (const b of feelBuckets) {
      const v = b.valence ?? 0.5;
      const a = b.arousal ?? 0.3;
      const k = quadKey(v, a);
      q[k] = (q[k] || 0) + 1;
    }
    return q;
  }, [feelBuckets]);

  // D3 render
  useEffect(() => {
    if (!svgRef.current || !feelBuckets) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = svgRef.current.clientWidth || 800;
    const h = svgRef.current.clientHeight || 550;
    const pad = { t: 30, r: 30, b: 40, l: 50 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;

    const xScale = d3.scaleLinear().domain([-0.05, 1.05]).range([0, pw]);
    const yScale = d3.scaleLinear().domain([1.05, -0.05]).range([0, ph]); // inverted: high arousal = top
    const rScale = d3.scaleLinear().domain([1, 10]).range([5, 18]);

    const g = svg.append('g').attr('transform', `translate(${pad.l},${pad.t})`);

    // Background quadrants
    const quads = [
      { x: 0, y: 0, w: 0.5, h: 0.5, fill: 'rgba(210,145,179,0.08)' },
      { x: 0.5, y: 0, w: 0.5, h: 0.5, fill: 'rgba(124,111,184,0.08)' },
      { x: 0, y: 0.5, w: 0.5, h: 0.5, fill: 'rgba(138,135,150,0.06)' },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5, fill: 'rgba(212,168,95,0.08)' },
    ];
    quads.forEach(q => {
      g.append('rect')
        .attr('x', xScale(q.x)).attr('y', yScale(q.y + q.h))
        .attr('width', xScale(q.w) - xScale(0)).attr('height', yScale(0) - yScale(q.h))
        .attr('fill', q.fill);
    });

    // Center lines
    g.append('line').attr('x1', xScale(0.5)).attr('x2', xScale(0.5)).attr('y1', yScale(0)).attr('y2', yScale(1))
      .attr('stroke', 'var(--line)').attr('stroke-width', 1).attr('stroke-dasharray', '4 4');
    g.append('line').attr('x1', xScale(0)).attr('x2', xScale(1)).attr('y1', yScale(0.5)).attr('y2', yScale(0.5))
      .attr('stroke', 'var(--line)').attr('stroke-width', 1).attr('stroke-dasharray', '4 4');

    // Quadrant labels
    const qLabels = [
      { v: 0.25, a: 0.75, text: '紧张' },
      { v: 0.75, a: 0.75, text: '兴奋' },
      { v: 0.25, a: 0.25, text: '悲伤' },
      { v: 0.75, a: 0.25, text: '放松' },
    ];
    g.selectAll('text.quad-label').data(qLabels).join('text')
      .attr('class', 'quad-label')
      .attr('x', d => xScale(d.v)).attr('y', d => yScale(d.a))
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('font-size', '13px').attr('fill', 'var(--ink-dim)')
      .attr('font-family', 'var(--serif)').attr('opacity', 0.5)
      .text(d => d.text);

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.0%'));
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.0%'));
    g.append('g').attr('transform', `translate(0,${ph})`).call(xAxis)
      .selectAll('text').attr('font-size', '10px').attr('fill', 'var(--ink-dim)');
    g.append('g').call(yAxis)
      .selectAll('text').attr('font-size', '10px').attr('fill', 'var(--ink-dim)');

    // Axis labels
    g.append('text').attr('x', pw / 2).attr('y', ph + 32)
      .attr('text-anchor', 'middle').attr('font-size', '11px')
      .attr('fill', 'var(--ink-dim)').text('愉悦度 Valence →');
    g.append('text').attr('x', -ph / 2).attr('y', -35)
      .attr('text-anchor', 'middle').attr('font-size', '11px')
      .attr('fill', 'var(--ink-dim)')
      .attr('transform', 'rotate(-90)').text('唤醒度 Arousal →');

    // Data points
    const colorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(['#6b9ec4', '#8a8796', '#d291b3']);

    g.selectAll('circle.dot').data(feelBuckets).join('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d.valence ?? 0.5))
      .attr('cy', d => yScale(d.arousal ?? 0.3))
      .attr('r', d => rScale(d.importance || 5))
      .attr('fill', d => colorScale(d.valence ?? 0.5))
      .attr('fill-opacity', 0.7)
      .attr('stroke', d => d.highlight ? 'var(--rose)' : 'transparent')
      .attr('stroke-width', d => d.highlight ? 2 : 0)
      .style('cursor', 'pointer')
      .on('mouseenter', function(evt, d) {
        setHovered(d);
        setTipPos({ x: evt.clientX + 14, y: evt.clientY - 10 });
        d3.select(this).attr('fill-opacity', 1).attr('stroke', 'var(--accent)').attr('stroke-width', 2);
      })
      .on('mouseleave', function(evt, d) {
        setHovered(null);
        d3.select(this).attr('fill-opacity', 0.7).attr('stroke', d.highlight ? 'var(--rose)' : 'transparent').attr('stroke-width', d.highlight ? 2 : 0);
      })
      .on('click', (evt, d) => {
        window.open('/v2/?id=' + d.id, '_blank');
      });
  }, [feelBuckets]);

  // ============================================================
  return (
    <div>
      {/* Nav */}
      <nav className="md-topbar">
        <a href="/v2/" className="md-brand">Ombre Brain</a>
        <span className="md-nav-group">
          <a href="/v2/cells/">Cells</a>
          <a href="/v2/console/breath/">Breath</a>
          <a href="/v2/network/">记忆网络</a>
          <a href="/v2/calendar/">日历</a>
          <a href="/v2/">时间线</a>
        </span>
        <span className="md-nav-divider"></span>
        <span className="md-nav-group">
          <a href="/v2/mood/" className="on">情绪</a>
          <a href="/v2/replay/">Replay</a>
          <a href="/v2/plans/">计划</a>
          <a href="/v2/letters/">信</a>
          <a href="/v2/anchors/">锚点</a>
        </span>
        <span className="md-nav-divider"></span>
        <span className="md-nav-group">
          <a href="/v2/console/import/">导入</a>
          <a href="/v2/logs/">日志</a>
          <a href="/v2/console/config/">设置</a>
          <a href="/v2/about/">关于</a>
        </span>
      </nav>

      <div className="md-hd">
        <h1>情绪星图</h1>
        <p>横轴愉悦度 · 纵轴唤醒度 · 每颗星 = 一个 feel 记忆</p>
      </div>

      <div className="md-main">
        {/* Left sidebar */}
        <aside className="md-left">
          <div>
            <h3>统计</h3>
            <div className="md-stat"><b>{feelBuckets ? feelBuckets.length : '…'}</b> 条 feel 记忆</div>
            {Object.entries(quadStats).map(([k, n]) => (
              <div key={k} className="md-stat" style={{marginTop:'4px'}}>
                {QUAD_LABELS[k] || k} · <b>{n}</b>
              </div>
            ))}
          </div>
          <div>
            <h3>图例</h3>
            <div className="md-legend-row"><span className="md-legend-dot" style={{background:'#6b9ec4'}}></span> 不悦</div>
            <div className="md-legend-row"><span className="md-legend-dot" style={{background:'#8a8796'}}></span> 中性</div>
            <div className="md-legend-row"><span className="md-legend-dot" style={{background:'#d291b3'}}></span> 愉悦</div>
            <div className="md-legend-row" style={{marginTop:'6px'}}><span className="md-legend-dot" style={{border:'2px solid var(--rose)',background:'transparent',width:8,height:8}}></span> 高亮记忆</div>
          </div>
          {hovered && (
            <div style={{padding:'10px',background:'var(--accent-soft)',borderRadius:'8px'}}>
              <div style={{fontSize:'13px',fontWeight:500}}>{hovered.title || hovered.id}</div>
              {hovered.summary && <div style={{fontSize:'11px',color:'var(--ink-dim)',marginTop:'3px'}}>{hovered.summary.slice(0, 80)}</div>}
              <div style={{fontSize:'10px',color:'var(--ink-dim)',marginTop:'4px'}}>
                V {(hovered.valence??0.5).toFixed(2)} · A {(hovered.arousal??0.3).toFixed(2)} · 重要度 {hovered.importance||5}
              </div>
            </div>
          )}
        </aside>

        {/* Chart */}
        <div className="md-chart-wrap">
          {loading && <div className="md-loading">绘制情绪星图…</div>}
          {error && <div className="md-loading">加载失败: {error}</div>}
          <svg ref={svgRef}></svg>
          <div className="md-tip" ref={tipRef} style={{
            display: hovered ? 'block' : 'none',
            left: tipPos.x, top: tipPos.y,
          }}>
            {hovered && <>
              <div className="md-tip-title">{hovered.title || hovered.id}</div>
              {hovered.summary && <div className="md-tip-summary">{hovered.summary.slice(0, 120)}</div>}
            </>}
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MoodApp />);
