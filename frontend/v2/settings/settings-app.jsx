var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var a = useSt(null), status = a[0], setStatus = a[1];
  var b = useSt(null), config = b[0], setConfig = b[1];
  var c = useSt(null), tunnel = c[0], setTunnel = c[1];
  var d = useSt(null), github = d[0], setGithub = d[1];
  var e = useSt(null), embInfo = e[0], setEmbInfo = e[1];
  var f = useSt(null), envConfig = f[0], setEnvConfig = f[1];
  var g = useSt(null), sampling = g[0], setSampling = g[1];
  var h_ = useSt(''), humanName = h_[0], setHumanName = h_[1];
  var i = useSt(''), hostVault = i[0], setHostVault = i[1];
  var j = useSt([]), bucketsData = j[0], setBucketsData = j[1];
  var k = useSt(false), dark = k[0], setDark = k[1];
  var l = useSt(true), loading = l[0], setLoading = l[1];
  var m = useSt(''), msg = m[0], setMsg = m[1];
  var n = useSt(null), version = n[0], setVersion = n[1];
  var o = useSt(null), localEmb = o[0], setLocalEmb = o[1];

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
      if (r[3]) setGithub(r[3]); if (r[4]) setEmbInfo(r[4]); if (r[5]) setEnvConfig(r[5]);
      if (r[6]) setSampling(r[6]); if (r[7] && r[7].name) setHumanName(r[7].name);
      if (r[8] && r[8].value != null) setHostVault(r[8].value); if (r[9]) setVersion(r[9]);
      if (r[10]) setBucketsData(Array.isArray(r[10]) ? r[10] : []); if (r[11]) setLocalEmb(r[11]);
    }).catch(function() {}).finally(function() { setLoading(false); });
  }, []);

  if (loading) return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-loading' }, '加载设置…'),
  );

  function Sec(title, sub, kids) {
    var arr = [ce('h3', null, title)];
    if (sub) arr.push(ce('div', { className: 'st-sub' }, sub));
    if (kids) { for (var i_ = 2; i_ < arguments.length; i_++) arr.push(arguments[i_]); }
    return ce('div', { className: 'st-section' }, ce.apply(null, ['div', null].concat(arr)));
  }

  function r(label, child) {
    var args = [ce('label', null, label)];
    for (var i_ = 1; i_ < arguments.length; i_++) args.push(arguments[i_]);
    return ce.apply(null, ['div', { className: 'st-row' }].concat(args));
  }

  function btn(label, cls, onClick) {
    return ce('button', { className: 'st-btn' + (cls ? ' ' + cls : ''), onClick: onClick }, label);
  }

  function badge(on) {
    return ce('span', { className: 'st-status ' + (on ? 'on' : 'off') }, on ? 'ON' : 'OFF');
  }

  return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-page' },
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      Sec('⓪ 版本 & 更新', 'Version & Update',
        status ? r('当前版本', status.version || '—') : null,
        ce('div', { style: { marginTop: 6 } }, btn('检查 GitHub 更新', 'primary', async function() {
          try { var rr = await fetch('/api/version'); var dd = await rr.json(); alert('当前版本：' + (dd.version || '?')); } catch(ex) { alert('检查失败'); }
        })),
      ),

      Sec('① 我', '个人信息 / Tunnel / 登出',
        ce('div', null,
          r('称呼',
            ce('input', { type: 'text', value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
            }),
            btn('保存', 'primary', async function() {
              await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
              showMsg('名称已保存');
            }),
          ),
        ),
        tunnel ? ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
          ce('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置')) + (tunnel.url ? ' · URL：' + tunnel.url : '')),
          ce('div', { style: { marginTop: 6 } },
            tunnel.running
              ? btn('停止 Tunnel', 'danger', async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); })
              : btn('启动 Tunnel', 'primary', async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); }),
          ),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          btn('退出登录', 'danger', function() { if (confirm('确定退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } }),
        ),
      ),

      Sec('② 服务', 'Service Status',
        status ? ce('div', null,
          ce('div', null, 'Buckets：' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…')),
          ce('div', null, 'Decay Engine：', badge(status.decay_engine === 'running')),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机记忆桶目录 (Docker)'),
          r('路径',
            ce('input', { type: 'text', value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
            }),
            btn('保存', 'primary', async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' });
              showMsg('已保存，需 docker compose down && up');
            }),
          ),
        ),
      ),

      Sec('③ 引擎', '脱水 LLM / 向量化 Embedding / 本地模型',
        config && config.dehydration ? ce('div', { style: { marginBottom: 20 } },
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 / 打标 LLM'),
          ce('div', null, 'Model：' + (config.dehydration.model || '—') + ' · Tokens：' + (config.dehydration.max_tokens || '—') + ' · Temp：' + (config.dehydration.temperature || '—')),
          ce('div', null, ce('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
          ce('div', null, 'API Key：' + (config.dehydration.api_key_masked || '未设置')),
        ) : null,
        embInfo ? ce('div', { style: { marginBottom: 20 } },
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
          ce('div', null, '后端：' + (embInfo.backend || '—') + ' · 模型：' + (embInfo.model || '—') + ' · 维度：' + (embInfo.dimension || '—')),
          ce('div', null, '已索引：' + (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · 启用：' + (embInfo.enabled ? 'ON' : 'OFF')),
          ce('div', { style: { marginTop: 6 } }, btn('补全缺失向量', 'primary', async function() {
            var rr = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' });
            showMsg(rr.ok ? '补全已启动' : '启动失败');
          })),
        ) : null,
        localEmb ? ce('div', null,
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地向量 / Ollama · bge-m3'),
          ce('div', null, 'Ollama：', badge(localEmb.ollama_reachable)),
          ce('div', null, '模型：' + (localEmb.models && localEmb.models.length ? localEmb.models.join(', ') : '无')),
          localEmb.has_model ? ce('div', { style: { marginTop: 6 } },
            btn('切换到本地向量', 'primary', async function() {
              if (!confirm('切换到本地 Ollama 向量？将触发全量重算')) return;
              await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' });
              showMsg('迁移已启动');
            }),
          ) : null,
        ) : null,
      ),

      Sec('④ 桶行为', 'Breath 采样 / 默认参数',
        sampling ? ce('div', null,
          ce('div', null, '加权采样：' + (sampling.enabled ? 'ON' : 'OFF') + ' · top_k：' + (sampling.top_k || '—') + ' · sample_k：' + (sampling.sample_k || '—') + ' · 温度：' + (sampling.temperature || '—')),
        ) : null,
        config ? ce('div', { style: { marginTop: 8 } },
          ce('div', null, '合并阈值：' + (config.merge_threshold || '—')),
          config.surfacing ? ce('div', null,
            ce('div', null, 'breath 桶数：' + (config.surfacing.breath_max_results || '—') + ' · token：' + (config.surfacing.breath_max_tokens || '—')),
            ce('div', null, 'feel token：' + (config.surfacing.feel_max_tokens || '—')),
          ) : null,
        ) : null,
      ),

      Sec('⑤ 环境变量', 'OMBRE_* 当前值',
        envConfig && envConfig.fields ? ce('div', null,
          Object.keys(envConfig.fields).sort().map(function(kk) {
            var vv = envConfig.fields[kk] || '';
            var isKey = kk.indexOf('_KEY') >= 0;
            return ce('div', { key: kk, className: 'st-row', style: { fontSize: 11 } },
              ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 10, minWidth: 200 } }, kk),
              ce('span', { style: { color: 'var(--ink-3)' } }, isKey ? (vv ? '***已配置' : '未配置') : (vv || '—')),
            );
          }),
        ) : null,
      ),

      Sec('⑥ MCP 配置', 'Claude Desktop 连接端点（主 /mcp + 副 /mcp-extra，突破 claude.ai 5 工具上限）',
        ce('div', { className: 'st-row' },
          ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'),
          ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点'),
        ),
        ce('div', { className: 'st-row' },
          ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'),
          ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点'),
        ),
      ),

      Sec('⑦ GitHub 同步', '自动备份 + 导入恢复',
        github ? ce('div', null,
          ce('div', null, '状态：' + (github.configured ? '已配置' : '未配置')),
          github.repo ? ce('div', null, 'Repo：' + github.repo) : null,
          github.last_sync ? ce('div', null, '上次同步：' + github.last_sync) : null,
          ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            btn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); }),
            btn('从 GitHub 导入', '', async function() {
              if (!confirm('导入会覆盖同名记忆，确认？')) return;
              await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发');
            }),
          ),
        ) : null,
      ),

      Sec('⑧ 危险区', '导出 / 回收站 / 清理',
        ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          ce('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部为 ZIP'),
          ce('a', { href: '/v2/console/trash/', className: 'st-btn' }, '打开回收站'),
          btn('清空回收站', 'danger', async function() {
            if (!confirm('永久删除回收站所有记忆？不可恢复。')) return;
            await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' });
            showMsg('已清空');
          }),
        ),
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
