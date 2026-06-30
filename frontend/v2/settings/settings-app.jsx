var useSt = React.useState, useEf = React.useEffect, ce = React.createElement;

function Sec(title, sub) {
  var kids = [];
  for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) kids.push(arguments[i]);
  return ce('div', { className: 'st-section' },
    ce('h3', null, title),
    sub ? ce('div', { className: 'st-sub' }, sub) : null,
    kids.length > 0 ? ce('div', null, kids) : null,
  );
}

function Row(label) {
  var kids = [ce('label', null, label)];
  for (var i = 1; i < arguments.length; i++) if (arguments[i] != null) kids.push(arguments[i]);
  return ce('div', { className: 'st-row' }, kids);
}

function Btn(label, cls, onClick) {
  return ce('button', { className: 'st-btn' + (cls ? ' ' + cls : ''), onClick: onClick }, label);
}

function Badge(on, labels) {
  var ll = labels || ['ON','OFF'];
  return ce('span', { className: 'st-status ' + (on ? 'on' : 'off') }, on ? ll[0] : ll[1]);
}

var TABS = ['⓪版本','①我','②服务','③引擎','④桶行为','⑥MCP','⑦GitHub','⑧危险区'];

function SettingsApp() {
  var _a = useSt(null), status = _a[0], setStatus = _a[1];
  var _b = useSt(null), config = _b[0], setConfig = _b[1];
  var _c = useSt(null), tunnel = _c[0], setTunnel = _c[1];
  var _d = useSt(null), github = _d[0], setGithub = _d[1];
  var _e = useSt(null), embInfo = _e[0], setEmbInfo = _e[1];
  var _g = useSt(null), sampling = _g[0], setSampling = _g[1];
  var _h = useSt(''), humanName = _h[0], setHumanName = _h[1];
  var _i = useSt(''), hostVault = _i[0], setHostVault = _i[1];
  var _j = useSt([]), bucketsData = _j[0], setBucketsData = _j[1];
  var _k = useSt(false), dark = _k[0], setDark = _k[1];
  var _l = useSt(true), loading = _l[0], setLoading = _l[1];
  var _m = useSt(''), msg = _m[0], setMsg = _m[1];
  var _n = useSt(null), version = _n[0], setVersion = _n[1];
  var _o = useSt(null), localEmb = _o[0], setLocalEmb = _o[1];
  var _tab = useSt('⓪版本'), tab = _tab[0], setTab = _tab[1];

  function showMsg(txt) { setMsg(txt); setTimeout(function() { setMsg(''); }, 3000); }

  useEf(function() {
    var f_ = function(url, opt) { return fetch(url, opt).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }); };
    Promise.all([
      f_('/api/status', { credentials: 'include' }),
      f_('/api/config', { credentials: 'include' }),
      f_('/api/tunnel/status', { credentials: 'include' }),
      f_('/api/github/status', { credentials: 'include' }),
      f_('/api/embedding/info'),
      f_('/api/settings/sampling', { credentials: 'include' }),
      f_('/api/settings/human', { credentials: 'include' }),
      f_('/api/host-vault', { credentials: 'include' }),
      f_('/api/version'),
      f_('/api/buckets', { credentials: 'include' }),
      f_('/api/embedding/local/status?model=bge-m3', { credentials: 'include' }),
    ]).then(function(r) {
      if (r[0]) setStatus(r[0]); if (r[1]) setConfig(r[1]); if (r[2]) setTunnel(r[2]);
      if (r[3]) setGithub(r[3]); if (r[4]) setEmbInfo(r[4]); if (r[5]) setSampling(r[5]);
      if (r[6] && r[6].name) setHumanName(r[6].name);
      if (r[7] && r[7].value != null) setHostVault(r[7].value); if (r[8]) setVersion(r[8]);
      if (r[9]) setBucketsData(Array.isArray(r[9]) ? r[9] : []); if (r[10]) setLocalEmb(r[10]);
    }).catch(function() {}).finally(function() { setLoading(false); });
  }, []);

  if (loading) return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-loading' }, '加载设置…'),
  );

  var panel = null;

  if (tab === '⓪版本') {
    panel = Sec('⓪ 版本 & 更新', 'Version & Update',
      status ? Row('当前版本', ce('span', null, status.version || '—')) : null,
      version ? Row('版本号', ce('span', null, version.version || '—')) : null,
      ce('div', { style: { marginTop: 6 } }, Btn('检查 GitHub 更新', 'primary', async function() {
        try { var rr = await fetch('/api/version'); var dd = await rr.json(); alert('当前版本：' + (dd.version || '?')); } catch(ex) { alert('检查失败'); }
      })),
    );
  } else if (tab === '①我') {
    panel = Sec('① 我', '个人信息 / Tunnel / 登出',
      Row('称呼',
        ce('input', { type: 'text', value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类',
          style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
        Btn('保存', 'primary', async function() {
          await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' }); showMsg('已保存');
        }),
      ),
      tunnel ? ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
        ce('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置' : '未配置')) + (tunnel.url ? ' · ' + tunnel.url : '')),
        ce('div', { style: { marginTop: 6 } },
          tunnel.running
            ? Btn('停止', 'danger', async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); })
            : Btn('启动', 'primary', async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); }),
        ),
      ) : null,
      ce('div', { style: { marginTop: 16 } },
        Btn('退出登录', 'danger', function() { if (confirm('退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } }),
      ),
    );
  } else if (tab === '②服务') {
    panel = Sec('② 服务', 'Service Status',
      status ? ce('div', null,
        Row('Buckets', ce('span', null, '' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…'))),
        Row('Decay', Badge(status.decay_engine === 'running', ['运行中','停止'])),
      ) : null,
      ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机目录 (Docker)'),
        Row('路径',
          ce('input', { type: 'text', value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian',
            style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
          Btn('保存', 'primary', async function() {
            await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' }); showMsg('已保存');
          }),
        ),
      ),
    );
  } else if (tab === '③引擎') {
    panel = Sec('③ 引擎', '脱水 LLM / 向量化 Embedding / 本地模型',
      config && config.dehydration ? ce('div', { style: { marginBottom: 20 } },
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 LLM'),
        Row('Model', ce('span', null, config.dehydration.model || '—')),
        Row('Base URL', ce('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
        Row('API Key', ce('span', null, config.dehydration.api_key_masked || '未设置')),
        Row('Tokens/Temp', ce('span', null, (config.dehydration.max_tokens || '—') + ' / ' + (config.dehydration.temperature || '—'))),
      ) : null,
      embInfo ? ce('div', { style: { marginBottom: 20 } },
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
        Row('后端', ce('span', null, (embInfo.backend || '—') + ' / ' + (embInfo.model || '—') + ' / dim ' + (embInfo.dimension || '—'))),
        Row('已索引', ce('span', null, (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · ' + (embInfo.enabled ? '启用' : '禁用'))),
        ce('div', { style: { marginTop: 6 } }, Btn('补全缺失向量', 'primary', async function() {
          var rr = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); showMsg(rr.ok ? '补全已启动' : '失败');
        })),
      ) : null,
      localEmb ? ce('div', null,
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地 Ollama / bge-m3'),
        Row('状态', Badge(localEmb.ollama_reachable, ['可达','不可达'])),
        Row('模型', ce('span', null, localEmb.models && localEmb.models.length ? localEmb.models.join(', ') : '无')),
        localEmb.has_model ? ce('div', { style: { marginTop: 6 } }, Btn('切换到本地向量', 'primary', async function() {
          if (!confirm('切换本地？全量重算')) return;
          await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' }); showMsg('迁移已启动');
        })) : null,
      ) : null,
    );
  } else if (tab === '④桶行为') {
    panel = Sec('④ 桶行为', 'Breath 采样 / 默认参数',
      sampling ? ce('div', null,
        Row('加权采样', Badge(sampling.enabled)),
        Row('参数', ce('span', null, 'top_k=' + (sampling.top_k || '—') + ' sample_k=' + (sampling.sample_k || '—') + ' temp=' + (sampling.temperature || '—'))),
      ) : null,
      config ? ce('div', { style: { marginTop: 8 } },
        Row('合并阈值', ce('span', null, config.merge_threshold || '—')),
        config.surfacing ? Row('breath', ce('span', null, '桶数=' + (config.surfacing.breath_max_results || '—') + ' token=' + (config.surfacing.breath_max_tokens || '—'))) : null,
        config.surfacing ? Row('feel', ce('span', null, 'token=' + (config.surfacing.feel_max_tokens || '—'))) : null,
      ) : null,
    );
  } else if (tab === '⑥MCP') {
    panel = Sec('⑥ MCP 配置', 'Claude Desktop 端点 · 主 /mcp + 副 /mcp-extra',
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点（5工具）')),
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点（剩余工具）')),
    );
  } else if (tab === '⑦GitHub') {
    panel = Sec('⑦ GitHub 同步', '备份 + 导入恢复',
      github ? ce('div', null,
        Row('状态', Badge(github.configured, ['已配置','未配置'])),
        github.repo ? Row('Repo', ce('span', null, github.repo)) : null,
        github.last_sync ? Row('上次同步', ce('span', null, github.last_sync)) : null,
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); }),
          Btn('从 GitHub 导入', '', async function() { if (!confirm('导入覆盖同名记忆？')) return; await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发'); }),
        ),
      ) : null,
    );
  } else if (tab === '⑧危险区') {
    panel = Sec('⑧ 危险区', '导出 / 回收站',
      ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        ce('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部 ZIP'),
        ce('a', { href: '/v2/console/trash/', className: 'st-btn' }, '回收站'),
        Btn('清空回收站', 'danger', async function() { if (!confirm('永久删除？')) return; await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' }); showMsg('已清空'); }),
      ),
    );
  }

  return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    ce('div', { className: 'st-page' },
      ce('div', { className: 'st-hd' }, ce('h1', null, '⚙️ 设置')),
      msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,
      ce('div', { className: 'st-tabs' },
        TABS.map(function(t) {
          return ce('button', { key: t, className: tab === t ? 'on' : '', onClick: function() { setTab(t); } }, t);
        }),
      ),
      panel,
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
