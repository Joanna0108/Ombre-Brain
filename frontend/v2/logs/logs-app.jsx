// ============================================================
// logs-app.jsx — Ombre Brain 日志查看器
// 调用 /api/logs 和 /api/errors/recent
// ============================================================

const { useState, useEffect } = React;

const NAV = `<nav class="lg-topbar">
<a href="/v2/" class="lg-brand">Ombre Brain</a>
<span class="lg-nav-group"><a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a><a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a><a href="/v2/">时间线</a></span><span class="lg-nav-divider"></span>
<span class="lg-nav-group"><a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a><a href="/v2/plans/">计划</a><a href="/v2/letters/">信</a><a href="/v2/anchors/">锚点</a></span><span class="lg-nav-divider"></span>
<span class="lg-nav-group"><a href="/v2/console/import/">导入</a><a href="/v2/logs/" class="on">日志</a><a href="/v2/console/config/">设置</a><a href="/v2/about/">关于</a></span>
</nav>`;

function LogsApp() {
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [lr, er] = await Promise.all([
          fetch('/api/logs?level=all', { credentials: 'include' }),
          fetch('/api/errors/recent', { credentials: 'include' }),
        ]);
        if (lr.ok) setLines(await lr.json());
        if (er.ok) setErrors(await er.json());
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  const filtered = level === 'all'
    ? lines
    : level === 'error'
      ? lines.filter(l => (l.level || '').toLowerCase() === 'error' || (l.text || l.msg || l).toLowerCase().includes('error'))
      : lines.filter(l => (l.level || '').toLowerCase() === level);

  if (loading) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'lg-loading' }, '加载日志…'));
  if (error) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'lg-loading' }, '加载失败: ' + error));

  const logsArr = Array.isArray(filtered) ? filtered : [];
  const errorsArr = Array.isArray(errors) ? errors : [];

  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'lg-page' },
      React.createElement('div', { className: 'lg-hd' },
        React.createElement('h1', null, '📋 日志'),
        React.createElement('p', null, `共 ${lines.length} 条日志 · ${errorsArr.length} 条错误（最近）`),
      ),
      React.createElement('div', { className: 'lg-filter' },
        ['all', 'info', 'warn', 'error'].map(lv =>
          React.createElement('button', { key: lv, className: level === lv ? 'on' : '', onClick: () => setLevel(lv) }, lv === 'all' ? '全部' : lv)
        ),
      ),
      logsArr.slice(-200).map((l, i) => {
        const text = typeof l === 'string' ? l : (l.text || l.msg || l.message || JSON.stringify(l));
        const lvl = (l.level || '').toLowerCase();
        const time = l.time || l.ts || '';
        const cls = 'lg-log-line' + (lvl === 'error' ? ' lg-error' : lvl === 'warn' ? ' lg-warn' : ' lg-info');
        return React.createElement('div', { key: i, className: cls },
          time && React.createElement('span', { className: 'lg-time' }, time.slice(0, 19)),
          React.createElement('span', null, text),
        );
      }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LogsApp));
