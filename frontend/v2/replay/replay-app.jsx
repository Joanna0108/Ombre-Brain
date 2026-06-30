const { useState, useEffect, useRef, useCallback } = React;

function ReplayApp() {
  const [start, setStart] = useState(() => (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); })());
  const [end, setEnd] = useState(() => new Date().toISOString().slice(0, 7));
  const [result, setResult] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [speed, setSpeed] = useState(3);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/buckets', { credentials: 'include' }).then(r => r.json()).then(d => {
      setBucketsData(Array.isArray(d) ? d : []);
    }).catch(() => {});
  }, []);

  const fetchReplay = async () => {
    setLoading(true); setError(null); setResult(null); setPlaying(false); setSceneIdx(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      const s = start + '-01'; const e = end + '-01';
      const resp = await fetch('/api/replay?start=' + s + '&end=' + e, { credentials: 'include' });
      if (!resp.ok) { const t = await resp.text(); throw new Error(t); }
      setResult(await resp.json());
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  // Playback
  const scenes = (result && result.scenes) ? result.scenes : [];
  const stopPlay = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setPlaying(false);
  }, []);

  const advanceScene = useCallback(() => {
    setSceneIdx(prev => {
      const next = prev + 1;
      if (next >= scenes.length) { stopPlay(); return prev; }
      // Scroll scene into view
      setTimeout(() => {
        const el = document.getElementById('rp-scene-' + next);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return next;
    });
  }, [scenes, stopPlay]);

  const startPlay = useCallback(() => {
    setPlaying(true);
    const interval = speed === 3 ? 1000 : speed === 2 ? 2000 : 3000;
    const tick = () => {
      timerRef.current = setTimeout(() => {
        setSceneIdx(prev => {
          const next = prev + 1;
          if (next >= scenes.length) { stopPlay(); return prev; }
          const el = document.getElementById('rp-scene-' + next);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          tick();
          return next;
        });
      }, interval);
    };
    tick();
  }, [scenes, speed, stopPlay]);

  const togglePlay = () => {
    if (playing) { stopPlay(); }
    else { startPlay(); }
  };

  const changeSpeed = (v) => {
    setSpeed(v);
    if (playing) { stopPlay(); setTimeout(() => { setPlaying(true); startPlay(); }, 50); }
  };

  const skipScene = (dir) => {
    stopPlay();
    setSceneIdx(prev => {
      const next = prev + dir;
      if (next < 0 || next >= scenes.length) return prev;
      setTimeout(() => {
        const el = document.getElementById('rp-scene-' + next);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return next;
    });
  };

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'replay' }),
    React.createElement('div', { className: 'rp-page' },
      React.createElement('div', { className: 'rp-hd' },
        React.createElement('h1', null, '🎬 人生电影'),
        React.createElement('p', null, 'Life Replay — LLM 生成电影式旁白纪录片'),
      ),
      React.createElement('div', { className: 'rp-controls' },
        React.createElement('input', { type: 'month', value: start, onChange: e => setStart(e.target.value) }),
        React.createElement('span', { style: { color: 'var(--ink-3)', fontSize: 13 } }, '至'),
        React.createElement('input', { type: 'month', value: end, onChange: e => setEnd(e.target.value) }),
        React.createElement('button', { onClick: fetchReplay, disabled: loading }, loading ? '生成中…' : '生成纪录片'),
      ),

      loading && React.createElement('div', { className: 'rp-loading' }, '🎥 正在生成你的 Life Replay…'),
      error && React.createElement('div', { className: 'rp-error' }, '生成失败: ' + error),

      result && React.createElement('div', null,
        // Cover
        React.createElement('div', {
          style: {
            textAlign: 'center', padding: '40px 20px', marginBottom: 24,
            background: 'var(--paper)', border: '0.5px solid var(--line)', borderRadius: 'var(--r-lg)',
          },
        },
          React.createElement('div', { style: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-4)', letterSpacing: '0.1em', marginBottom: 8 } }, 'LIFE REPLAY'),
          result.title && React.createElement('div', { style: { fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 } }, result.title),
          result.subtitle && React.createElement('div', { style: { fontSize: 14, color: 'var(--ink-3)', marginBottom: 12 } }, result.subtitle),
          React.createElement('div', { style: { fontSize: 12, color: 'var(--ink-4)', fontFamily: 'var(--mono)' } },
            (result.start || '') + ' → ' + (result.end || '') + ' · ' + (result.memory_count || 0) + ' 条记忆'
          ),
        ),

        // Playback bar
        scenes.length > 0 && React.createElement('div', {
          style: {
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '10px 20px', marginBottom: 20,
            background: 'var(--paper)', border: '0.5px solid var(--line)', borderRadius: 999,
            position: 'sticky', top: 100, zIndex: 40,
          },
        },
          React.createElement('button', {
            onClick: () => skipScene(-1), disabled: sceneIdx <= 0,
            style: { fontSize: 18, padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: sceneIdx <= 0 ? 0.3 : 1, color: 'var(--ink)' },
          }, '⏮'),
          React.createElement('button', {
            onClick: togglePlay,
            style: { fontSize: 20, padding: '4px 12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent)' },
          }, playing ? '⏸' : '▶'),
          React.createElement('button', {
            onClick: () => skipScene(1), disabled: sceneIdx >= scenes.length - 1,
            style: { fontSize: 18, padding: '4px 10px', border: 'none', background: 'transparent', cursor: 'pointer', opacity: sceneIdx >= scenes.length - 1 ? 0.3 : 1, color: 'var(--ink)' },
          }, '⏭'),
          React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-3)', margin: '0 8px' } }, (sceneIdx + 1) + ' / ' + scenes.length),
          [1, 2, 3].map(v => React.createElement('button', {
            key: v, onClick: () => changeSpeed(v),
            style: { fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: speed === v ? 'var(--accent)' : 'var(--paper)', color: speed === v ? '#fff' : 'var(--ink-3)', cursor: 'pointer' },
          }, v + 'x')),
        ),

        // Scene cards
        scenes.map((s, i) => React.createElement('div', {
          key: i, id: 'rp-scene-' + i, className: 'rp-scene',
          style: {
            background: i === sceneIdx ? 'var(--accent-3)' : 'var(--paper)',
            border: '0.5px solid ' + (i === sceneIdx ? 'var(--accent)' : 'var(--line)'),
            borderRadius: 'var(--r-md)', padding: '24px 28px', marginBottom: 16,
            transition: 'all .3s',
          },
        },
          s.month && React.createElement('div', { style: { fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-4)', marginBottom: 4 } }, s.month),
          s.title && React.createElement('div', { style: { fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 } }, s.title),
          React.createElement('div', { style: { fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.9, color: 'var(--ink)' } }, s.narration || s.text || ''),
        )),

        scenes.length > 0 && React.createElement('div', {
          style: { textAlign: 'center', padding: 20, fontFamily: 'var(--serif)', fontSize: 18, color: 'var(--ink-4)' },
        }, '--- FIN ---'),
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ReplayApp));
