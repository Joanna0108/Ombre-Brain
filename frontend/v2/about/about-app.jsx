const { useState, useEffect } = React;

function AboutApp() {
  const [author, setAuthor] = useState(null);
  const [status, setStatus] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ar, sr, br] = await Promise.all([
          fetch('/api/author').then(r => r.json()),
          fetch('/api/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        setAuthor(ar);
        setStatus(sr);
        if (br && br.ok) {
          const bd = await br.json();
          setBucketsData(Array.isArray(bd) ? bd : []);
        }
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { document.documentElement.setAttribute('data-theme', dark ? 'dark' : ''); }, [dark]);

  const authorName = (author && author.name) ? author.name : 'Joanna';
  const version = (status && status.version) ? status.version : 'v2.x';
  const note = (author && author.note) ? author.note : 'Memory is not storage. Memory is life.';

  if (loading) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'about' }),
    React.createElement('div', { className: 'ab-loading' }, '…'),
  );

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'about' }),
    React.createElement('div', { className: 'ab-page' },
      React.createElement('h1', null, 'Ombre Brain'),
      React.createElement('div', { className: 'ab-version' }, version),
      React.createElement('div', { className: 'ab-note' }, '"' + note + '"'),
      React.createElement('div', { className: 'ab-meta' },
        React.createElement('div', null, 'Built by ' + authorName),
        React.createElement('div', { style: { marginTop: '8px' } }, 'Memory Engine + Dashboard'),
        status && React.createElement('div', { style: { marginTop: '8px' } },
          'Buckets: ' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…') + ' · Decay: ' + (status.decay_engine || '…')),
        React.createElement('div', { style: { marginTop: '16px', color: 'var(--accent)' } },
          React.createElement('a', { href: 'https://github.com/Joanna0108/Ombre-Brain', style: { color: 'var(--accent)', fontSize: '11px' } }, 'github.com/Joanna0108/Ombre-Brain'),
        ),
      ),
    ),
  );
}

try {
  const root = document.getElementById('root');
  if (root) ReactDOM.createRoot(root).render(React.createElement(AboutApp));
} catch(e) { console.error(e); document.getElementById('root').innerText = 'Error: ' + e.message; }
