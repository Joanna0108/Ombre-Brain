// ============================================================
// about-app.jsx — Ombre Brain 关于页
// 调用 /api/author 和 /api/status 获取版本和系统信息
// ============================================================

const { useState, useEffect } = React;

function AboutApp() {
  const [author, setAuthor] = useState(null);
  const [status, setStatus] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
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
        if (br.ok) {
          const bd = await br.json();
          setBucketsData(Array.isArray(bd) ? bd : []);
        }
      } catch (e) { /* ignore */ } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  const authorName = (author && author.name) ? author.name : 'Joanna';
  const version = (status && status.version) ? status.version : 'v2.x';
  const note = (author && author.note) ? author.note : 'Memory is not storage. Memory is life.';

  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="about" />

      {loading && <div className="ab-loading">…</div>}

      {!loading && (
        <div className="ab-page">
          <h1>Ombre Brain</h1>
          <div className="ab-version">{version}</div>
          <div className="ab-note">"{note}"</div>
          <div className="ab-meta">
            <div>Built by {authorName}</div>
            <div style={{ marginTop: '8px' }}>Memory Engine + Dashboard</div>
            {status && <div style={{ marginTop: '8px' }}>
              Buckets: {status.buckets || status.permanent_count + status.dynamic_count || '…'}
              {' · '}Decay: {status.decay_engine || '…'}
            </div>}
            <div style={{ marginTop: '16px', color: 'var(--accent)' }}>
              <a href="https://github.com/Joanna0108/Ombre-Brain" style={{ color: 'var(--accent)', fontSize: '11px' }}>
                github.com/Joanna0108/Ombre-Brain
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AboutApp />);
