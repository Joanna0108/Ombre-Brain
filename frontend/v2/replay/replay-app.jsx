// ============================================================
// replay-app.jsx — Ombre Brain 人生电影
// 调用 /api/replay?start=...&end=... 获取 LLM 生成的电影式旁白
// ============================================================

const { useState, useEffect } = React;

function ReplayApp() {
  const [start, setStart] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  // Fetch buckets for nav
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/buckets', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setBucketsData(Array.isArray(data) ? data : []);
        }
      } catch (e) { /* silent */ }
    })();
  }, []);

  // Sync dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

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

  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="replay" />

      <div className="rp-page">
        <div className="rp-hd">
          <h1>🎬 人生电影</h1>
          <p>Life Replay — LLM 生成电影式旁白纪录片</p>
        </div>

        <div className="rp-controls">
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
          <span style={{color:'var(--ink-3)',fontSize:13}}>至</span>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          <button onClick={fetchReplay} disabled={loading}>{loading ? '生成中…' : '生成纪录片'}</button>
        </div>

        {loading && <div className="rp-loading">🎥 正在生成你的 Life Replay…</div>}
        {error && <div className="rp-error">生成失败: {error}</div>}
        {result && result.narration && (
          <div className="rp-result" dangerouslySetInnerHTML={{__html: result.narration.replace(/\n/g, '<br/>')}} />
        )}
        {result && result.scenes && (
          <div className="rp-result">
            {result.scenes.map((s, i) => (
              <div key={i} className="scene">
                {s.time && <div className="scene-time">{s.time}</div>}
                <div>{s.text || s.narration || ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ReplayApp />);
