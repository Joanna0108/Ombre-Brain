// ============================================================
// calendar-app.jsx — Ombre Brain 记忆日历
// 参考 mobile CalScreen 设计，桌面版：月视图+日详情侧滑面板
// ============================================================

const { useState, useEffect, useMemo } = React;

const MONTHS = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const WDAYS = ['日','一','二','三','四','五','六'];

function levelOf(n) {
  if (!n) return '';
  if (n <= 3) return 'l1';
  if (n <= 7) return 'l2';
  if (n <= 13) return 'l3';
  return 'l4';
}

// ============================================================
// Main App
// ============================================================
function CalendarApp() {
  const [buckets, setBuckets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const [mode, setMode] = useState('show'); // 'show' | 'status'
  const [selectedDay, setSelectedDay] = useState(null); // { year, month, day, items }

  // Fetch all buckets
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/buckets', { credentials: 'include' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const data = await resp.json();
        setBuckets(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Build day map from buckets
  const dayMap = useMemo(() => {
    if (!buckets) return new Map();
    const map = new Map();
    for (const b of buckets) {
      const date = b.date || '';
      if (!date || date.length < 10) continue;
      const key = date.slice(0, 10); // YYYY-MM-DD
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(b);
    }
    return map;
  }, [buckets]);

  // Build current month
  const monthData = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
    const firstDow = new Date(year, month - 1, 1).getDay();
    const lastDay = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ ph: true });
    let total = 0, hiCnt = 0, peakDay = 0;
    for (let d = 1; d <= lastDay; d++) {
      const k = `${year}-${month}-${d}`;
      const items = dayMap.get(k) || [];
      let hasHi = false;
      for (const b of items) {
        if (b.highlight) hasHi = true;
      }
      if (items.length > peakDay) peakDay = items.length;
      total += items.length;
      if (hasHi) hiCnt += 1;
      cells.push({
        d, n: items.length, hi: hasHi,
        hasContent: items.length > 0,
        today: k === todayKey,
      });
    }
    return { cells, total, hiCnt, peakDay };
  }, [dayMap, year, month]);

  const goPrev = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  };

  const handleDayClick = (d) => {
    const k = `${year}-${month}-${d}`;
    const items = dayMap.get(k) || [];
    setSelectedDay({ year, month, day: d, items });
  };

  // ============================================================
  return (
    <div>
      {/* Top Nav Bar */}
      <nav className="cal-topbar">
        <a href="/v2/" className="cal-brand">Ombre Brain</a>
        <span className="cal-nav-group">
          <a href="/v2/cells/">Cells</a>
          <a href="/v2/console/breath/">Breath</a>
          <a href="/v2/network/">记忆网络</a>
          <a href="/v2/calendar/" className="on">日历</a>
          <a href="/v2/">时间线</a>
        </span>
        <span className="cal-nav-divider"></span>
        <span className="cal-nav-group">
          <a href="/v2/mood/">情绪</a>
          <a href="/v2/replay/">Replay</a>
          <a href="/v2/plans/">计划</a>
          <a href="/v2/letters/">信</a>
          <a href="/v2/anchors/">锚点</a>
        </span>
        <span className="cal-nav-divider"></span>
        <span className="cal-nav-group">
          <a href="/v2/console/import/">导入</a>
          <a href="/v2/logs/">日志</a>
          <a href="/v2/settings/">设置</a>
          <a href="/v2/about/">关于</a>
        </span>
      </nav>

      {/* Page Header */}
      <div className="cal-page-hd">
        <h1>记忆日历</h1>
        <p>每一天，都有故事发生</p>
      </div>

      {/* Mode Tabs */}
      <div className="cal-mode-tabs">
        <button className={mode === 'show' ? 'on' : ''} onClick={() => setMode('show')}>数量热度</button>
        <button className={mode === 'status' ? 'on' : ''} onClick={() => setMode('status')}>记忆状态</button>
      </div>

      {/* Month Navigation */}
      <div className="cal-month-nav">
        <button onClick={goPrev}>← 上月</button>
        <span className="cal-month-title">{year} 年 {MONTHS[month-1]}</span>
        <button onClick={goNext}>下月 →</button>
        <button onClick={goToday} style={{marginLeft:8}}>今天</button>
      </div>

      {/* Month Stats */}
      <div style={{textAlign:'center',fontSize:'12px',color:'var(--ink-dim)',marginBottom:'16px'}}>
        {monthData.total} 条记忆 · {monthData.hiCnt} 天有高亮 · 峰值 {monthData.peakDay} 条
      </div>

      {/* Calendar Grid */}
      {loading && <div className="cal-loading">加载记忆日历…</div>}
      {error && <div className="cal-loading">加载失败: {error}</div>}
      {!loading && !error && (
        <div className="cal-grid-wrap">
          <div className="cal-weekrow">
            {WDAYS.map(w => <span key={w}>{w}</span>)}
          </div>
          <div className="cal-grid">
            {monthData.cells.map((c, i) => {
              if (c.ph) return <div key={'ph'+i} className="cal-cell ph" />;
              let cls = 'cal-cell';
              if (c.hasContent) cls += ' has-data';
              if (mode === 'show') {
                cls += ' ' + levelOf(c.n);
                if (c.today) cls += ' today';
              } else {
                if (c.hi) cls += ' hi';
                else if (c.n > 10) cls += ' read dense';
                else if (c.n > 0) cls += ' read';
                if (c.today) cls += ' today';
              }
              return (
                <div key={c.d} className={cls}
                  onClick={c.hasContent ? () => handleDayClick(c.d) : undefined}>
                  <span className="d">{c.d}</span>
                  {c.n > 0 && <span className="n">{c.n}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Detail Panel (slide from right) */}
      <aside className={'cal-day-panel' + (selectedDay ? ' open' : '')}>
        {selectedDay && (
          <>
            <button className="cal-close" onClick={() => setSelectedDay(null)}>✕</button>
            <h3>{selectedDay.year}年{MONTHS[selectedDay.month-1]}{selectedDay.day}日</h3>
            <div className="cal-day-meta">{selectedDay.items.length} 条记忆</div>
            {selectedDay.items.sort((a,b) => {
              const ta = a.time || '00:00'; const tb = b.time || '00:00';
              return ta.localeCompare(tb);
            }).map((b, i) => (
              <div key={b.id || i} className="cal-mem-item"
                onClick={() => window.open('/v2/?id=' + b.id, '_blank')}>
                <div className="cal-mem-title">
                  {b.highlight && '⭐ '}
                  {b.title || b.id}
                  {b.time && <span style={{fontSize:'10px',color:'var(--ink-dim)',marginLeft:'8px'}}>{b.time.slice(0,5)}</span>}
                </div>
                {b.summary && <div className="cal-mem-preview">{b.summary.slice(0, 100)}</div>}
                {b.tags && b.tags.length > 0 && (
                  <div className="cal-mem-tags">
                    {b.tags.slice(0, 5).map((t, ti) => <span key={ti} className="cal-mem-tag">{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </aside>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CalendarApp />);
