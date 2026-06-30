// ============================================================
// logs-app.jsx — Ombre Brain 日志查看器
// 调用 /api/logs 和 /api/errors/recent
// ============================================================

const { useState, useEffect } = React;

function LogsApp() {
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState([]);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [level, setLevel] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const [lr, er, br] = await Promise.all([
          fetch('/api/logs?level=all', { credentials: 'include' }),
          fetch('/api/errors/recent', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (lr.ok) setLines(await lr.json());
        if (er.ok) setErrors(await er.json());
        if (br.ok) {
          const bd = await br.json();
          setBucketsData(Array.isArray(bd) ? bd : []);
        }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  const filtered = level === 'all'
    ? lines
    : level === 'error'
      ? lines.filter(l => (l.level || '').toLowerCase() === 'error' || (l.text || l.msg || l).toLowerCase().includes('error'))
      : lines.filter(l => (l.level || '').toLowerCase() === level);

  const logsArr = Array.isArray(filtered) ? filtered : [];
  const errorsArr = Array.isArray(errors) ? errors : [];

  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="logs" />

      {loading && <div className="lg-loading">加载日志…</div>}
      {error && <div className="lg-loading">加载失败: {error}</div>}

      {!loading && !error && (
        <div className="lg-page">
          <div className="lg-hd">
            <h1>📋 日志</h1>
            <p>共 {lines.length} 条日志 · {errorsArr.length} 条错误（最近）</p>
          </div>
          <div className="lg-filter">
            {['all', 'info', 'warn', 'error'].map(lv =>
              <button key={lv} className={level === lv ? 'on' : ''} onClick={() => setLevel(lv)}>{lv === 'all' ? '全部' : lv}</button>
            )}
          </div>
          {logsArr.slice(-200).map((l, i) => {
            const text = typeof l === 'string' ? l : (l.text || l.msg || l.message || JSON.stringify(l));
            const lvl = (l.level || '').toLowerCase();
            const time = l.time || l.ts || '';
            const cls = 'lg-log-line' + (lvl === 'error' ? ' lg-error' : lvl === 'warn' ? ' lg-warn' : ' lg-info');
            return (
              <div key={i} className={cls}>
                {time && <span className="lg-time">{time.slice(0, 19)}</span>}
                <span>{text}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LogsApp />);
