// ============================================================
// replay-app.jsx — Ombre Brain 人生电影
// 调用 /api/replay?start=...&end=... 获取 LLM 生成的电影式旁白
// ============================================================

const { useState, useEffect } = React;

function Nav() {
  return React.createElement('nav', { className: 'rp-topbar' },
    React.createElement('a', { href: '/v2/', className: 'rp-brand' }, 'Ombre Brain'),
    React.createElement('span', { className: 'rp-nav-group' },
      React.createElement('a', { href: '/v2/cells/' }, 'Cells'),
      React.createElement('a', { href: '/v2/console/breath/' }, 'Breath'),
      React.createElement('a', { href: '/v2/network/' }, '记忆网络'),
      React.createElement('a', { href: '/v2/calendar/' }, '日历'),
      React.createElement('a', { href: '/v2/' }, '时间线'),
    ),
    React.createElement('span', { className: 'rp-nav-divider' }),
    React.createElement('span', { className: 'rp-nav-group' },
      React.createElement('a', { href: '/v2/mood/' }, '情绪'),
      React.createElement('a', { href: '/v2/replay/', className: 'on' }, 'Replay'),
      React.createElement('a', { href: '/v2/plans/' }, '计划'),
      React.createElement('a', { href: '/v2/letters/' }, '信'),
      React.createElement('a', { href: '/v2/anchors/' }, '锚点'),
    ),
    React.createElement('span', { className: 'rp-nav-divider' }),
    React.createElement('span', { className: 'rp-nav-group' },
      React.createElement('a', { href: '/v2/console/import/' }, '导入'),
      React.createElement('a', { href: '/v2/logs/' }, '日志'),
      React.createElement('a', { href: '/v2/settings/' }, '设置'),
      React.createElement('a', { href: '/v2/about/' }, '关于'),
    ),
  );
}

function ReplayApp() {
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReplay = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const resp = await fetch(`/api/replay?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { credentials: 'include' });
      if (!resp.ok) { const t = await resp.text(); throw new Error(t); }
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // JSX via React.createElement
  return React.createElement('div', null,
    React.createElement(Nav),
    React.createElement('div', { className: 'rp-page' },
      React.createElement('div', { className: 'rp-hd' },
        React.createElement('h1', null, '🎬 人生电影'),
        React.createElement('p', null, 'Life Replay — LLM 生成电影式旁白纪录片'),
      ),
      React.createElement('div', { className: 'rp-controls' },
        React.createElement('input', { type: 'date', value: start, onChange: e => setStart(e.target.value) }),
        React.createElement('span', { style: { color: 'var(--ink-dim)', fontSize: 13 } }, '至'),
        React.createElement('input', { type: 'date', value: end, onChange: e => setEnd(e.target.value) }),
        React.createElement('button', { onClick: fetchReplay, disabled: loading }, loading ? '生成中…' : '生成纪录片'),
      ),
      loading && React.createElement('div', { className: 'rp-loading' }, '🎥 正在生成你的 Life Replay…'),
      error && React.createElement('div', { className: 'rp-error' }, '生成失败: ' + error),
      result && result.narration && React.createElement('div', { className: 'rp-result', dangerouslySetInnerHTML: { __html: result.narration.replace(/\n/g, '<br/>') } }),
      result && result.scenes && React.createElement('div', { className: 'rp-result' },
        result.scenes.map((s, i) =>
          React.createElement('div', { key: i, className: 'scene' },
            s.time && React.createElement('div', { className: 'scene-time' }, s.time),
            React.createElement('div', null, s.text || s.narration || ''),
          )
        )
      ),
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ReplayApp));
