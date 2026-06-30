// ============================================================
// plans-app.jsx — Ombre Brain 计划看板
// 调用 /api/plans 获取按状态分组的计划列表
// ============================================================

const { useState, useEffect } = React;

const NAV_HTML = `
<nav class="pl-topbar">
  <a href="/v2/" class="pl-brand">Ombre Brain</a>
  <span class="pl-nav-group">
    <a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a>
    <a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a>
    <a href="/v2/">时间线</a>
  </span><span class="pl-nav-divider"></span>
  <span class="pl-nav-group">
    <a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a>
    <a href="/v2/plans/" class="on">计划</a><a href="/v2/letters/">信</a>
    <a href="/v2/anchors/">锚点</a>
  </span><span class="pl-nav-divider"></span>
  <span class="pl-nav-group">
    <a href="/v2/console/import/">导入</a><a href="/v2/logs/">日志</a>
    <a href="/v2/console/config/">设置</a><a href="/v2/about/">关于</a>
  </span>
</nav>`;

function PlansApp() {
  const [groups, setGroups] = useState(null);  // { active:[], resolved:[], abandoned:[] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/plans', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setGroups(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const resp = await fetch('/api/plans/' + encodeURIComponent(id) + '/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include',
      });
      if (resp.ok) {
        // Refresh
        const r2 = await fetch('/api/plans', { credentials: 'include' });
        if (r2.ok) setGroups(await r2.json());
      }
    } catch (e) { /* ignore */ }
  };

  const statusClass = (s) => {
    if (s === 'resolved') return ' resolved';
    if (s === 'abandoned') return ' abandoned';
    return '';
  };

  if (loading) return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV_HTML } }),
    React.createElement('div', { className: 'pl-loading' }, '加载计划看板…'),
  );
  if (error) return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV_HTML } }),
    React.createElement('div', { className: 'pl-loading' }, '加载失败: ' + error),
  );

  const sections = [
    { key: 'active', label: '进行中', emoji: '📋' },
    { key: 'resolved', label: '已完成', emoji: '✅' },
    { key: 'abandoned', label: '已放弃', emoji: '🗑️' },
  ];

  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV_HTML } }),
    React.createElement('div', { className: 'pl-page' },
      React.createElement('div', { className: 'pl-hd' },
        React.createElement('h1', null, '计划看板'),
        React.createElement('p', null, 'Plan Kanban — 跟踪 AI 生成的执行计划'),
      ),
      sections.map(sec => {
        const items = (groups && groups[sec.key]) ? groups[sec.key] : [];
        return React.createElement('div', { key: sec.key, className: 'pl-section' },
          React.createElement('h3', null, `${sec.emoji} ${sec.label} · ${items.length}`),
          items.sort((a,b) => (b.weight||0) - (a.weight||0)).map(plan => {
            const meta = plan.metadata || plan;
            return React.createElement('div', {
              key: plan.id,
              className: 'pl-card',
              onClick: () => window.open('/v2/?id=' + plan.id, '_blank'),
            },
              React.createElement('div', { className: 'pl-card-title' },
                React.createElement('span', null, meta.name || plan.id),
                sec.key === 'active' && React.createElement('span', { className: 'pl-status' }, meta.status || 'active'),
                sec.key === 'resolved' && React.createElement('span', { className: 'pl-status resolved' }, 'resolved'),
                sec.key === 'abandoned' && React.createElement('span', { className: 'pl-status abandoned' }, 'abandoned'),
              ),
              meta.summary && React.createElement('div', { className: 'pl-card-preview' }, meta.summary.slice(0, 150)),
              React.createElement('div', { className: 'pl-card-meta' },
                React.createElement('span', null, '权重: ' + (meta.weight != null ? Number(meta.weight).toFixed(1) : '—')),
                React.createElement('span', null, '重要度: ' + (meta.importance || 5)),
                meta.domain && meta.domain.length > 0 && React.createElement('span', null, '域: ' + meta.domain.join(', ')),
              ),
              sec.key === 'active' && React.createElement('div', { style: { marginTop: '8px', display: 'flex', gap: '6px' }, onClick: e => e.stopPropagation() },
                React.createElement('button', {
                  style: { fontSize: '11px', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-dim)', cursor: 'pointer' },
                  onClick: () => handleAction(plan.id, 'resolve'),
                }, '✅ 完成'),
                React.createElement('button', {
                  style: { fontSize: '11px', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-dim)', cursor: 'pointer' },
                  onClick: () => handleAction(plan.id, 'abandon'),
                }, '🗑️ 放弃'),
              ),
            );
          }),
        );
      }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PlansApp));
