// ============================================================
// anchors-app.jsx — Ombre Brain 锚点系统
// 调用 /api/anchors 获取锚点桶列表 (上限 24)
// ============================================================

const { useState, useEffect } = React;

function AnchorsApp() {
  const [data, setData] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [resp, br] = await Promise.all([
          fetch('/api/anchors', { credentials: 'include' }),
          fetch('/api/buckets', { credentials: 'include' }),
        ]);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        setData(await resp.json());
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
      <window.SharedNav active="anchors" />
      <div className="an-loading">加载锚点…</div>
    </div>
  );
  if (error) return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="anchors" />
      <div className="an-loading">加载失败: {error}</div>
    </div>
  );

  const anchors = (data && data.anchors) ? data.anchors : [];
  const limit = (data && data.limit) ? data.limit : 24;

  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="anchors" />
      <div className="an-page">
        <div className="an-hd">
          <h1>⚓ 锚点</h1>
          <p>坐标系统 — {anchors.length} / {limit} 个锚点桶（硬上限 24）</p>
        </div>
        <div className="an-grid">
          {anchors.map(a => (
            <div key={a.id} className="an-card" onClick={() => window.open('/v2/?id=' + a.id, '_blank')}>
              <div className="an-title">{a.name || a.id}</div>
              {a.preview && <div className="an-preview">{a.preview.slice(0, 60)}</div>}
              {a.domain && a.domain.length > 0 && <div className="an-domain">{a.domain.join(' · ')}</div>}
              {a.type && <div className="an-domain" style={{ color: 'var(--ink-3)' }}>{a.type}</div>}
            </div>
          ))}
        </div>
        {anchors.length === 0 && <div className="an-loading">暂无锚点 — 在记忆详情页点击 ⚓ 将一条记忆设为锚点</div>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AnchorsApp />);
