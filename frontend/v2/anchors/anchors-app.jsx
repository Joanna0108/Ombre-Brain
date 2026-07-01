const { useState, useEffect } = React;

function AnchorsApp(opts) {
  var embedded = opts && opts.embedded;
  const [data, setData] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [resp, br] = await Promise.all([
        fetch('/api/anchors', { credentials: 'include' }),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      setData(await resp.json());
      if (br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const releaseAnchor = async (id) => {
    await fetch('/api/bucket/' + encodeURIComponent(id) + '/anchor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: false }), credentials: 'include',
    });
    load();
  };

  const anchors = (data && data.anchors) ? data.anchors : [];
  const limit = (data && data.limit) ? data.limit : 24;

  var topbar = React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark });
  var nav = React.createElement(window.SharedNav, { active: 'anchors' });
  var loadingEl = React.createElement('div', { className: 'an-loading' }, '加载锚点…');
  if (loading) return embedded ? loadingEl : React.createElement('div', null, topbar, nav, loadingEl);
  var errorEl = React.createElement('div', { className: 'an-loading' }, '加载失败: ' + error);
  if (error) return embedded ? errorEl : React.createElement('div', null, topbar, nav, errorEl);

  var content = React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'an-page' },
      React.createElement('div', { className: 'an-hd' },
        React.createElement('h1', null, '锚点'),
        React.createElement('p', null, '锚定义你是谁。默认不出现在 breath 中，只在 query/domain/emotion 匹配时才浮现。硬上限 24。'),
        React.createElement('p', { style: { fontSize: 13, marginTop: 4, color: 'var(--accent)' } },
          anchors.length + ' / ' + limit + ' 槽已用' + (anchors.length >= limit ? ' ⚠️ 已满' : '')
        ),
      ),
      React.createElement('div', { className: 'an-grid' },
        anchors.map((a, i) => {
          const num = String(i + 1).padStart(2, '0');
          return React.createElement('div', {
            key: a.id, className: 'an-card',
            onClick: () => window.open('/v2/?id=' + a.id, '_blank'),
          },
            React.createElement('div', { className: 'an-num' }, num),
            React.createElement('div', { className: 'an-title' },
              a.name || a.id,
              a.pinned && React.createElement('span', { style: { fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--accent-3)', color: 'var(--accent)', marginLeft: 6 } }, 'pinned'),
            ),
            a.preview && React.createElement('div', { className: 'an-preview' }, a.preview.slice(0, 80)),
            a.domain && a.domain.length > 0 && React.createElement('div', { className: 'an-domain' }, a.domain.join(' · ')),
            React.createElement('button', {
              className: 'an-release-btn',
              onClick: (e) => { e.stopPropagation(); releaseAnchor(a.id); },
              title: '释放锚点',
            }, '释放'),
          );
        }),
      ),
      anchors.length === 0 && React.createElement('div', { className: 'an-loading' }, '暂无锚点 — 在记忆详情页将一条记忆设为锚点'),
    ),
  );
  if (embedded) return content;
  return React.createElement('div', null, topbar, nav, content);
}

window.AnchorsApp = AnchorsApp;
var root = document.getElementById('root');
if (root && !window.__OB_SPA) ReactDOM.createRoot(root).render(React.createElement(AnchorsApp));
