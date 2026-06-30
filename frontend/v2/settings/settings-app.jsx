var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var a = useSt(null), status = a[0], setStatus = a[1];
  var b = useSt(null), config = b[0], setConfig = b[1];
  var c = useSt(null), tunnel = c[0], setTunnel = c[1];
  var h_ = useSt(''), humanName = h_[0], setHumanName = h_[1];
  var i = useSt(''), hostVault = i[0], setHostVault = i[1];
  var j = useSt([]), bucketsData = j[0], setBucketsData = j[1];
  var k = useSt(false), dark = k[0], setDark = k[1];
  var l = useSt(true), loading = l[0], setLoading = l[1];
  var m = useSt(''), msg = m[0], setMsg = m[1];

  function showMsg(txt) { setMsg(txt); setTimeout(function() { setMsg(''); }, 3000); }

  useEf(function() {
    var f_ = function(url, opt) { return fetch(url, opt).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }); };
    Promise.all([
      f_('/api/status', { credentials: 'include' }),
      f_('/api/config', { credentials: 'include' }),
      f_('/api/tunnel/status', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/host-vault', { credentials: 'include' }),
      f_('/api/buckets', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]);
      if (r[1]) setConfig(r[1]);
      if (r[2]) setTunnel(r[2]);
      if (r[3] && r[3].name) setHumanName(r[3].name);
      if (r[4] && r[4].value != null) setHostVault(r[4].value);
      if (r[5]) setBucketsData(Array.isArray(r[5]) ? r[5] : []);
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
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      // ⓪ 版本 & 更新
      ce('div', { className: 'st-section' },
        ce('h3', null, '⓪ 版本 & 更新'),
        ce('div', { className: 'st-sub' }, 'Version & Update'),
        status ? ce('div', { className: 'st-row' }, ce('label', null, '当前版本'), ce('span', null, status.version || '—')) : null,
        ce('div', { style: { marginTop: 6 } },
          ce('button', { className: 'st-btn primary', onClick: async function() {
            try { var rr = await fetch('/api/version'); var dd = await rr.json(); alert('当前版本：' + (dd.version || '?')); } catch(ex) { alert('检查失败'); }
          } }, '检查 GitHub 更新'),
        ),
      ),

      // ① 我
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
          ce('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置')) + (tunnel.url ? ' · URL：' + tunnel.url : '')),
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

      // ② 服务
      ce('div', { className: 'st-section' },
        ce('h3', null, '② 服务'),
        ce('div', { className: 'st-sub' }, 'Service Status'),
        status ? ce('div', null,
          ce('div', { className: 'st-row' }, ce('label', null, 'Buckets'), ce('span', null, status.buckets || (status.permanent_count + status.dynamic_count) || '…')),
          ce('div', { className: 'st-row' }, ce('label', null, 'Decay Engine'), ce('span', { className: 'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off') }, status.decay_engine === 'running' ? '运行中' : '停止')),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机记忆桶目录 (Docker)'),
          ce('div', { className: 'st-row' },
            ce('input', { type: 'text', value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
            }),
            ce('button', { className: 'st-btn primary', onClick: async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' });
              showMsg('已保存，需 docker compose down && up');
            } }, '保存'),
          ),
        ),
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
