const { useState, useEffect, useRef } = React;

const LEVEL_STYLES = {
  FATAL: { bg: '#fbe9e7', color: '#c62828', border: '#ef5350' },
  ERROR: { bg: 'rgba(110,79,154,0.08)', color: 'var(--accent)', border: 'var(--accent)' },
  WARN: { bg: 'rgba(212,168,95,0.08)', color: 'var(--gold)', border: 'var(--gold)' },
  INFO: { bg: 'transparent', color: 'var(--ink-4)', border: 'var(--line)' },
};

function LogsApp() {
  const [lines, setLines] = useState([]);
  const [errors, setErrors] = useState([]);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logLevel, setLogLevel] = useState('all');
  const [logLimit, setLogLimit] = useState(200);
  const [errLevel, setErrLevel] = useState('W');
  const [copiedIdx, setCopiedIdx] = useState(null);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const [lr, er, br] = await Promise.all([
        fetch('/api/logs?level=' + logLevel.toUpperCase() + '&limit=' + logLimit, { credentials: 'include' }),
        fetch('/api/errors/recent?min_level=' + errLevel + '&limit=100', { credentials: 'include' }),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      if (lr.ok) setLines(await lr.json());
      if (er.ok) setErrors(await er.json());
      if (br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [logLevel, logLimit, errLevel]);

  // Background critical error poll (every 60s)
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch('/api/errors/recent?min_level=E&limit=20', { credentials: 'include' });
        if (r.ok) {
          const d = await r.json();
          const arr = Array.isArray(d) ? d : [];
          if (arr.length > 0) {
            const latestTs = localStorage.getItem('ob-last-error-ts') || '';
            const newErrors = arr.filter(e => (e.ts || '') > latestTs);
            if (newErrors.length > 0) {
              localStorage.setItem('ob-last-error-ts', arr[0].ts || '');
              if (window.confirm('⚠️ 检测到 ' + newErrors.length + ' 条新错误，前往日志查看？')) {
                setErrLevel('E'); setLogLevel('all');
              }
            }
          }
        }
      } catch (e) {}
    }, 60000);
    return () => clearInterval(pollRef.current);
  }, []);

  const clearErrors = async () => {
    if (!confirm('确定清除所有错误记录？')) return;
    await fetch('/api/errors/clear', { method: 'POST', credentials: 'include' });
    setErrors([]);
  };

  const copyError = async (err, idx) => {
    const text = (err.formatted || err.title + '\n' + (err.detail || '') + '\n' + (err.code || ''));
    try { await navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); } catch (e) {}
  };

  const filteredLines = logLevel === 'all' ? lines : lines.filter(l => {
    const t = typeof l === 'string' ? l : (l.text || l.msg || '');
    return t.toUpperCase().includes(logLevel.toUpperCase());
  });

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'logs' }),
    React.createElement('div', { className: 'lg-page' },
      React.createElement('div', { className: 'lg-hd' },
        React.createElement('h1', null, '📋 日志'),
      ),

      // ── Service Logs ──
      React.createElement('div', { style: { marginBottom: 28 } },
        React.createElement('h3', { style: { fontFamily: 'var(--serif)', fontSize: 16, marginBottom: 8 } }, '服务日志'),
        React.createElement('div', { className: 'lg-filter' },
          ['all','INFO','WARN','ERROR'].map(lv => React.createElement('button', {
            key: lv, className: logLevel === lv ? 'on' : '',
            onClick: () => setLogLevel(lv),
          }, lv === 'all' ? '全部' : lv)),
          React.createElement('input', {
            type: 'number', value: logLimit, min: 20, max: 2000,
            onChange: e => setLogLimit(parseInt(e.target.value) || 200),
            style: { width: 60, padding: '3px 6px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 12, background: 'var(--paper)', color: 'var(--ink)', marginLeft: 8 },
          }),
          React.createElement('span', { style: { fontSize: 11, color: 'var(--ink-4)', marginLeft: 4 } }, '行'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', margin: '4px 0 8px' } },
          '共 ' + (Array.isArray(lines) ? lines.length : 0) + ' 行'
        ),
        React.createElement('pre', {
          style: {
            fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.6,
            maxHeight: '40vh', overflow: 'auto', whiteSpace: 'pre-wrap',
            background: 'var(--bg)', padding: 12, borderRadius: 'var(--r-sm)',
            border: '0.5px solid var(--line)', color: 'var(--ink)',
          },
        }, filteredLines.slice(-logLimit).map((l, i) => {
          const text = typeof l === 'string' ? l : (l.text || l.msg || l.message || JSON.stringify(l));
          const time = typeof l === 'object' ? (l.time || l.ts || '') : '';
          return (time ? time.slice(0, 19) + ' ' : '') + text + '\n';
        }).join('')),
      ),

      // ── Error Codes ──
      React.createElement('div', null,
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } },
          React.createElement('h3', { style: { fontFamily: 'var(--serif)', fontSize: 16, margin: 0 } }, '错误码'),
          ['I','W','E','F'].map(lv => React.createElement('button', {
            key: lv, className: errLevel === lv ? 'on' : '',
            onClick: () => setErrLevel(lv),
            style: { fontSize: 11, padding: '3px 8px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: errLevel === lv ? 'var(--accent)' : 'var(--paper)', color: errLevel === lv ? '#fff' : 'var(--ink-3)', cursor: 'pointer' },
          }, lv + '+')),
          React.createElement('span', { style: { flex: 1 } }),
          React.createElement('button', {
            onClick: clearErrors,
            style: { fontSize: 11, padding: '4px 12px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' },
          }, '已读 (清除)'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', marginBottom: 8 } },
          '共 ' + errors.length + ' 条'
        ),
        errors.map((err, i) => {
          const st = LEVEL_STYLES[err.level] || LEVEL_STYLES.INFO;
          return React.createElement('div', {
            key: i,
            style: {
              background: st.bg, border: '0.5px solid ' + st.border,
              borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 8,
            },
          },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
              React.createElement('span', {
                style: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: st.color, color: '#fff', fontFamily: 'var(--mono)' },
              }, err.level || '?'),
              React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--mono)', color: st.color, fontWeight: 600 } }, err.code || ''),
              React.createElement('span', { style: { fontSize: 12, fontWeight: 500, color: 'var(--ink)' } }, err.title || ''),
              React.createElement('span', { style: { fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' } }, (err.ts || '').slice(0, 19)),
            ),
            (err.detail || err.formatted) && React.createElement('details', { style: { marginTop: 6 } },
              React.createElement('summary', { style: { fontSize: 10, color: 'var(--ink-3)', cursor: 'pointer' } }, '详情'),
              React.createElement('pre', {
                style: { fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'pre-wrap', marginTop: 4, padding: 8, background: 'var(--bg)', borderRadius: 4, maxHeight: 200, overflow: 'auto' },
              }, err.formatted || err.detail || ''),
            ),
            React.createElement('button', {
              onClick: () => copyError(err, i),
              style: { marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: copiedIdx === i ? 'var(--accent)' : 'var(--ink-4)', cursor: 'pointer' },
            }, copiedIdx === i ? '已复制' : '复制'),
          );
        }),
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LogsApp));
