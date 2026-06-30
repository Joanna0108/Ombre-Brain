const { useState, useEffect } = React;

function weightLabel(w) {
  if (w == null) return '';
  if (w >= 0.8) return '必须';
  if (w >= 0.55) return '重';
  if (w >= 0.25) return '中';
  return '轻';
}
function weightColor(w) {
  if (w == null) return 'var(--ink-4)';
  if (w >= 0.8) return 'var(--accent)';
  if (w >= 0.55) return 'var(--gold)';
  if (w >= 0.25) return 'var(--ink-3)';
  return 'var(--ink-4)';
}

function PlansApp() {
  const [groups, setGroups] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [resp, br] = await Promise.all([
        fetch('/api/plans', { credentials: 'include' }),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      setGroups(await resp.json());
      if (br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id, action, content) => {
    const body = { action };
    if (content) body.content = content;
    await fetch('/api/plans/' + encodeURIComponent(id) + '/action', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), credentials: 'include',
    });
    load();
  };

  const handleEdit = (plan) => {
    const meta = plan.metadata || plan;
    const current = meta.content || meta.summary || '';
    const next = window.prompt('编辑计划内容:', current);
    if (next != null && next !== current) {
      handleAction(plan.id, 'edit', next);
    }
  };

  if (loading) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'plans' }),
    React.createElement('div', { className: 'pl-loading' }, '加载计划看板…'),
  );
  if (error) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'plans' }),
    React.createElement('div', { className: 'pl-loading' }, '加载失败: ' + error),
  );

  const sections = [
    { key: 'active', label: '进行中', emoji: '📋', color: 'var(--accent)' },
    { key: 'resolved', label: '已完成', emoji: '✅', color: '#4caf50' },
    { key: 'abandoned', label: '已放弃', emoji: '🗑️', color: 'var(--ink-4)' },
  ];

  const total = sections.reduce((s, sec) => s + ((groups && groups[sec.key]) ? groups[sec.key].length : 0), 0);

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'plans' }),
    React.createElement('div', { className: 'pl-page' },
      React.createElement('div', { className: 'pl-hd' },
        React.createElement('h1', null, '计划看板'),
        React.createElement('p', null,
          '共 ' + total + ' 条 · ' +
          sections.map(s => s.emoji + ' ' + ((groups && groups[s.key]) ? groups[s.key].length : 0)).join(' · ')
        ),
        React.createElement('button', {
          onClick: () => { setLoading(true); load(); },
          style: { marginTop: 8, fontSize: 12, padding: '4px 14px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' }
        }, '刷新'),
      ),
      sections.map(sec => {
        const items = (groups && groups[sec.key]) ? groups[sec.key] : [];
        return React.createElement('div', { key: sec.key, className: 'pl-section' },
          React.createElement('h3', null, sec.emoji + ' ' + sec.label + ' · ' + items.length),
          items.sort((a, b) => (b.weight || 0) - (a.weight || 0)).map(plan => {
            const meta = plan.metadata || plan;
            const w = meta.weight;
            const changeLog = meta.change_log || [];
            return React.createElement('div', {
              key: plan.id, className: 'pl-card',
              onClick: () => window.open('/v2/?id=' + plan.id, '_blank'),
            },
              React.createElement('div', { className: 'pl-card-title' },
                React.createElement('span', null, meta.name || plan.id),
                sec.key === 'active' && w != null && React.createElement('span', {
                  style: { fontSize: 11, padding: '2px 8px', borderRadius: 8, background: weightColor(w), color: '#fff', marginLeft: 8 }
                }, weightLabel(w) + ' ' + Math.round((w || 0) * 100) + '%'),
              ),
              (meta.summary || meta.content) && React.createElement('div', { className: 'pl-card-preview' }, (meta.summary || meta.content || '').slice(0, 200)),
              React.createElement('div', { className: 'pl-card-meta' },
                React.createElement('span', null, '权重: ' + (w != null ? Number(w).toFixed(1) : '—')),
                React.createElement('span', null, '重要度: ' + (meta.importance || 5)),
              ),
              sec.key === 'active' && w != null && React.createElement('div', {
                style: { marginTop: 6, height: 4, borderRadius: 2, background: 'var(--line)', width: '100%' }
              },
                React.createElement('div', {
                  style: { height: '100%', borderRadius: 2, background: weightColor(w), width: Math.round((w || 0) * 100) + '%', transition: 'width .3s' }
                }),
              ),
              changeLog.length > 0 && React.createElement('details', {
                style: { marginTop: 8, fontSize: 11, color: 'var(--ink-4)' },
                onClick: e => e.stopPropagation(),
              },
                React.createElement('summary', { style: { cursor: 'pointer', color: 'var(--ink-3)' } }, '变更历史 (' + changeLog.length + ')'),
                changeLog.slice().reverse().map((entry, i) => React.createElement('div', {
                  key: i,
                  style: { padding: '3px 0', borderBottom: '0.5px dashed var(--line)', fontFamily: 'var(--mono)', fontSize: 10 }
                }, (entry.ts || '') + ' ' + (entry.action || '') + (entry.content ? ': ' + entry.content.slice(0, 80) : ''))),
              ),
              React.createElement('div', { style: { marginTop: 8, display: 'flex', gap: 6 }, onClick: e => e.stopPropagation() },
                sec.key === 'active' && React.createElement('button', {
                  style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--accent)', cursor: 'pointer' },
                  onClick: () => handleAction(plan.id, 'resolve'),
                }, '✅ 完成'),
                sec.key === 'active' && React.createElement('button', {
                  style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' },
                  onClick: () => { if (confirm('确定放弃？')) handleAction(plan.id, 'abandon'); },
                }, '🗑️ 放弃'),
                (sec.key === 'resolved' || sec.key === 'abandoned') && React.createElement('button', {
                  style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' },
                  onClick: () => handleAction(plan.id, 'reopen'),
                }, '🔄 重新激活'),
                React.createElement('button', {
                  style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' },
                  onClick: () => handleEdit(plan),
                }, '✏️ 编辑'),
              ),
            );
          }),
        );
      }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(PlansApp));
