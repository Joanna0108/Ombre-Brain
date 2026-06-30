var useState = React.useState;
var useEffect = React.useEffect;

function SettingsApp() {
  var statusArr = useState(null); var status = statusArr[0]; var setStatus = statusArr[1];
  var configArr = useState(null); var config = configArr[0]; var setConfig = configArr[1];
  var tunnelArr = useState(null); var tunnel = tunnelArr[0]; var setTunnel = tunnelArr[1];
  var githubArr = useState(null); var github = githubArr[0]; var setGithub = githubArr[1];
  var embInfoArr = useState(null); var embInfo = embInfoArr[0]; var setEmbInfo = embInfoArr[1];
  var envConfigArr = useState(null); var envConfig = envConfigArr[0]; var setEnvConfig = envConfigArr[1];
  var samplingArr = useState(null); var sampling = samplingArr[0]; var setSampling = samplingArr[1];
  var humanNameArr = useState(''); var humanName = humanNameArr[0]; var setHumanName = humanNameArr[1];
  var hostVaultArr = useState(''); var hostVault = hostVaultArr[0]; var setHostVault = hostVaultArr[1];
  var bucketsArr = useState([]); var bucketsData = bucketsArr[0]; var setBucketsData = bucketsArr[1];
  var darkArr = useState(false); var dark = darkArr[0]; var setDark = darkArr[1];
  var loadingArr = useState(true); var loading = loadingArr[0]; var setLoading = loadingArr[1];
  var msgArr = useState(''); var msg = msgArr[0]; var setMsg = msgArr[1];

  var showMsg = function(m) { setMsg(m); setTimeout(function() { setMsg(''); }, 3000); };

  var fetchAll = async function() {
    setLoading(true);
    try {
      var r1 = await fetch('/api/status', { credentials: 'include' }).catch(function() { return null; });
      if (r1 && r1.ok) setStatus(await r1.json());
      var r2 = await fetch('/api/config', { credentials: 'include' }).catch(function() { return null; });
      if (r2 && r2.ok) setConfig(await r2.json());
      var r3 = await fetch('/api/tunnel/status', { credentials: 'include' }).catch(function() { return null; });
      if (r3 && r3.ok) setTunnel(await r3.json());
      var r4 = await fetch('/api/github/status', { credentials: 'include' }).catch(function() { return null; });
      if (r4 && r4.ok) setGithub(await r4.json());
      var r5 = await fetch('/api/embedding/info').catch(function() { return null; });
      if (r5 && r5.ok) setEmbInfo(await r5.json());
      var r6 = await fetch('/api/env-config', { credentials: 'include' }).catch(function() { return null; });
      if (r6 && r6.ok) setEnvConfig(await r6.json());
      var r7 = await fetch('/api/settings/sampling', { credentials: 'include' }).catch(function() { return null; });
      if (r7 && r7.ok) setSampling(await r7.json());
      var r8 = await fetch('/api/settings/human', { credentials: 'include' }).catch(function() { return null; });
      if (r8 && r8.ok) { var d8 = await r8.json(); if (d8.name) setHumanName(d8.name); }
      var r9 = await fetch('/api/host-vault', { credentials: 'include' }).catch(function() { return null; });
      if (r9 && r9.ok) { var d9 = await r9.json(); if (d9.value != null) setHostVault(d9.value); }
      var r10 = await fetch('/api/buckets', { credentials: 'include' }).catch(function() { return null; });
      if (r10 && r10.ok) { var d10 = await r10.json(); setBucketsData(Array.isArray(d10) ? d10 : []); }
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(function() { fetchAll(); }, []);

  if (loading) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'settings' }),
    React.createElement('div', { className: 'st-loading' }, '加载设置…'),
  );

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'settings' }),
    React.createElement('div', { className: 'st-page' },
      React.createElement('div', { className: 'st-hd' }, React.createElement('h1', null, '⚙️ 设置')),
      msg && React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg),

      // ⓪
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '⓪ 版本 & 更新'),
        React.createElement('div', { className: 'st-sub' }, 'Version & Update'),
        status && React.createElement('div', { className: 'st-row' }, '当前版本：' + (status.version || '—')),
        React.createElement('div', { style: { marginTop: 6 } },
          React.createElement('button', { className: 'st-btn primary', onClick: async function() {
            try { var r = await fetch('/api/version'); var d = await r.json(); alert('当前版本：' + (d.version || '?')); } catch(e) {}
          } }, '检查更新'),
        ),
      ),

      // ①
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '① 我'),
        React.createElement('div', { className: 'st-sub' }, '个人信息 / Tunnel / 登出'),
        React.createElement('div', { className: 'st-row' },
          React.createElement('label', null, '称呼'),
          React.createElement('input', { type: 'text', value: humanName, onChange: function(e) { setHumanName(e.target.value); }, placeholder: '人类', style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
          React.createElement('button', { className: 'st-btn primary', onClick: async function() {
            await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
            showMsg('已保存');
          } }, '保存'),
        ),
        tunnel && React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('div', { className: 'st-row' }, 'Tunnel：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置'))),
          tunnel.url && React.createElement('div', { className: 'st-row' }, 'URL：' + tunnel.url),
          React.createElement('div', { style: { marginTop: 6 } },
            tunnel.running
              ? React.createElement('button', { className: 'st-btn danger', onClick: async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '停止 Tunnel')
              : React.createElement('button', { className: 'st-btn primary', onClick: async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '启动 Tunnel'),
          ),
        ),
        React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('button', { className: 'st-btn danger', onClick: function() { if (confirm('退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } } }, '退出登录'),
        ),
      ),

      // ②
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '② 服务'),
        React.createElement('div', { className: 'st-sub' }, 'Service Status'),
        status && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, 'Buckets：' + ((status.buckets) || (status.permanent_count + status.dynamic_count) || '…')),
          React.createElement('div', { className: 'st-row' }, 'Decay：' + (status.decay_engine || '—')),
        ),
        React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('div', { className: 'st-sub' }, '宿主机记忆桶目录 (Docker)'),
          React.createElement('div', { className: 'st-row' },
            React.createElement('input', { type: 'text', value: hostVault, onChange: function(e) { setHostVault(e.target.value); }, placeholder: '例如 /Users/you/Obsidian', style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
            React.createElement('button', { className: 'st-btn primary', onClick: async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' });
              showMsg('已保存，需 docker compose down && up');
            } }, '保存'),
          ),
        ),
      ),

      // ③
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '③ 引擎'),
        React.createElement('div', { className: 'st-sub' }, '脱水 LLM / 向量化 Embedding'),
        config && config.dehydration && React.createElement('div', { style: { marginBottom: 16 } },
          React.createElement('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 / 打标 LLM'),
          React.createElement('div', { className: 'st-row' }, 'Model：' + (config.dehydration.model || '—') + ' · Max Tokens：' + (config.dehydration.max_tokens || '—') + ' · Temp：' + (config.dehydration.temperature || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
          React.createElement('div', { className: 'st-row' }, 'API Key：' + (config.dehydration.api_key_masked || '未设置')),
        ),
        embInfo && React.createElement('div', { style: { marginBottom: 16 } },
          React.createElement('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
          React.createElement('div', { className: 'st-row' }, '后端：' + (embInfo.backend || '—') + ' · 模型：' + (embInfo.model || '—') + ' · 维度：' + (embInfo.dimension || '—')),
          React.createElement('div', { className: 'st-row' }, '已索引：' + (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · 启用：' + (embInfo.enabled ? 'ON' : 'OFF')),
          React.createElement('button', { className: 'st-btn primary', style: { marginTop: 8 }, onClick: async function() {
            var r = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' });
            showMsg(r.ok ? '补全已启动' : '启动失败');
          } }, '补全缺失向量'),
        ),
      ),

      // ④
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '④ 桶行为'),
        React.createElement('div', { className: 'st-sub' }, 'Breath 采样 / 默认参数'),
        sampling && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '加权采样：' + (sampling.enabled ? 'ON' : 'OFF') + ' · top_k：' + (sampling.top_k || '—') + ' · sample_k：' + (sampling.sample_k || '—') + ' · 温度：' + (sampling.temperature || '—')),
        ),
        config && React.createElement('div', { style: { marginTop: 8 } },
          React.createElement('div', { className: 'st-row' }, '合并阈值：' + (config.merge_threshold || '—')),
          config.surfacing && React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'breath 桶数：' + (config.surfacing.breath_max_results || '—') + ' · breath token：' + (config.surfacing.breath_max_tokens || '—') + ' · feel token：' + (config.surfacing.feel_max_tokens || '—')),
          ),
        ),
      ),

      // ⑤
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '⑤ 环境变量'),
        React.createElement('div', { className: 'st-sub' }, 'OMBRE_* 当前值'),
        envConfig && envConfig.fields && React.createElement('div', null,
          Object.keys(envConfig.fields).sort().map(function(k) {
            var v = envConfig.fields[k] || '';
            var isKey = k.indexOf('_KEY') >= 0;
            return React.createElement('div', { key: k, className: 'st-row', style: { fontSize: 11 } },
              React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 10, minWidth: 200 } }, k),
              React.createElement('span', { style: { color: 'var(--ink-3)' } }, isKey ? (v ? '***已配置' : '未配置') : (v || '—')),
            );
          }),
        ),
      ),

      // ⑥
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '⑥ MCP 配置'),
        React.createElement('div', { className: 'st-sub' }, 'Claude Desktop 连接端点'),
        React.createElement('div', { className: 'st-row' },
          React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'),
          React.createElement('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点'),
        ),
        React.createElement('div', { className: 'st-row' },
          React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'),
          React.createElement('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点'),
        ),
      ),

      // ⑦
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '⑦ GitHub 同步'),
        React.createElement('div', { className: 'st-sub' }, '自动备份 + 导入恢复'),
        github && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '状态：' + (github.configured ? '已配置' : '未配置')),
          github.repo && React.createElement('div', { className: 'st-row' }, 'Repo：' + github.repo),
          github.last_sync && React.createElement('div', { className: 'st-row' }, '上次同步：' + github.last_sync),
          React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            React.createElement('button', { className: 'st-btn primary', onClick: async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); fetchAll(); } }, '手动同步'),
            React.createElement('button', { className: 'st-btn', onClick: async function() {
              if (confirm('导入会覆盖同名记忆，确认？')) { await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发'); }
            } }, '从 GitHub 导入'),
          ),
        ),
      ),

      // ⑧
      React.createElement('div', { className: 'st-section' },
        React.createElement('h3', null, '⑧ 危险区'),
        React.createElement('div', { className: 'st-sub' }, '导出 / 回收站'),
        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          React.createElement('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部为 ZIP'),
          React.createElement('a', { href: '/v2/console/trash/', className: 'st-btn' }, '打开回收站'),
          React.createElement('button', { className: 'st-btn danger', onClick: async function() {
            if (confirm('永久删除回收站所有记忆？')) { await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' }); showMsg('已清空'); }
          } }, '清空回收站'),
        ),
      ),
    ),
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SettingsApp));
