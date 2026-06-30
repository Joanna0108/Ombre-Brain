var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(null), config = _b[0], setConfig = _b[1];
  var _c = useSt(null), tunnel = _c[0], setTunnel = _c[1];
  var _d = useSt(null), github = _d[0], setGithub = _d[1];
  var _g = useSt(null), sampling = _g[0], setSampling = _g[1];
  var _h = useSt(''), humanName = _h[0], setHumanName = _h[1];
  var _i = useSt(''), hostVault = _i[0], setHostVault = _i[1];
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
      f_('/api/github/status', { credentials: 'include' }),
      f_('/api/settings/sampling', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/host-vault', { credentials: 'include' }),
      f_('/api/buckets', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]); if (r[1]) setConfig(r[1]); if (r[2]) setTunnel(r[2]);
      if (r[3]) setGithub(r[3]); if (r[4]) setSampling(r[4]);
      if (r[5] && r[5].name) setHumanName(r[5].name);
      if (r[6] && r[6].value != null) setHostVault(r[6].value);
      if (r[7]) setBucketsData(Array.isArray(r[7]) ? r[7] : []);
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
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置 · test10')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,
      ce('div', { className: 'st-section' }, ce('h3', null, '测试'),
        ce('div', null, 'Status: ' + (status ? 'OK' : '—')),
        ce('div', null, 'Config: ' + (config ? 'OK' : '—')),
        ce('div', null, 'Tunnel: ' + (tunnel ? 'OK' : '—')),
        ce('div', null, 'Github: ' + (github ? 'OK' : '—')),
        ce('div', null, 'Sampling: ' + (sampling ? 'OK' : '—')),
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
