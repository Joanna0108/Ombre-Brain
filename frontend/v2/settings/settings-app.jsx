var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(null), config = _b[0], setConfig = _b[1];
  var _c = useSt(null), tunnel = _c[0], setTunnel = _c[1];
  var _d = useSt(null), github = _d[0], setGithub = _d[1];
  var _e = useSt(null), embInfo = _e[0], setEmbInfo = _e[1];
  var _f = useSt(null), envConfig = _f[0], setEnvConfig = _f[1];
  var _g = useSt(null), sampling = _g[0], setSampling = _g[1];
  var _n = useSt(null), version = _n[0], setVersion = _n[1];
  var _o = useSt(null), localEmb = _o[0], setLocalEmb = _o[1];
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
      f_('/api/embedding/info'),
      f_('/api/env-config', { credentials: 'include' }),
      f_('/api/settings/sampling', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/host-vault', { credentials: 'include' }),
      f_('/api/version'),
      f_('/api/buckets', { credentials: 'include' }),
      f_('/api/embedding/local/status?model=bge-m3', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]); if (r[1]) setConfig(r[1]); if (r[2]) setTunnel(r[2]);
      if (r[3]) setGithub(r[3]); if (r[4]) setEmbInfo(r[4]); if (r[5]) setEnvConfig(r[5]); if (r[6]) setSampling(r[6]);
      if (r[7] && r[7].name) setHumanName(r[7].name);
      if (r[8] && r[8].value != null) setHostVault(r[8].value);
      if (r[9]) setVersion(r[9]);
      if (r[10]) setBucketsData(Array.isArray(r[10]) ? r[10] : []);
      if (r[11]) setLocalEmb(r[11]);
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
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置 · test13')),
      ce('div', { className: 'st-section' }, ce('h3', null, '全15状态测试'),
        ce('div', null, 'Emb: ' + (embInfo ? 'OK' : '—') + ' | Env: ' + (envConfig ? 'OK' : '—') + ' | Sampling: ' + (sampling ? 'OK' : '—')),
        ce('div', null, 'Version: ' + (version ? 'OK' : '—') + ' | LocalEmb: ' + (localEmb ? 'OK' : '—')),
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
