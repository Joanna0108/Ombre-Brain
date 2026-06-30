// ============================================================
// letters-app.jsx — Ombre Brain 两封信
// 调用 /api/letters 获取所有信件
// ============================================================

const { useState, useEffect } = React;

function LettersApp() {
  const [letters, setLetters] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [resp, br] = await Promise.all([
          fetch('/api/letters', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setLetters(Array.isArray(data) ? data : []);
        if (br.ok) {
          const bd = await br.json();
          setBucketsData(Array.isArray(bd) ? bd : []);
        }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, []);

  // Sync dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  if (loading) return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="letters" />
      <div className="lt-loading">打开信箱…</div>
    </div>
  );
  if (error) return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="letters" />
      <div className="lt-loading">加载失败: {error}</div>
    </div>
  );

  const lettersArr = letters || [];
  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="letters" />
      <div className="lt-page">
        <div className="lt-hd">
          <h1>💌 两封信</h1>
          <p>AI 写给未来和过去的信</p>
        </div>
        {lettersArr.length === 0 && <div className="lt-loading">还没有信</div>}
        {lettersArr.map(lt => {
          const meta = lt.metadata || lt;
          return (
            <div key={lt.id} className="lt-letter">
              <div className="lt-meta">
                <span>发信人: {meta.author || 'AI'}</span>
                {meta.letter_date && <span>日期: {meta.letter_date}</span>}
                {meta.user_name && <span>收信人: {meta.user_name}</span>}
                {meta.type === 'future' && <span style={{ color: 'var(--accent)' }}>→ 未来</span>}
                {meta.type === 'past' && <span style={{ color: 'var(--gold)' }}>← 过去</span>}
              </div>
              <div>{lt.content || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<LettersApp />);
