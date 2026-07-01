var useState = React.useState;
var useEffect = React.useEffect;

function LogsApp() {
  var linesArr = useState([]); var lines = linesArr[0]; var setLines = linesArr[1];
  var errorsArr = useState([]); var errors = errorsArr[0]; var setErrors = errorsArr[1];
  var bucketsArr = useState([]); var bucketsData = bucketsArr[0]; var setBucketsData = bucketsArr[1];
  var darkArr = useState(false); var dark = darkArr[0]; var setDark = darkArr[1];
  var loadingArr = useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
  var logLevelArr = useState('WE'); var logLevel = logLevelArr[0]; var setLogLevel = logLevelArr[1];
  var logLimitArr = useState(200); var logLimit = logLimitArr[0]; var setLogLimit = logLimitArr[1];
  var errLevelArr = useState('I'); var errLevel = errLevelArr[0]; var setErrLevel = errLevelArr[1];
  var copiedArr = useState(null); var copiedIdx = copiedArr[0]; var setCopiedIdx = copiedArr[1];

  var load = async function() {
    try {
      var lr = await fetch('/api/logs?level=' + logLevel + '&limit=' + logLimit, { credentials: 'include' });
      if (lr.ok) { var d = await lr.json(); setLines(Array.isArray(d) ? d : (d && d.lines ? d.lines : [])); }
      var er = await fetch('/api/errors/recent?min_level=' + errLevel + '&limit=100', { credentials: 'include' });
      if (er.ok) { var ed = await er.json(); setErrors(Array.isArray(ed) ? ed : (ed && ed.errors ? ed.errors : [])); }
      var br = await fetch('/api/buckets', { credentials: 'include' });
      if (br.ok) { var bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(function() { load(); }, [logLevel, logLimit, errLevel]);

  var clearErrors = async function() {
    if (!confirm('确定清除所有错误记录？')) return;
    await fetch('/api/errors/clear', { method: 'POST', credentials: 'include' });
    setErrors([]);
  };

  var copyError = async function(err, idx) {
    var text = (err.formatted || '') || (err.title || '') + '\n' + (err.detail || '') + '\n' + (err.code || '');
    try { await navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(function() { setCopiedIdx(null); }, 2000); } catch (e) {}
  };

  var LEVELS = [
    { v: 'WE', label: 'WARNING + ERROR' },
    { v: 'E', label: '仅 ERROR' },
    { v: 'IWE', label: 'INFO + WARNING + ERROR' },
    { v: 'A', label: '全部行' },
  ];
  var ERR_LEVELS = [
    { v: 'I', label: 'I + W + E + F' },
    { v: 'W', label: 'W + E + F' },
    { v: 'E', label: 'E + F' },
    { v: 'F', label: '仅 F' },
  ];

  if (loading) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'logs' }),
    React.createElement('div', { className: 'lg-loading' }, '加载日志...'),
  );

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'logs' }),
    React.createElement('div', { className: 'lg-page' },
      React.createElement('div', { className: 'lg-hd' },
        React.createElement('h1', null, '日志'),
      ),

      // ── Service Logs ──
      React.createElement('h3', { style: { fontFamily: 'var(--serif)', fontSize: 16, marginBottom: 8 } }, '服务日志'),
      React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' } },
        React.createElement('label', { style: { fontSize: 12, color: 'var(--ink-3)' } }, '级别'),
        React.createElement('select', {
          value: logLevel, onChange: function(e) { setLogLevel(e.target.value); },
          style: { padding: '4px 8px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 12, background: 'var(--paper)', color: 'var(--ink)' },
        }, LEVELS.map(function(lv) { return React.createElement('option', { key: lv.v, value: lv.v }, lv.label); })),
        React.createElement('label', { style: { fontSize: 12, color: 'var(--ink-3)', marginLeft: 8 } }, '行数'),
        React.createElement('input', { type: 'number', value: logLimit, min: 20, max: 500, onChange: function(e) { setLogLimit(parseInt(e.target.value) || 200); },
          style: { width: 60, padding: '3px 6px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 12, background: 'var(--paper)', color: 'var(--ink)' },
        }),
        React.createElement('button', { className: 'lg-refresh-btn', onClick: load, style: { fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' } }, '刷新'),
      ),
      React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', margin: '4px 0 8px' } },
        '共 ' + lines.length + ' 行（末尾最多 ' + logLimit + ' 行）'
      ),
      React.createElement('pre', {
        style: { fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.6, maxHeight: '40vh', overflow: 'auto', whiteSpace: 'pre-wrap', background: 'var(--bg)', padding: 12, borderRadius: 'var(--r-sm)', border: '0.5px solid var(--line)', color: 'var(--ink)', margin: 0 },
      }, lines.slice(-logLimit).map(function(l) {
        var text = typeof l === 'string' ? l : (l.text || l.msg || l.message || JSON.stringify(l));
        var time = (typeof l === 'object' && l) ? (l.time || l.ts || '') : '';
        return (time ? time.slice(0, 19) + ' ' : '') + text;
      }).join('\n')),

      // ── Error Codes ──
      React.createElement('div', { style: { marginTop: 28 } },
        React.createElement('h3', { style: { fontFamily: 'var(--serif)', fontSize: 16, marginBottom: 4 } }, '错误日志 / Error Codes'),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', marginBottom: 8 } },
          '统一收录 W 级以上错误（OB-W*/OB-E*/OB-F*）与自动降级提示（OB-I*）。每条带时间戳 + 一键复制。'
        ),
        React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' } },
          React.createElement('label', { style: { fontSize: 12, color: 'var(--ink-3)' } }, '最低级别'),
          React.createElement('select', {
            value: errLevel, onChange: function(e) { setErrLevel(e.target.value); },
            style: { padding: '4px 8px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 12, background: 'var(--paper)', color: 'var(--ink)' },
          }, ERR_LEVELS.map(function(lv) { return React.createElement('option', { key: lv.v, value: lv.v }, lv.label); })),
          React.createElement('span', { style: { flex: 1 } }),
          React.createElement('button', { onClick: clearErrors, style: { fontSize: 11, padding: '4px 12px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: 'var(--ink-3)', cursor: 'pointer' } }, '已读'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', marginBottom: 8 } }, '共 ' + errors.length + ' 条'),
        errors.map(function(err, i) {
          var lvl = err.level || 'INFO';
          var colors = { FATAL: { bg: '#fbe9e7', c: '#c62828', b: '#ef5350' }, ERROR: { bg: 'rgba(110,79,154,0.08)', c: '#6e4f9a', b: '#6e4f9a' }, WARN: { bg: 'rgba(212,168,95,0.08)', c: '#d4a85f', b: '#d4a85f' }, INFO: { bg: 'transparent', c: '#8a8898', b: 'rgba(26,25,34,0.08)' } };
          var st = colors[lvl] || colors.INFO;
          return React.createElement('div', { key: i, style: { background: st.bg, border: '0.5px solid ' + st.b, borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 8 } },
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
              React.createElement('span', { style: { fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: st.c, color: '#fff', fontFamily: 'var(--mono)' } }, lvl),
              React.createElement('span', { style: { fontSize: 11, fontFamily: 'var(--mono)', color: st.c, fontWeight: 600 } }, err.code || ''),
              React.createElement('span', { style: { fontSize: 12, fontWeight: 500, color: 'var(--ink)' } }, err.title || ''),
              React.createElement('span', { style: { fontSize: 10, color: 'var(--ink-4)', marginLeft: 'auto' } }, (err.ts || '').slice(0, 19)),
            ),
            (err.detail || err.formatted) && React.createElement('details', { style: { marginTop: 6 } },
              React.createElement('summary', { style: { fontSize: 10, color: 'var(--ink-3)', cursor: 'pointer' } }, '详情'),
              React.createElement('pre', { style: { fontFamily: 'var(--mono)', fontSize: 10, whiteSpace: 'pre-wrap', marginTop: 4, padding: 8, background: 'var(--bg)', borderRadius: 4, maxHeight: 200, overflow: 'auto' } }, err.formatted || err.detail || ''),
            ),
            React.createElement('button', { onClick: function() { copyError(err, i); }, style: { marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '0.5px solid var(--line-2)', background: 'var(--paper)', color: copiedIdx === i ? 'var(--accent)' : 'var(--ink-4)', cursor: 'pointer' } }, copiedIdx === i ? '已复制' : '复制'),
          );
        }),
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LogsApp));
