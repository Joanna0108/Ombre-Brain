const { useState, useEffect } = React;

// ── helpers ──
function stRow(label, child) {
  return React.createElement('div', { className: 'st-row' },
    React.createElement('label', null, label),
    child,
  );
}
function stBtn(label, cls, onClick) {
  return React.createElement('button', { className: 'st-btn' + (cls ? ' ' + cls : ''), onClick: onClick }, label);
}
function stStatus(on, labels) {
  var l = labels || ['ON','OFF'];
  return React.createElement('span', { className: 'st-status ' + (on ? 'on' : 'off') }, on ? l[0] : l[1]);
}
function Section(props) {
  return React.createElement('div', { className: 'st-section' },
    React.createElement('h3', null, props.title),
    props.sub && React.createElement('div', { className: 'st-sub' }, props.sub),
    props.children,
  );
}

// ── Main App ──
function SettingsApp() {
  function _st(initial) { var arr = useState(initial); return { v: arr[0], s: arr[1] }; }
  var _status = _st(null); var status = _status.v; var setStatus = _status.s;
  var _config = _st(null); var config = _config.v; var setConfig = _config.s;
  var _tunnel = _st(null); var tunnel = _tunnel.v; var setTunnel = _tunnel.s;
  var _github = _st(null); var github = _github.v; var setGithub = _github.s;
  var _embInfo = _st(null); var embInfo = _embInfo.v; var setEmbInfo = _embInfo.s;
  var _envConfig = _st(null); var envConfig = _envConfig.v; var setEnvConfig = _envConfig.s;
  var _envVars = _st(null); var envVars = _envVars.v; var setEnvVars = _envVars.s;
  var _sampling = _st(null); var sampling = _sampling.v; var setSampling = _sampling.s;
  var _humanName = _st(''); var humanName = _humanName.v; var setHumanName = _humanName.s;
  var _hostVault = _st(''); var hostVault = _hostVault.v; var setHostVault = _hostVault.s;
  var _version = _st(null); var version = _version.v; var setVersion = _version.s;
  var _bucketsData = _st([]); var bucketsData = _bucketsData.v; var setBucketsData = _bucketsData.s;
  var _dark = _st(false); var dark = _dark.v; var setDark = _dark.s;
  var _loading = _st(true); var loading = _loading.v; var setLoading = _loading.s;
  var _msg = _st(''); var msg = _msg.v; var setMsg = _msg.s;
  var _localEmb = _st(null); var localEmb = _localEmb.v; var setLocalEmb = _localEmb.s;

  var showMsg = function(m, isErr) { setMsg(m); setTimeout(function() { setMsg(''); }, isErr ? 5000 : 2000); };

  var fetchAll = async function() {
    setLoading(true);
    try {
      var results = await Promise.all([
        fetch('/api/status', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/config', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/tunnel/status', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/github/status', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/embedding/info').then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/env-config', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/env-vars', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/settings/sampling', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/settings/human', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/host-vault', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/version').then(function(r) { return r.json(); }).catch(function() { return null; }),
        fetch('/api/buckets', { credentials: 'include' }),
        fetch('/api/embedding/local/status?model=bge-m3', { credentials: 'include' }).then(function(r) { return r.json(); }).catch(function() { return null; }),
      ]);
      setStatus(results[0]); setConfig(results[1]); setTunnel(results[2]); setGithub(results[3]);
      setEmbInfo(results[4]); setEnvConfig(results[5]); setEnvVars(results[6]); setSampling(results[7]);
      if (results[8] && results[8].name) setHumanName(results[8].name);
      if (results[9] && results[9].value != null) setHostVault(results[9].value);
      setVersion(results[10]);
      if (results[11] && results[11].ok) { var bd = await results[11].json(); setBucketsData(Array.isArray(bd) ? bd : []); }
      setLocalEmb(results[12]);
    } catch (e) { setMsg('加载失败: ' + e.message); } finally { setLoading(false); }
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
      msg && React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: msg.indexOf('失败') >= 0 ? 'var(--rose)' : 'var(--accent)', marginBottom: 8 } }, msg),

      // ══════════════════════════════════════════
      // ⓪ 版本 & 更新
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '⓪ 版本 & 更新', sub: 'Version & Update' },
        version && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '当前版本：' + (version.version || '—')),
          version.remote_version && React.createElement('div', { className: 'st-row' }, '远程版本：' + version.remote_version),
          React.createElement('div', { style: { marginTop: 8 } }, stBtn('检查 GitHub 更新', 'primary', async function() {
            try {
              var r = await fetch('/api/update-info', { credentials: 'include' });
              var d = await r.json();
              alert('当前: ' + (d.version || '?') + '\n远程: ' + (d.remote_version || '?') + '\n\n' + (d.up_to_date ? '已是最新' : '有新版本可用'));
            } catch(e) { alert('检查失败: ' + e.message); }
          })),
        ),
      ),

      // ══════════════════════════════════════════
      // ① 我
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '① 我', sub: '个人信息 / 密码 / Tunnel / 登出' },
        // Human name
        React.createElement('div', { style: { marginBottom: 16 } },
          React.createElement('div', { className: 'st-sub', style: { marginBottom: 6 } }, '称呼 / 昵称 — 系统通知 + 记忆里的称呼。保存时会把已有记忆里的旧称呼一并换成新名。'),
          React.createElement('div', { className: 'st-row' },
            React.createElement('input', { type: 'text', value: humanName, onChange: function(e) { setHumanName(e.target.value); }, placeholder: '人类', style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
            stBtn('保存', 'primary', async function() {
              await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
              showMsg('名称已保存');
            }),
          ),
        ),
        // Tunnel
        React.createElement('div', { style: { marginBottom: 16 } },
          React.createElement('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel — 从外网访问 Dashboard'),
          tunnel && React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态：', stStatus(tunnel.running, ['运行中','未运行'])),
            tunnel.url && React.createElement('div', { className: 'st-row' }, 'URL：' + tunnel.url),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
              tunnel.running
                ? stBtn('停止', 'danger', async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); fetchAll(); })
                : stBtn('启动', 'primary', async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); fetchAll(); }),
            ),
          ),
        ),
        // Logout
        stBtn('退出登录', 'danger', async function() {
          if (confirm('确定退出登录？')) {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
            location.reload();
          }
        }),
      ),

      // ══════════════════════════════════════════
      // ② 服务
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '② 服务', sub: 'Service Status' },
        status && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '版本：' + (status.version || '—')),
          React.createElement('div', { className: 'st-row' }, 'Buckets：' + ((status.buckets) || (status.permanent_count + status.dynamic_count) || '…')),
          React.createElement('div', { className: 'st-row' }, 'Decay Engine：', stStatus(status.decay_engine === 'running', ['运行中','停止'])),
        ),
        React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机记忆桶目录 (Docker)'),
          React.createElement('div', { className: 'st-row' },
            React.createElement('input', { type: 'text', value: hostVault, onChange: function(e) { setHostVault(e.target.value); }, placeholder: '例如 /Users/you/Obsidian/Ombre Brain', style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 } }),
            stBtn('保存', 'primary', async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' });
              showMsg('已保存，需 docker compose down && up 生效');
            }),
          ),
        ),
      ),

      // ══════════════════════════════════════════
      // ③ 引擎
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '③ 引擎', sub: '脱水 LLM / 向量化 Embedding / 本地模型' },
        // Dehydration LLM
        config && config.dehydration && React.createElement('div', { style: { marginBottom: 20 } },
          React.createElement('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 8 } }, '脱水 / 打标 LLM'),
          React.createElement('div', { className: 'st-row' }, 'Model：' + (config.dehydration.model || '—')),
          React.createElement('div', { className: 'st-row' }, 'Base URL：' + React.createElement('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
          React.createElement('div', { className: 'st-row' }, 'API Key：' + (config.dehydration.api_key_masked || '未设置')),
          React.createElement('div', { className: 'st-row' }, 'Max Tokens：' + (config.dehydration.max_tokens || '—') + ' · Temperature：' + (config.dehydration.temperature || '—')),
        ),
        // Embedding
        React.createElement('div', { style: { marginBottom: 20 } },
          React.createElement('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 8 } }, '向量化 Embedding'),
          embInfo && React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '后端：' + (embInfo.backend || '—') + ' · 模型：' + (embInfo.model || '—') + ' · 维度：' + (embInfo.dimension || '—')),
            React.createElement('div', { className: 'st-row' }, '已索引：' + (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · 启用：', stStatus(embInfo.enabled)),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
              stBtn('补全缺失向量', 'primary', async function() {
                var r = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' });
                if (r.ok) showMsg('补全已启动');
                else showMsg('启动失败', true);
              }),
            ),
          ),
        ),
        // Local embedding
        React.createElement('div', null,
          React.createElement('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 8 } }, '本地向量模型 / Ollama · bge-m3'),
          localEmb && React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'Ollama：', stStatus(localEmb.ollama_reachable, ['可达','不可达'])),
            React.createElement('div', { className: 'st-row' }, '已安装模型：' + (localEmb.models && localEmb.models.length ? localEmb.models.join(', ') : '无')),
            localEmb.has_model && React.createElement('div', { style: { marginTop: 8 } },
              stBtn('切换到本地向量', 'primary', async function() {
                if (!confirm('切换到本地 Ollama 向量？将触发全量重算')) return;
                await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' });
                showMsg('迁移已启动，请等待完成');
              }),
            ),
          ),
        ),
        React.createElement('div', { style: { marginTop: 12 } }, stBtn('保存配置 (写入 config.yaml)', 'primary', async function() {
          showMsg('完整配置保存请使用旧版 Dashboard — 设置 → 引擎 → 保存配置');
        })),
      ),

      // ══════════════════════════════════════════
      // ④ 桶行为
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '④ 桶行为', sub: 'Breath 采样 / 默认参数' },
        sampling && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '加权采样：', stStatus(sampling.enabled)),
          React.createElement('div', { className: 'st-row' }, 'top_k：' + (sampling.top_k || '—') + ' · sample_k：' + (sampling.sample_k || '—') + ' · 温度：' + (sampling.temperature || '—')),
        ),
        config && React.createElement('div', { style: { marginTop: 12 } },
          React.createElement('div', { className: 'st-row' }, '合并阈值：' + (config.merge_threshold || '—')),
          config.surfacing && React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'breath 默认桶数：' + (config.surfacing.breath_max_results || '—')),
            React.createElement('div', { className: 'st-row' }, 'breath token：' + (config.surfacing.breath_max_tokens || '—')),
            React.createElement('div', { className: 'st-row' }, 'feel token：' + (config.surfacing.feel_max_tokens || '—')),
          ),
        ),
      ),

      // ══════════════════════════════════════════
      // ⑤ 环境变量
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '⑤ 环境变量', sub: 'OMBRE_* 配置（压缩 / Embedding / Replay / Webhook）' },
        envConfig && envConfig.fields && React.createElement('div', null,
          ['OMBRE_COMPRESS_API_KEY','OMBRE_COMPRESS_MODEL','OMBRE_COMPRESS_BASE_URL','OMBRE_EMBED_API_KEY','OMBRE_EMBED_MODEL','OMBRE_EMBED_BASE_URL','OMBRE_REPLAY_API_KEY','OMBRE_REPLAY_MODEL','OMBRE_REPLAY_BASE_URL','OMBRE_HOOK_URL'].map(function(k) {
            var v = envConfig.fields[k] || '';
            var isKey = k.indexOf('_KEY') >= 0;
            return React.createElement('div', { key: k, className: 'st-row', style: { fontSize: 11 } },
              React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 10, minWidth: 180 } }, k),
              React.createElement('span', { style: { color: 'var(--ink-3)' } }, isKey ? (v ? '已配置' : '未配置') : (v || '—')),
            );
          }),
        ),
        envVars && React.createElement('details', { style: { marginTop: 12 } },
          React.createElement('summary', { style: { fontSize: 12, color: 'var(--ink-3)', cursor: 'pointer' } }, '全部环境变量（' + (envVars.total || Object.keys(envVars).length) + ' 个）'),
        ),
      ),

      // ══════════════════════════════════════════
      // ⑥ MCP 配置
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '⑥ MCP 配置', sub: 'Claude Desktop / claude.ai 连接端点' },
        React.createElement('div', { className: 'st-row' },
          React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'),
          React.createElement('span', { style: { color: 'var(--ink-3)', fontSize: 12 } }, '主端点（5 工具）'),
        ),
        React.createElement('div', { className: 'st-row' },
          React.createElement('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'),
          React.createElement('span', { style: { color: 'var(--ink-3)', fontSize: 12 } }, '副端点（剩余工具）'),
        ),
        React.createElement('div', { style: { marginTop: 8, fontSize: 11, color: 'var(--ink-4)' } },
          '本地：http://127.0.0.1:7890/mcp · 公网使用当前域名',
        ),
      ),

      // ══════════════════════════════════════════
      // ⑦ GitHub 同步
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '⑦ GitHub 同步', sub: '自动备份 + 导入恢复' },
        github && React.createElement('div', null,
          React.createElement('div', { className: 'st-row' }, '状态：', stStatus(github.configured, ['已配置','未配置'])),
          github.repo && React.createElement('div', { className: 'st-row' }, 'Repo：' + github.repo),
          github.last_sync && React.createElement('div', { className: 'st-row' }, '上次同步：' + github.last_sync),
          React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            stBtn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); fetchAll(); }),
            stBtn('从 GitHub 导入', '', async function() {
              if (!confirm('导入会覆盖同名记忆，确认？')) return;
              await fetch('/api/github/import', { method: 'POST', credentials: 'include' });
              showMsg('导入已触发');
            }),
          ),
        ),
        React.createElement('div', { style: { marginTop: 8, fontSize: 11, color: 'var(--ink-4)' } },
          '完整配置（Token/Repo/Branch/自动同步）请用旧版 Dashboard → ⑦ GitHub 同步',
        ),
      ),

      // ══════════════════════════════════════════
      // ⑧ 危险区
      // ══════════════════════════════════════════
      React.createElement(Section, { title: '⑧ 危险区', sub: '导出 / 回收站 / 清理' },
        React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          React.createElement('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部为 ZIP'),
          React.createElement('a', { href: '/v2/console/trash/', className: 'st-btn' }, '打开回收站'),
          stBtn('清空回收站', 'danger', async function() {
            if (confirm('永久删除回收站所有记忆？不可恢复。')) {
              await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' });
              showMsg('已清空');
            }
          }),
        ),
      ),
    ),
  );
}

try { ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SettingsApp)); } catch(e) { console.error(e); }
