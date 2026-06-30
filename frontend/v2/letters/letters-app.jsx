// ============================================================
// letters-app.jsx — Ombre Brain 两封信
// 调用 /api/letters 获取所有信件
// ============================================================

const { useState, useEffect } = React;

const NAV = `<nav class="lt-topbar">
<a href="/v2/" class="lt-brand">Ombre Brain</a>
<span class="lt-nav-group"><a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a><a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a><a href="/v2/">时间线</a></span><span class="lt-nav-divider"></span>
<span class="lt-nav-group"><a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a><a href="/v2/plans/">计划</a><a href="/v2/letters/" class="on">信</a><a href="/v2/anchors/">锚点</a></span><span class="lt-nav-divider"></span>
<span class="lt-nav-group"><a href="/v2/console/import/">导入</a><a href="/v2/logs/">日志</a><a href="/v2/console/config/">设置</a><a href="/v2/about/">关于</a></span>
</nav>`;

function LettersApp() {
  const [letters, setLetters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/letters', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setLetters(Array.isArray(data) ? data : []);
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'lt-loading' }, '打开信箱…'));
  if (error) return React.createElement('div', null, React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }), React.createElement('div', { className: 'lt-loading' }, '加载失败: ' + error));

  const lettersArr = letters || [];
  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'lt-page' },
      React.createElement('div', { className: 'lt-hd' },
        React.createElement('h1', null, '💌 两封信'),
        React.createElement('p', null, 'AI 写给未来和过去的信'),
      ),
      lettersArr.length === 0 && React.createElement('div', { className: 'lt-loading' }, '还没有信'),
      lettersArr.map(lt => {
        const meta = lt.metadata || lt;
        return React.createElement('div', { key: lt.id, className: 'lt-letter' },
          React.createElement('div', { className: 'lt-meta' },
            React.createElement('span', null, '发信人: ' + (meta.author || 'AI')),
            meta.letter_date && React.createElement('span', null, '日期: ' + meta.letter_date),
            meta.user_name && React.createElement('span', null, '收信人: ' + meta.user_name),
            meta.type === 'future' && React.createElement('span', { style: { color: 'var(--accent)' } }, '→ 未来'),
            meta.type === 'past' && React.createElement('span', { style: { color: 'var(--gold)' } }, '← 过去'),
          ),
          React.createElement('div', null, lt.content || ''),
        );
      }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LettersApp));
