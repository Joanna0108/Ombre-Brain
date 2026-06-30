var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
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
      f_('/api/tunnel/status', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/buckets', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]);
      if (r[1]) setTunnel(r[1]);
      if (r[2] && r[2].name) setHumanName(r[2].name);
      if (r[3]) setBucketsData(Array.isArray(r[3]) ? r[3] : []);
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
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置 · test5')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      ce('div', { className: 'st-section' },
        ce('h3', null, '① 我'),
        ce('div', { className: 'st-sub' }, '个人信息 / Tunnel / 登出'),
        ce('div', { className: 'st-row' },
          ce('label', null, '称呼'),
          ce('input', { type: 'text', value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类',
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
          }),
          ce('button', { className: 'st-btn primary', onClick: async function() {
            await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
            showMsg('名称已保存');
          } }, '保存'),
        ),
        tunnel ? ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
          ce('div', null, '状态：' + (tunnel.running ? '运行中' : '未运行')),
          ce('div', { style: { marginTop: 6 } },
            tunnel.running
              ? ce('button', { className: 'st-btn danger', onClick: async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); } }, '停止 Tunnel')
              : ce('button', { className: 'st-btn primary', onClick: async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); } }, '启动 Tunnel'),
          ),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          ce('button', { className: 'st-btn danger', onClick: function() { if (confirm('确定退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } } }, '退出登录'),
        ),
      ),

      status ? ce('div', { className: 'st-section' },
        ce('h3', null, '⓪ 版本信息'),
        ce('div', null, 'Version: ' + (status.version || '?'))
      ) : null,
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
