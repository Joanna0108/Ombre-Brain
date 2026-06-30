// ============================================================
// about-app.jsx — Ombre Brain 关于页
// 调用 /api/author 和 /api/status 获取版本和系统信息
// ============================================================

const { useState, useEffect } = React;

const NAV = `<nav class="ab-topbar">
<a href="/v2/" class="ab-brand">Ombre Brain</a>
<span class="ab-nav-group"><a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a><a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a><a href="/v2/">时间线</a></span><span class="ab-nav-divider"></span>
<span class="ab-nav-group"><a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a><a href="/v2/plans/">计划</a><a href="/v2/letters/">信</a><a href="/v2/anchors/">锚点</a></span><span class="ab-nav-divider"></span>
<span class="ab-nav-group"><a href="/v2/console/import/">导入</a><a href="/v2/logs/">日志</a><a href="/v2/settings/">设置</a><a href="/v2/about/" class="on">关于</a></span>
</nav>`;

function AboutApp() {
  const [author, setAuthor] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ar, sr] = await Promise.all([
          fetch('/api/author').then(r => r.json()),
          fetch('/api/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        ]);
        setAuthor(ar);
        setStatus(sr);
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  const authorName = (author && author.name) ? author.name : 'Joanna';
  const version = (status && status.version) ? status.version : 'v2.x';
  const note = (author && author.note) ? author.note : 'Memory is not storage. Memory is life.';

  if (loading) return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'ab-loading' }, '…'),
  );

  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'ab-page' },
      React.createElement('h1', null, 'Ombre Brain'),
      React.createElement('div', { className: 'ab-version' }, version),
      React.createElement('div', { className: 'ab-note' }, `"${note}"`),
      React.createElement('div', { className: 'ab-meta' },
        React.createElement('div', null, 'Built by ' + authorName),
        React.createElement('div', { style: { marginTop: '8px' } }, 'Memory Engine + Dashboard'),
        status && React.createElement('div', { style: { marginTop: '8px' } },
          'Buckets: ' + (status.buckets || status.permanent_count + status.dynamic_count || '…') +
          ' · Decay: ' + (status.decay_engine || '…')
        ),
        React.createElement('div', { style: { marginTop: '16px', color: 'var(--accent)' } },
          React.createElement('a', { href: 'https://github.com/Joanna0108/Ombre-Brain', style: { color: 'var(--accent)', fontSize: '11px' } },
            'github.com/Joanna0108/Ombre-Brain'),
        ),
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(AboutApp));
