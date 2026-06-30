// ============================================================
// network-app.jsx — Ombre Brain 记忆网络（概念共现图）
// D3.js v7 力导向布局 + React 状态管理 + v2 主题系统
// ============================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ============================================================
// Constants
// ============================================================
const KIND_COLORS = {
  wiki: '#7c6fb8',    // accent purple
  tag: '#d4a85f',     // gold
  mixed: '#d291b3',   // rose
};
const KIND_LABELS = { wiki: '[[ 双链 ]]', tag: '# 标签', mixed: '双链+标签' };
const NODE_R_MIN = 5;
const NODE_R_MAX = 22;

// ============================================================
// Main App Component
// ============================================================
function NetworkApp() {
  // ---- State ----
  const [graph, setGraph] = useState(null);         // { nodes, edges, mode }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedNode, setFocusedNode] = useState(null);  // clicked concept
  const [hoveredNode, setHoveredNode] = useState(null);  // hovered concept
  const [searchQ, setSearchQ] = useState('');
  const [kindFilter, setKindFilter] = useState(null);    // null=all, 'wiki', 'tag', 'mixed'
  const [layoutMode, setLayoutMode] = useState('force'); // 'force' | 'ring'
  const [showLabels, setShowLabels] = useState('smart'); // 'smart' | 'always' | 'never'
  const [zoom, setZoom] = useState(1);
  const [rightOpen, setRightOpen] = useState(false);

  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const simulationRef = useRef(null);

  // ---- Data Fetch ----
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/network?mode=concept', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setGraph(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---- Filtered graph ----
  const filtered = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };

    let nodes = graph.nodes || [];
    let edges = graph.edges || [];

    // Kind filter
    if (kindFilter) {
      const keepIds = new Set(nodes.filter(n => n.kind === kindFilter).map(n => n.id));
      nodes = nodes.filter(n => keepIds.has(n.id));
      edges = edges.filter(e => keepIds.has(e.source) && keepIds.has(e.target));
    }

    // Search filter — match label
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      const matchIds = new Set(nodes.filter(n => n.label.toLowerCase().includes(q)).map(n => n.id));
      // Include 1-hop neighbors
      edges.forEach(e => {
        if (matchIds.has(e.source)) matchIds.add(e.target);
        if (matchIds.has(e.target)) matchIds.add(e.source);
      });
      nodes = nodes.filter(n => matchIds.has(n.id));
      edges = edges.filter(e => matchIds.has(e.source) && matchIds.has(e.target));
    }

    // Focus mode
    if (focusedNode) {
      const keepIds = new Set([focusedNode.id]);
      edges.forEach(e => {
        if (e.source === focusedNode.id) keepIds.add(e.target);
        if (e.target === focusedNode.id) keepIds.add(e.source);
      });
      nodes = nodes.filter(n => keepIds.has(n.id));
      edges = edges.filter(e => keepIds.has(e.source) && keepIds.has(e.target));
    }

    return { nodes, edges };
  }, [graph, kindFilter, searchQ, focusedNode]);

  // ---- D3 Force Simulation ----
  useEffect(() => {
    if (!svgRef.current || !graph || filtered.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth || 900;
    const height = svgRef.current.clientHeight || 600;
    const cx = width / 2;
    const cy = height / 2;

    // Clear previous
    svg.selectAll('g.force-layer').remove();
    const g = svg.append('g').attr('class', 'force-layer');

    // Prepare data
    const nodes = filtered.nodes.map(n => ({
      ...n,
      r: NODE_R_MIN + Math.min((n.freq || 1) - 1, 10) * 1.5,
    }));

    // Build edge lookup
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const links = filtered.edges
      .map(e => ({ source: e.source, target: e.target, weight: e.weight || 1 }))
      .filter(l => nodeMap.has(l.source) && nodeMap.has(l.target));

    // --- Simulation ---
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(d => 140 - Math.min(60, (d.weight || 1) * 10)).strength(d => 0.03 + (d.weight || 1) * 0.01))
      .force('charge', d3.forceManyBody().strength(d => -80 - (d.r || 8) * 8))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide().radius(d => (d.r || 8) + 3))
      .alphaDecay(0.02)
      .on('tick', () => {
        // Clamp nodes within bounds
        nodes.forEach(d => {
          d.x = Math.max(d.r, Math.min(width - d.r, d.x));
          d.y = Math.max(d.r, Math.min(height - d.r, d.y));
        });

        // Render links
        const linkSel = g.selectAll('line.nw-edge').data(links, d => d.source.id + '|' + d.target.id);
        linkSel.join(
          enter => enter.append('line').attr('class', 'nw-edge'),
          update => update,
          exit => exit.remove()
        )
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
          .attr('stroke', 'var(--line)')
          .attr('stroke-width', d => Math.max(0.5, Math.min(3, (d.weight || 1) * 0.6)));

        // Render nodes
        const nodeSel = g.selectAll('g.nw-node').data(nodes, d => d.id);
        const nodeEnter = nodeSel.enter().append('g').attr('class', 'nw-node');

        nodeEnter.append('circle')
          .attr('class', 'nw-node-bg')
          .attr('r', d => d.r + 3)
          .attr('fill', 'transparent')
          .attr('stroke', 'transparent');

        nodeEnter.append('circle')
          .attr('class', 'nw-node-core')
          .attr('r', d => d.r);

        nodeEnter.append('text')
          .attr('class', 'nw-node-label')
          .attr('text-anchor', 'middle')
          .attr('dy', d => d.r + 13)
          .attr('font-size', '10px')
          .attr('fill', 'var(--ink-dim)')
          .text(d => d.label);

        const nodeMerge = nodeEnter.merge(nodeSel);
        nodeMerge.attr('transform', d => `translate(${d.x},${d.y})`);

        nodeMerge.select('circle.nw-node-core')
          .attr('fill', d => KIND_COLORS[d.kind] || 'var(--accent)')
          .attr('opacity', d => {
            if (!focusedNode && !searchQ.trim()) return 0.85;
            // In focus/search mode, all visible nodes are relevant
            return 0.9;
          });

        nodeMerge.select('text.nw-node-label')
          .style('display', () => {
            if (showLabels === 'never') return 'none';
            if (showLabels === 'always') return 'block';
            // Smart: show for freq >= 3 or focused
            return (d.freq >= 3 || (focusedNode && d.id === focusedNode.id)) ? 'block' : 'none';
          });

        nodeSel.exit().remove();
      });

    simulationRef.current = sim;

    // Zoom handler
    const zoomHandler = d3.zoom()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(Math.round(event.transform.k * 100) / 100);
      });

    svg.call(zoomHandler);

    return () => {
      sim.stop();
    };
  }, [filtered, focusedNode, showLabels, searchQ, graph]);

  // ---- Interaction handlers ----
  const handleNodeHover = useCallback((node, evt) => {
    setHoveredNode(node);
    const tip = tooltipRef.current;
    if (!tip || !node) { if (tip) tip.style.display = 'none'; return; }
    tip.style.display = 'block';
    tip.style.left = (evt.clientX + 16) + 'px';
    tip.style.top = (evt.clientY - 10) + 'px';
    tip.innerHTML = `
      <div class="nw-tt-label">${node.label}</div>
      <div class="nw-tt-meta">${KIND_LABELS[node.kind] || node.kind} · 出现 ${node.freq} 次 · ${(node.buckets || []).length} 条记忆</div>
    `;
  }, []);

  const handleNodeClick = useCallback((node) => {
    if (focusedNode && focusedNode.id === node.id) {
      setFocusedNode(null);
      setRightOpen(false);
    } else {
      setFocusedNode(node);
      setRightOpen(true);
    }
  }, [focusedNode]);

  // ---- Stats ----
  const stats = useMemo(() => {
    if (!graph) return { nodes: 0, edges: 0, buckets: 0 };
    const allBuckets = new Set();
    (graph.nodes || []).forEach(n => (n.buckets || []).forEach(bid => allBuckets.add(bid)));
    return {
      nodes: (graph.nodes || []).length,
      edges: (graph.edges || []).length,
      buckets: allBuckets.size,
    };
  }, [graph]);

  // ---- Render ----
  return (
    <div>
      {/* Top Nav Bar */}
      <nav className="nw-topbar">
        <a href="/v2/" className="nw-brand">Ombre Brain</a>
        <span className="nw-nav-group">
          <a href="/v2/cells/">Cells</a>
          <a href="/v2/console/breath/">Breath</a>
          <a href="/v2/network/" className="on">记忆网络</a>
          <a href="/v2/calendar/">日历</a>
          <a href="/v2/">时间线</a>
        </span>
        <span className="nw-nav-divider"></span>
        <span className="nw-nav-group">
          <a href="/v2/mood/">情绪</a>
          <a href="/v2/replay/">Replay</a>
          <a href="/v2/plans/">计划</a>
          <a href="/v2/letters/">信</a>
          <a href="/v2/anchors/">锚点</a>
        </span>
        <span className="nw-nav-divider"></span>
        <span className="nw-nav-group">
          <a href="/v2/console/import/">导入</a>
          <a href="/v2/logs/">日志</a>
          <a href="/v2/settings/">设置</a>
          <a href="/v2/about/">关于</a>
        </span>
      </nav>

      {/* Main */}
      <div className="nw-main">
        {/* Left Panel */}
        <aside className="nw-left">
          <div>
            <label>搜索概念</label>
            <input type="text" placeholder="输入概念名…" value={searchQ}
              onChange={e => { setSearchQ(e.target.value); setFocusedNode(null); }} />
          </div>

          <div>
            <h3>类型过滤</h3>
            <div className="nw-filter-chips">
              <span className={'nw-chip' + (!kindFilter ? ' on' : '')} onClick={() => setKindFilter(null)}>全部</span>
              <span className={'nw-chip' + (kindFilter === 'wiki' ? ' on' : '')} onClick={() => setKindFilter(kindFilter === 'wiki' ? null : 'wiki')}>[[ 双链 ]]</span>
              <span className={'nw-chip' + (kindFilter === 'tag' ? ' on' : '')} onClick={() => setKindFilter(kindFilter === 'tag' ? null : 'tag')}># 标签</span>
              <span className={'nw-chip' + (kindFilter === 'mixed' ? ' on' : '')} onClick={() => setKindFilter(kindFilter === 'mixed' ? null : 'mixed')}>混合</span>
            </div>
          </div>

          <div>
            <h3>图统计</h3>
            <div className="nw-stats">
              概念节点 <span>{stats.nodes}</span> · 共现边 <span>{stats.edges}</span> · 涉及记忆 <span>{stats.buckets}</span>
            </div>
          </div>

          <div>
            <h3>图例</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {Object.entries(KIND_COLORS).map(([k, color]) => (
                <div key={k} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'var(--ink-dim)'}}>
                  <span style={{width:12,height:12,borderRadius:'50%',background:color,display:'inline-block'}}></span>
                  {KIND_LABELS[k]}
                </div>
              ))}
            </div>
          </div>

          {focusedNode && (
            <div>
              <h3>已聚焦</h3>
              <div style={{fontSize:'13px'}}>
                <strong style={{color:KIND_COLORS[focusedNode.kind]}}>{focusedNode.label}</strong>
                <div style={{fontSize:'11px',color:'var(--ink-dim)',marginTop:'4px'}}>
                  {(focusedNode.buckets || []).length} 条记忆 · 出现 {focusedNode.freq} 次
                </div>
                <button style={{marginTop:'8px',fontSize:'11px',padding:'3px 10px',borderRadius:'6px',border:'1px solid var(--line)',background:'var(--bg)',color:'var(--ink-dim)',cursor:'pointer'}}
                  onClick={() => { setFocusedNode(null); setRightOpen(false); }}>取消聚焦</button>
              </div>
            </div>
          )}
        </aside>

        {/* Canvas Area */}
        <div className="nw-canvas-wrap">
          {loading && <div className="nw-loading">绘制记忆星座…</div>}
          {error && <div className="nw-loading">加载失败: {error}</div>}
          <svg ref={svgRef}></svg>
          <div className="nw-tooltip" ref={tooltipRef}></div>
        </div>

        {/* Right Drawer */}
        <aside className={'nw-right' + (rightOpen ? ' open' : '')}>
          {focusedNode && (
            <div className="nw-right-inner">
              <h3 style={{color: KIND_COLORS[focusedNode.kind]}}>{focusedNode.label}</h3>
              <div className="nw-meta">
                {KIND_LABELS[focusedNode.kind]} · 出现 {focusedNode.freq} 次 · {(focusedNode.buckets || []).length} 条记忆
                {focusedNode.anchor && ' · ⚓ 锚点'}
              </div>
              <button style={{marginTop:'8px',marginBottom:'16px',fontSize:'11px',padding:'4px 12px',borderRadius:'6px',border:'1px solid var(--line)',background:'var(--bg)',color:'var(--ink-dim)',cursor:'pointer'}}
                onClick={() => { setRightOpen(false); }}>关闭</button>

              <div style={{fontSize:'12px',color:'var(--ink-dim)',marginBottom:'8px'}}>关联记忆</div>
              <div className="nw-bucket-list">
                {(focusedNode.buckets || []).slice(0, 20).map(bid => (
                  <BucketItem key={bid} bucketId={bid} />
                ))}
                {(focusedNode.buckets || []).length > 20 && (
                  <div style={{fontSize:'11px',color:'var(--ink-dim)',textAlign:'center',padding:'8px'}}>
                    还有 {focusedNode.buckets.length - 20} 条…
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Bar */}
      <div className="nw-bottombar">
        <button className={layoutMode === 'force' ? 'on' : ''} onClick={() => setLayoutMode('force')}>力导向</button>
        <button className={layoutMode === 'ring' ? 'on' : ''} onClick={() => setLayoutMode('ring')}>环形</button>
        <span style={{fontSize:'11px',color:'var(--line)',margin:'0 8px'}}>|</span>
        <button className={showLabels === 'smart' ? 'on' : ''} onClick={() => setShowLabels('smart')}>智能标签</button>
        <button className={showLabels === 'always' ? 'on' : ''} onClick={() => setShowLabels('always')}>全部标签</button>
        <button className={showLabels === 'never' ? 'on' : ''} onClick={() => setShowLabels('never')}>隐藏标签</button>
        <span className="nw-zoom-info">缩放 {zoom}×</span>
      </div>
    </div>
  );
}

// ============================================================
// BucketItem — lazy-loads bucket detail for right drawer
// ============================================================
function BucketItem({ bucketId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/bucket/' + encodeURIComponent(bucketId), { credentials: 'include' });
        if (resp.ok) setData(await resp.json());
      } catch (e) { /* silent */ }
    })();
  }, [bucketId]);

  if (!data) return <div className="nw-bucket-item" style={{opacity:0.5}}>加载中…</div>;

  const meta = data.metadata || {};
  return (
    <div className="nw-bucket-item" onClick={() => window.open('/v2/?id=' + bucketId, '_blank')}>
      <div className="nw-b-name">{meta.name || bucketId}</div>
      <div className="nw-b-preview">{(data.content || '').slice(0, 80)}</div>
    </div>
  );
}

// ============================================================
// Mount
// ============================================================
ReactDOM.createRoot(document.getElementById('root')).render(<NetworkApp />);
