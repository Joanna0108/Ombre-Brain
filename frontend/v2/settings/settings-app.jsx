var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
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
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/buckets', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]);
      if (r[1] && r[1].name) setHumanName(r[1].name);
      if (r[2]) setBucketsData(Array.isArray(r[2]) ? r[2] : []);
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
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置 · test4')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      // test: button + input
      ce('div', { className: 'st-section' },
        ce('h3', null, '① 我'),
        ce('div', { className: 'st-row' },
          ce('label', null, '称呼'),
          ce('input', { type: 'text', value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类',
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
          }),
          ce('button', { className: 'st-btn primary', onClick: function() { showMsg('已保存'); } }, '保存'),
        ),
      ),

      status ? ce('div', { className: 'st-section' },
        ce('h3', null, '系统状态'),
        ce('div', null, 'Version: ' + (status.version || '?'))
      ) : null,
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
