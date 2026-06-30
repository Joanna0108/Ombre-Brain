const { useState, useEffect } = React;

function LettersApp(opts) {
  var embedded = opts && opts.embedded;
  const [letters, setLetters] = useState([]);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ author: 'claude', user_name: '', title: '', date: '', content: '' });
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const [lr, br] = await Promise.all([
        fetch('/api/letters' + (filter ? '?author=' + filter : ''), { credentials: 'include' }),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      if (!lr.ok) throw new Error('HTTP ' + lr.status);
      const d = await lr.json();
      setLetters(Array.isArray(d) ? d : []);
      if (br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const sendLetter = async () => {
    if (!form.content.trim()) { setMsg('内容不能为空'); return; }
    setSending(true); setMsg('');
    try {
      const r = await fetch('/api/letter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form), credentials: 'include',
      });
      if (!r.ok) throw new Error(await r.text());
      setForm({ author: 'claude', user_name: '', title: '', date: '', content: '' });
      setShowCompose(false);
      setMsg('寄出成功');
      load();
    } catch (e) { setMsg('发送失败: ' + e.message); } finally { setSending(false); }
  };

  const editLetter = async (id) => {
    const lt = letters.find(l => l.id === id);
    if (!lt) return;
    const meta = lt.metadata || lt;
    const title = window.prompt('标题 (留空不变):', meta.title || '');
    if (title === null) return;
    const date = window.prompt('日期 (留空不变):', meta.letter_date || '');
    if (date === null) return;
    const content = window.prompt('内容 (留空不变):', lt.content || '');
    if (content === null) return;
    const body = {};
    if (title) body.title = title;
    if (date) body.date = date;
    if (content) body.content = content;
    await fetch('/api/letter/' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), credentials: 'include',
    });
    load();
  };

  const deleteLetter = async (id) => {
    if (!confirm('确定删除这封信？')) return;
    if (!confirm('再次确认：永久删除，不可恢复')) return;
    await fetch('/api/letter/' + encodeURIComponent(id) + '?confirm=true', {
      method: 'DELETE', credentials: 'include',
    });
    load();
  };

  var topbar = React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark });
  var nav = React.createElement(window.SharedNav, { active: 'letters' });
  var loadingEl = React.createElement('div', { className: 'lt-loading' }, '打开信箱…');
  if (loading) return embedded ? loadingEl : React.createElement('div', null, topbar, nav, loadingEl);

  var content = React.createElement(React.Fragment, null,
    React.createElement('div', { className: 'lt-page' },
      React.createElement('div', { className: 'lt-hd' },
        React.createElement('h1', null, '💌 两封信'),
        React.createElement('p', null, 'AI 写给未来和过去的信'),
      ),

      // Compose toggle
      React.createElement('div', { style: { textAlign: 'center', marginBottom: 16 } },
        React.createElement('button', {
          onClick: () => setShowCompose(!showCompose),
          style: { fontSize: 13, padding: '8px 20px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: showCompose ? 'var(--accent)' : 'var(--paper)', color: showCompose ? '#fff' : 'var(--accent)', cursor: 'pointer' },
        }, showCompose ? '收起创作' : '✉️ 写一封信'),
      ),

      // Compose form
      showCompose && React.createElement('div', {
        style: { background: 'var(--paper)', border: '0.5px solid var(--line)', borderRadius: 'var(--r-md)', padding: 20, marginBottom: 20 }
      },
        React.createElement('div', { style: { display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' } },
          React.createElement('select', {
            value: form.author,
            onChange: e => setForm({ ...form, author: e.target.value }),
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)' },
          }, React.createElement('option', { value: 'claude' }, '发信人: AI'), React.createElement('option', { value: 'user' }, '发信人: 我')),
          React.createElement('input', {
            placeholder: '收信人 (可选)', value: form.user_name,
            onChange: e => setForm({ ...form, user_name: e.target.value }),
            style: { flex: 1, minWidth: 120, padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)' },
          }),
          React.createElement('input', {
            type: 'date', value: form.date,
            onChange: e => setForm({ ...form, date: e.target.value }),
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)' },
          }),
        ),
        React.createElement('input', {
          placeholder: '标题 (可选)', value: form.title,
          onChange: e => setForm({ ...form, title: e.target.value }),
          style: { width: '100%', padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', marginBottom: 12 },
        }),
        React.createElement('textarea', {
          placeholder: '信的内容…', value: form.content,
          onChange: e => setForm({ ...form, content: e.target.value }),
          rows: 6,
          style: { width: '100%', padding: 10, border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 14, fontFamily: 'var(--serif)', background: 'var(--bg)', color: 'var(--ink)', resize: 'vertical', minHeight: 150, marginBottom: 12 },
        }),
        msg && React.createElement('div', { style: { fontSize: 12, color: msg.includes('失败') ? 'var(--rose)' : 'var(--accent)', marginBottom: 8 } }, msg),
        React.createElement('button', {
          onClick: sendLetter, disabled: sending,
          style: { fontSize: 13, padding: '8px 24px', borderRadius: 999, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer', opacity: sending ? 0.6 : 1 },
        }, sending ? '寄出中…' : '寄出'),
      ),

      // Filter
      React.createElement('div', { style: { display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 } },
        ['', 'user', 'claude'].map(f => React.createElement('button', {
          key: f, onClick: () => setFilter(f),
          style: { fontSize: 12, padding: '4px 14px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: filter === f ? 'var(--accent)' : 'var(--paper)', color: filter === f ? '#fff' : 'var(--ink-3)', cursor: 'pointer' },
        }, f === '' ? '全部' : f === 'user' ? '只有我' : '只有 AI')),
        React.createElement('span', { style: { fontSize: 12, color: 'var(--ink-4)', alignSelf: 'center', marginLeft: 8 } }, letters.length + ' 封'),
      ),

      letters.length === 0 && React.createElement('div', { className: 'lt-loading' }, '还没有信'),
      letters.map(lt => {
        const meta = lt.metadata || lt;
        return React.createElement('div', { key: lt.id, className: 'lt-letter' },
          React.createElement('div', { className: 'lt-meta' },
            React.createElement('span', null, (meta.author || 'AI') === 'user' ? '✍️ 我' : '🤖 AI'),
            meta.letter_date && React.createElement('span', null, meta.letter_date),
            meta.user_name && React.createElement('span', null, '致 ' + meta.user_name),
            meta.type === 'future' && React.createElement('span', { style: { color: 'var(--accent)' } }, '→ 未来'),
            meta.type === 'past' && React.createElement('span', { style: { color: 'var(--gold)' } }, '← 过去'),
          ),
          meta.title && React.createElement('div', { style: { fontFamily: 'var(--serif)', fontSize: 16, fontWeight: 600, marginBottom: 8 } }, meta.title),
          React.createElement('div', null, lt.content || ''),
          React.createElement('div', { style: { marginTop: 12, display: 'flex', gap: 8 } },
            React.createElement('button', {
              onClick: () => editLetter(lt.id),
              style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' },
            }, '✏️ 编辑'),
            React.createElement('button', {
              onClick: () => deleteLetter(lt.id),
              style: { fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '0.5px solid var(--rose)', background: 'var(--paper)', color: 'var(--rose)', cursor: 'pointer' },
            }, '🗑️ 删除'),
          ),
        );
      }),
    ),
  );
  if (embedded) return content;
  return React.createElement('div', null, topbar, nav, content);
}

window.LettersApp = LettersApp;
var root = document.getElementById('root');
if (root && !window.__OB_SPA) ReactDOM.createRoot(root).render(React.createElement(LettersApp));
