// ============================================================
// plans-app.jsx — Ombre Brain 计划看板
// 调用 /api/plans 获取按状态分组的计划列表
// ============================================================

const { useState, useEffect } = React;

function PlansApp() {
  const [groups, setGroups] = useState(null);  // { active:[], resolved:[], abandoned:[] }
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [resp, br] = await Promise.all([
          fetch('/api/plans', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setGroups(data);
        if (br.ok) {
          const bd = await br.json();
          setBucketsData(Array.isArray(bd) ? bd : []);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sync dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

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

  if (loading) return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="plans" />
      <div className="pl-loading">加载计划看板…</div>
    </div>
  );
  if (error) return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="plans" />
      <div className="pl-loading">加载失败: {error}</div>
    </div>
  );

  const sections = [
    { key: 'active', label: '进行中', emoji: '📋' },
    { key: 'resolved', label: '已完成', emoji: '✅' },
    { key: 'abandoned', label: '已放弃', emoji: '🗑️' },
  ];

  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="plans" />
      <div className="pl-page">
        <div className="pl-hd">
          <h1>计划看板</h1>
          <p>Plan Kanban — 跟踪 AI 生成的执行计划</p>
        </div>
        {sections.map(sec => {
          const items = (groups && groups[sec.key]) ? groups[sec.key] : [];
          return (
            <div key={sec.key} className="pl-section">
              <h3>{sec.emoji} {sec.label} · {items.length}</h3>
              {items.sort((a,b) => (b.weight||0) - (a.weight||0)).map(plan => {
                const meta = plan.metadata || plan;
                return (
                  <div key={plan.id} className="pl-card" onClick={() => window.open('/v2/?id=' + plan.id, '_blank')}>
                    <div className="pl-card-title">
                      <span>{meta.name || plan.id}</span>
                      {sec.key === 'active' && <span className="pl-status">{meta.status || 'active'}</span>}
                      {sec.key === 'resolved' && <span className="pl-status resolved">resolved</span>}
                      {sec.key === 'abandoned' && <span className="pl-status abandoned">abandoned</span>}
                    </div>
                    {meta.summary && <div className="pl-card-preview">{meta.summary.slice(0, 150)}</div>}
                    <div className="pl-card-meta">
                      <span>权重: {meta.weight != null ? Number(meta.weight).toFixed(1) : '—'}</span>
                      <span>重要度: {meta.importance || 5}</span>
                      {meta.domain && meta.domain.length > 0 && <span>域: {meta.domain.join(', ')}</span>}
                    </div>
                    {sec.key === 'active' && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-3)', cursor: 'pointer' }} onClick={() => handleAction(plan.id, 'resolve')}>✅ 完成</button>
                        <button style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink-3)', cursor: 'pointer' }} onClick={() => handleAction(plan.id, 'abandon')}>🗑️ 放弃</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlansApp />);
