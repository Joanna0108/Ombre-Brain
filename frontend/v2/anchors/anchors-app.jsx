// ============================================================
// anchors-app.jsx — Ombre Brain 锚点系统
// 调用 /api/anchors 获取锚点桶列表 (上限 24)
// ============================================================

const { useState, useEffect } = React;

const NAV = `<nav class="an-topbar">
<a href="/v2/" class="an-brand">Ombre Brain</a>
<span class="an-nav-group"><a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a><a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a><a href="/v2/">时间线</a></span><span class="an-nav-divider"></span>
<span class="an-nav-group"><a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a><a href="/v2/plans/">计划</a><a href="/v2/letters/">信</a><a href="/v2/anchors/" class="on">锚点</a></span><span class="an-nav-divider"></span>
<span class="an-nav-group"><a href="/v2/console/import/">导入</a><a href="/v2/logs/">日志</a><a href="/v2/console/config/">设置</a><a href="/v2/about/">关于</a></span>
</nav>`;

function AnchorsApp() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/anchors', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        setData(await resp.json());
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'an-loading' }, '加载锚点…'));
  if (error) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'an-loading' }, '加载失败: ' + error));

  const anchors = (data && data.anchors) ? data.anchors : [];
  const limit = (data && data.limit) ? data.limit : 24;

  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'an-page' },
      React.createElement('div', { className: 'an-hd' },
        React.createElement('h1', null, '⚓ 锚点'),
        React.createElement('p', null, `坐标系统 — ${anchors.length} / ${limit} 个锚点桶（硬上限 24）`),
      ),
      React.createElement('div', { className: 'an-grid' },
        anchors.map(a => React.createElement('div', {
          key: a.id, className: 'an-card',
          onClick: () => window.open('/v2/?id=' + a.id, '_blank'),
        },
          React.createElement('div', { className: 'an-title' }, a.name || a.id),
          a.preview && React.createElement('div', { className: 'an-preview' }, a.preview.slice(0, 60)),
          a.domain && a.domain.length > 0 && React.createElement('div', { className: 'an-domain' }, a.domain.join(' · ')),
          a.type && React.createElement('div', { className: 'an-domain', style: { color: 'var(--ink-dim)' } }, a.type),
        )),
      ),
      anchors.length === 0 && React.createElement('div', { className: 'an-loading' }, '暂无锚点 — 在记忆详情页点击 ⚓ 将一条记忆设为锚点'),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AnchorsApp));
