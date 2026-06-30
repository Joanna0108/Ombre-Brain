var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(null), config = _b[0], setConfig = _b[1];
  var _c = useSt(null), tunnel = _c[0], setTunnel = _c[1];
  var _d = useSt(null), github = _d[0], setGithub = _d[1];
  var _e = useSt(null), embInfo = _e[0], setEmbInfo = _e[1];
  var _f = useSt(null), envConfig = _f[0], setEnvConfig = _f[1];
  var _g = useSt(null), sampling = _g[0], setSampling = _g[1];
  var _h = useSt(''), humanName = _h[0], setHumanName = _h[1];
  var _i = useSt(''), hostVault = _i[0], setHostVault = _i[1];
  var _j = useSt([]), bucketsData = _j[0], setBucketsData = _j[1];
  var _k = useSt(false), dark = _k[0], setDark = _k[1];
  var _l = useSt(true), loading = _l[0], setLoading = _l[1];
  var _m = useSt(''), msg = _m[0], setMsg = _m[1];
  var _n = useSt(null), version = _n[0], setVersion = _n[1];
  var _o = useSt(null), localEmb = _o[0], setLocalEmb = _o[1];

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

  return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-page' },
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      // ⓪
      ce('div', { className: 'st-section' },
        ce('h3', null, '⓪ 版本 & 更新'), ce('div', { className: 'st-sub' }, 'Version & Update'),
        status ? ce('div', { className: 'st-row' }, ce('label', null, '当前版本'), ce('span', null, status.version || '—')) : null,
        version ? ce('div', { className: 'st-row' }, ce('label', null, '版本号'), ce('span', null, version.version || '—')) : null,
        ce('div', { style: { marginTop: 6 } }, ce('button', { className: 'st-btn primary', onClick: async function() {
          try { var rr = await fetch('/api/version'); var dd = await rr.json(); alert('当前版本：' + (dd.version || '?')); } catch(ex) { alert('检查失败'); }
        } }, '检查 GitHub 更新')),
      ),

      // ①
      ce('div', { className: 'st-section' },
        ce('h3', null, '① 我'), ce('div', { className: 'st-sub' }, '个人信息 / Tunnel / 登出'),
        ce('div', { className: 'st-row' },
          ce('label', null, '称呼'),
          ce('input', { type: 'text', value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类',
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
          ce('button', { className: 'st-btn primary', onClick: async function() {
            await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' }); showMsg('已保存');
          } }, '保存'),
        ),
        tunnel ? ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
          ce('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置' : '未配置')) + (tunnel.url ? ' · ' + tunnel.url : '')),
          ce('div', { style: { marginTop: 6 } },
            tunnel.running
              ? ce('button', { className: 'st-btn danger', onClick: async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); } }, '停止')
              : ce('button', { className: 'st-btn primary', onClick: async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); } }, '启动'),
          ),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          ce('button', { className: 'st-btn danger', onClick: function() { if (confirm('退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } } }, '退出登录'),
        ),
      ),

      // ②
      ce('div', { className: 'st-section' },
        ce('h3', null, '② 服务'), ce('div', { className: 'st-sub' }, 'Service Status'),
        status ? ce('div', null,
          ce('div', { className: 'st-row' }, ce('label', null, 'Buckets'), ce('span', null, '' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…'))),
          ce('div', { className: 'st-row' }, ce('label', null, 'Decay'), ce('span', { className: 'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off') }, status.decay_engine === 'running' ? '运行中' : '停止')),
        ) : null,
        ce('div', { style: { marginTop: 16 } },
          ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机目录 (Docker)'),
          ce('div', { className: 'st-row' },
            ce('input', { type: 'text', value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
            ce('button', { className: 'st-btn primary', onClick: async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' }); showMsg('已保存');
            } }, '保存'),
          ),
        ),
      ),

      // ③
      ce('div', { className: 'st-section' },
        ce('h3', null, '③ 引擎'), ce('div', { className: 'st-sub' }, '脱水 LLM / 向量化 Embedding / 本地模型'),
        config && config.dehydration ? ce('div', { style: { marginBottom: 20 } },
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 LLM'),
          ce('div', { className: 'st-row' }, ce('label', null, 'Model'), ce('span', null, config.dehydration.model || '—')),
          ce('div', { className: 'st-row' }, ce('label', null, 'Base URL'), ce('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
          ce('div', { className: 'st-row' }, ce('label', null, 'API Key'), ce('span', null, config.dehydration.api_key_masked || '未设置')),
          ce('div', { className: 'st-row' }, ce('label', null, 'Tokens/Temp'), ce('span', null, (config.dehydration.max_tokens || '—') + ' / ' + (config.dehydration.temperature || '—'))),
        ) : null,
        embInfo ? ce('div', { style: { marginBottom: 20 } },
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
          ce('div', { className: 'st-row' }, ce('label', null, '后端'), ce('span', null, (embInfo.backend || '—') + ' / ' + (embInfo.model || '—') + ' / dim ' + (embInfo.dimension || '—'))),
          ce('div', { className: 'st-row' }, ce('label', null, '已索引'), ce('span', null, (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · ' + (embInfo.enabled ? '启用' : '禁用'))),
          ce('div', { style: { marginTop: 6 } }, ce('button', { className: 'st-btn primary', onClick: async function() {
            var rr = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); showMsg(rr.ok ? '补全已启动' : '失败');
          } }, '补全缺失向量')),
        ) : null,
        localEmb ? ce('div', null,
          ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地 Ollama / bge-m3'),
          ce('div', { className: 'st-row' }, ce('label', null, '状态'), ce('span', { className: 'st-status ' + (localEmb.ollama_reachable ? 'on' : 'off') }, localEmb.ollama_reachable ? '可达' : '不可达')),
          ce('div', { className: 'st-row' }, ce('label', null, '模型'), ce('span', null, localEmb.models && localEmb.models.length ? localEmb.models.join(', ') : '无')),
          localEmb.has_model ? ce('div', { style: { marginTop: 6 } }, ce('button', { className: 'st-btn primary', onClick: async function() {
            if (!confirm('切换本地向量？全量重算')) return;
            await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' }); showMsg('迁移已启动');
          } }, '切换到本地向量')) : null,
        ) : null,
      ),

      // ④
      ce('div', { className: 'st-section' },
        ce('h3', null, '④ 桶行为'), ce('div', { className: 'st-sub' }, 'Breath 采样 / 默认参数'),
        sampling ? ce('div', null,
          ce('div', { className: 'st-row' }, ce('label', null, '加权采样'), ce('span', { className: 'st-status ' + (sampling.enabled ? 'on' : 'off') }, sampling.enabled ? 'ON' : 'OFF')),
          ce('div', { className: 'st-row' }, ce('label', null, '参数'), ce('span', null, 'top_k=' + (sampling.top_k || '—') + ' sample_k=' + (sampling.sample_k || '—') + ' temp=' + (sampling.temperature || '—'))),
        ) : null,
        config ? ce('div', { style: { marginTop: 8 } },
          ce('div', { className: 'st-row' }, ce('label', null, '合并阈值'), ce('span', null, config.merge_threshold || '—')),
          config.surfacing ? ce('div', { className: 'st-row' }, ce('label', null, 'breath'), ce('span', null, '桶数=' + (config.surfacing.breath_max_results || '—') + ' token=' + (config.surfacing.breath_max_tokens || '—'))) : null,
          config.surfacing ? ce('div', { className: 'st-row' }, ce('label', null, 'feel'), ce('span', null, 'token=' + (config.surfacing.feel_max_tokens || '—'))) : null,
        ) : null,
      ),

      // ⑤
      ce('div', { className: 'st-section' },
        ce('h3', null, '⑤ 环境变量'), ce('div', { className: 'st-sub' }, 'OMBRE_* 当前值'),
        envConfig && envConfig.fields ? ce('div', null,
          Object.keys(envConfig.fields).sort().map(function(kk) {
            var vv = envConfig.fields[kk] || '';
            return ce('div', { key: kk, className: 'st-row', style: { fontSize: 11 } },
              ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 10, minWidth: 200 } }, kk),
              ce('span', { style: { color: 'var(--ink-3)' } }, (kk.indexOf('_KEY') >= 0) ? (vv ? '***已配置' : '未配置') : (vv || '—')),
            );
          }),
        ) : null,
      ),

      // ⑥
      ce('div', { className: 'st-section' },
        ce('h3', null, '⑥ MCP 配置'), ce('div', { className: 'st-sub' }, 'Claude Desktop 端点'),
        ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点')),
        ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点')),
      ),

      // ⑦
      ce('div', { className: 'st-section' },
        ce('h3', null, '⑦ GitHub 同步'), ce('div', { className: 'st-sub' }, '备份 + 导入'),
        github ? ce('div', null,
          ce('div', { className: 'st-row' }, ce('label', null, '状态'), ce('span', { className: 'st-status ' + (github.configured ? 'on' : 'off') }, github.configured ? '已配置' : '未配置')),
          github.repo ? ce('div', { className: 'st-row' }, ce('label', null, 'Repo'), ce('span', null, github.repo)) : null,
          github.last_sync ? ce('div', { className: 'st-row' }, ce('label', null, '上次同步'), ce('span', null, github.last_sync)) : null,
          ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            ce('button', { className: 'st-btn primary', onClick: async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); } }, '手动同步'),
            ce('button', { className: 'st-btn', onClick: async function() { if (!confirm('导入覆盖同名记忆？')) return; await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发'); } }, '从 GitHub 导入'),
          ),
        ) : null,
      ),

      // ⑧
      ce('div', { className: 'st-section' },
        ce('h3', null, '⑧ 危险区'), ce('div', { className: 'st-sub' }, '导出 / 回收站'),
        ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          ce('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部 ZIP'),
          ce('a', { href: '/v2/console/trash/', className: 'st-btn' }, '回收站'),
          ce('button', { className: 'st-btn danger', onClick: async function() { if (!confirm('永久删除？')) return; await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' }); showMsg('已清空'); } }, '清空回收站'),
        ),
      ),
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
