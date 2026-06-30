var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(null), config = _b[0], setConfig = _b[1];
  var _c = useSt(null), tunnel = _c[0], setTunnel = _c[1];
  var _h = useSt(''), humanName = _h[0], setHumanName = _h[1];
  var _j = useSt([]), bucketsData = _j[0], setBucketsData = _j[1];
  var _k = useSt(false), dark = _k[0], setDark = _k[1];
  var _l = useSt(true), loading = _l[0], setLoading = _l[1];
  var _m = useSt(''), msg = _m[0], setMsg = _m[1];

  function showMsg(txt) { setMsg(txt); setTimeout(function() { setMsg(''); }, 3000); }

  useEf(function() {
    var f_ = function(url, opt) { return fetch(url, opt).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }); };
    Promise.all([
      f_('/api/status', { credentials: 'include' }),
      f_('/api/config', { credentials: 'include' }),
      f_('/api/tunnel/status', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/buckets', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]);
      if (r[1]) setConfig(r[1]);
      if (r[2]) setTunnel(r[2]);
      if (r[3] && r[3].name) setHumanName(r[3].name);
      if (r[4]) setBucketsData(Array.isArray(r[4]) ? r[4] : []);
    }).catch(function() {}).finally(function() { setLoading(false); });
  }, []);

  if (loading) return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-loading' }, '加载设置…'),
  );

  return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-page' },
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置 · 测试2')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,
      status ? ce('div', { className: 'st-section' },
        ce('h3', null, '系统状态'),
        ce('div', null, 'Version: ' + (status.version || '?'))
      ) : null,
      ce('div', { className: 'st-section' },
        ce('h3', null, 'Buckets'),
        ce('div', null, 'Count: ' + bucketsData.length)
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
