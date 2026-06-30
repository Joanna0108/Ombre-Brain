// Minimal test - does this render?
var useSt = React.useState;
var useEf = React.useEffect;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(true), loading = _b[0], setLoading = _b[1];
  var _c = useSt([]), bucketsData = _c[0], setBucketsData = _c[1];
  var _d = useSt(false), dark = _d[0], setDark = _d[1];

  useEf(function() {
    fetch('/api/buckets', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function(d) { setBucketsData(Array.isArray(d) ? d : []); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
    fetch('/api/status', { credentials: 'include' })
      .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function(d) { setStatus(d); })
      .catch(function() {});
  }, []);

  if (loading) {
    return React.createElement('div', null,
      React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
      React.createElement(window.SharedNav, { active: 'settings' }),
      React.createElement('div', { className: 'st-loading' }, 'Loading...'),
    );
  }

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'settings' }),
    React.createElement('div', { className: 'st-page' },
      React.createElement('div', { className: 'st-hd' },
        React.createElement('h1', null, '⚙️ 设置 · 测试')),
      status && React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '系统状态'),
        React.createElement('div', null, 'Version: ' + (status.version || '?'))
      ),
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, 'Buckets'),
        React.createElement('div', null, 'Count: ' + bucketsData.length)
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(React.createElement(SettingsApp));
