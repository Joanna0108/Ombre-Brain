var useSt = React.useState;
var useEf = React.useEffect;

function h(tag, props) {
  var children = Array.prototype.slice.call(arguments, 2);
  return React.createElement.apply(null, [tag, props].concat(children));
}

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

  function showMsg(m) { setMsg(m); setTimeout(function() { setMsg(''); }, 3000); }

  useEf(function() {
    async function load() {
      try {
        var f = function(url, opt) { return fetch(url, opt).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }); };
        var results = await Promise.all([
          f('/api/status', { credentials: 'include' }),
          f('/api/config', { credentials: 'include' }),
          f('/api/tunnel/status', { credentials: 'include' }),
          f('/api/github/status', { credentials: 'include' }),
          f('/api/embedding/info'),
          f('/api/env-config', { credentials: 'include' }),
          f('/api/settings/sampling', { credentials: 'include' }),
          f('/api/settings/human', { credentials: 'include' }),
          f('/api/host-vault', { credentials: 'include' }),
          f('/api/version'),
          f('/api/buckets', { credentials: 'include' }),
          f('/api/embedding/local/status?model=bge-m3', { credentials: 'include' }),
        ]);
        if (results[0]) setStatus(results[0]);
        if (results[1]) setConfig(results[1]);
        if (results[2]) setTunnel(results[2]);
        if (results[3]) setGithub(results[3]);
        if (results[4]) setEmbInfo(results[4]);
        if (results[5]) setEnvConfig(results[5]);
        if (results[6]) setSampling(results[6]);
        if (results[7] && results[7].name) setHumanName(results[7].name);
        if (results[8] && results[8].value != null) setHostVault(results[8].value);
        if (results[9]) setVersion(results[9]);
        if (results[10]) setBucketsData(Array.isArray(results[10]) ? results[10] : []);
        if (results[11]) setLocalEmb(results[11]);
      } catch (e) {} finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return h('div', null,
    h(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    h(window.SharedNav, { active: 'settings' }),
    h('div', { className: 'st-loading' }, '加载设置…'),
  );

  function Sec(title, sub) {
    var children = Array.prototype.slice.call(arguments, 2);
    return h('div', { className: 'st-section' },
      h('h3', null, title),
      sub ? h('div', { className: 'st-sub' }, sub) : null,
      children.length === 1 ? children[0] : h.apply(null, ['div', null].concat(children)),
    );
  }

  function Row(label, child) {
    return h('div', { className: 'st-row' },
      h('label', null, label),
      child,
    );
  }

  function Btn(label, cls, onClick) {
    return h('button', { className: 'st-btn' + (cls ? ' ' + cls : ''), onClick: onClick }, label);
  }

  function Badge(on, labels) {
    var ll = labels || ['ON','OFF'];
    return h('span', { className: 'st-status ' + (on ? 'on' : 'off') }, on ? ll[0] : ll[1]);
  }

  return h('div', null,
    h(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    h(window.SharedNav, { active: 'settings' }),
    h('div', { className: 'st-page' },
      h('div', { className: 'st-hd' }, h('h1', null, '⚙️ 设置')),
      msg ? h('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,

      // ⓪
      Sec('⓪ 版本 & 更新', 'Version & Update',
        status ? Row('当前版本', status.version || '—') : null,
        version ? Row('版本号', version.version || '—') : null,
        h('div', { style: { marginTop: 6 } }, Btn('检查 GitHub 更新', 'primary', async function() {
          try { var r = await fetch('/api/version'); var d = await r.json(); alert('当前版本：' + (d.version || '?')); } catch(e) { alert('检查失败'); }
        })),
      ),

      // ①
      Sec('① 我', '个人信息 / Tunnel / 登出',
        h('div', null,
          h('div', { className: 'st-sub', style: { marginBottom: 6 } }, '称呼 / 昵称'),
          Row('称呼', null,
            h('input', { type: 'text', value: humanName, onChange: function(e) { setHumanName(e.target.value); }, placeholder: '人类',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
            }),
            Btn('保存', 'primary', async function() {
              await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
              showMsg('名称已保存');
            }),
          ),
        ),
        tunnel ? h('div', { style: { marginTop: 16 } },
          h('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
          h('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置'))),
          tunnel.url ? h('div', null, 'URL：' + tunnel.url) : null,
          h('div', { style: { marginTop: 6 } },
            tunnel.running
              ? Btn('停止 Tunnel', 'danger', async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); })
              : Btn('启动 Tunnel', 'primary', async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); }),
          ),
        ) : null,
        h('div', { style: { marginTop: 16 } },
          Btn('退出登录', 'danger', function() { if (confirm('确定退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } }),
        ),
      ),

      // ②
      Sec('② 服务', 'Service Status',
        status ? h('div', null,
          h('div', null, 'Buckets：' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…')),
          h('div', null, 'Decay Engine：' + Badge(status.decay_engine === 'running', ['运行中','停止'])),
        ) : null,
        h('div', { style: { marginTop: 16 } },
          h('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机记忆桶目录 (Docker)'),
          Row('路径', null,
            h('input', { type: 'text', value: hostVault, onChange: function(e) { setHostVault(e.target.value); }, placeholder: '/Users/you/Obsidian',
              style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
            }),
            Btn('保存', 'primary', async function() {
              await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' });
              showMsg('已保存，需 docker compose down && up');
            }),
          ),
        ),
      ),

      // ③
      Sec('③ 引擎', '脱水 LLM / 向量化 Embedding / 本地模型',
        config && config.dehydration ? h('div', { style: { marginBottom: 20 } },
          h('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 / 打标 LLM'),
          h('div', null, 'Model：' + (config.dehydration.model || '—') + ' · Tokens：' + (config.dehydration.max_tokens || '—') + ' · Temp：' + (config.dehydration.temperature || '—')),
          h('div', null, h('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
          h('div', null, 'API Key：' + (config.dehydration.api_key_masked || '未设置')),
        ) : null,
        embInfo ? h('div', { style: { marginBottom: 20 } },
          h('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
          h('div', null, '后端：' + (embInfo.backend || '—') + ' · 模型：' + (embInfo.model || '—') + ' · 维度：' + (embInfo.dimension || '—')),
          h('div', null, '已索引：' + (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · 启用：' + (embInfo.enabled ? 'ON' : 'OFF')),
          h('div', { style: { marginTop: 6 } }, Btn('补全缺失向量', 'primary', async function() {
            var r = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' });
            showMsg(r.ok ? '补全已启动' : '启动失败');
          })),
        ) : null,
        localEmb ? h('div', null,
          h('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地向量 / Ollama · bge-m3'),
          h('div', null, 'Ollama：' + Badge(localEmb.ollama_reachable, ['可达','不可达'])),
          h('div', null, '模型：' + (localEmb.models && localEmb.models.length ? localEmb.models.join(', ') : '无')),
          localEmb.has_model ? h('div', { style: { marginTop: 6 } },
            Btn('切换到本地向量', 'primary', async function() {
              if (!confirm('切换到本地 Ollama 向量？将触发全量重算')) return;
              await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' });
              showMsg('迁移已启动');
            }),
          ) : null,
        ) : null,
      ),

      // ④
      Sec('④ 桶行为', 'Breath 采样 / 默认参数',
        sampling ? h('div', null,
          h('div', null, '加权采样：' + (sampling.enabled ? 'ON' : 'OFF') + ' · top_k：' + (sampling.top_k || '—') + ' · sample_k：' + (sampling.sample_k || '—') + ' · 温度：' + (sampling.temperature || '—')),
        ) : null,
        config ? h('div', { style: { marginTop: 8 } },
          h('div', null, '合并阈值：' + (config.merge_threshold || '—')),
          config.surfacing ? h('div', null,
            h('div', null, 'breath 桶数：' + (config.surfacing.breath_max_results || '—') + ' · token：' + (config.surfacing.breath_max_tokens || '—')),
            h('div', null, 'feel token：' + (config.surfacing.feel_max_tokens || '—')),
          ) : null,
        ) : null,
      ),

      // ⑤
      Sec('⑤ 环境变量', 'OMBRE_* 当前值',
        envConfig && envConfig.fields ? h('div', null,
          Object.keys(envConfig.fields).sort().map(function(k) {
            var v = envConfig.fields[k] || '';
            var isKey = k.indexOf('_KEY') >= 0;
            return h('div', { key: k, className: 'st-row', style: { fontSize: 11 } },
              h('code', { style: { fontFamily: 'var(--mono)', fontSize: 10, minWidth: 200 } }, k),
              h('span', { style: { color: 'var(--ink-3)' } }, isKey ? (v ? '***已配置' : '未配置') : (v || '—')),
            );
          }),
        ) : null,
      ),

      // ⑥
      Sec('⑥ MCP 配置', 'Claude Desktop 连接端点（主 /mcp + 副 /mcp-extra，突破 claude.ai 5 工具上限）',
        h('div', { className: 'st-row' },
          h('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'),
          h('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点'),
        ),
        h('div', { className: 'st-row' },
          h('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'),
          h('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点'),
        ),
      ),

      // ⑦
      Sec('⑦ GitHub 同步', '自动备份 + 导入恢复',
        github ? h('div', null,
          h('div', null, '状态：' + (github.configured ? '已配置' : '未配置')),
          github.repo ? h('div', null, 'Repo：' + github.repo) : null,
          github.last_sync ? h('div', null, '上次同步：' + github.last_sync) : null,
          h('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
            Btn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); }),
            Btn('从 GitHub 导入', '', async function() {
              if (!confirm('导入会覆盖同名记忆，确认？')) return;
              await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发');
            }),
          ),
        ) : null,
      ),

      // ⑧
      Sec('⑧ 危险区', '导出 / 回收站 / 清理',
        h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
          h('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部为 ZIP'),
          h('a', { href: '/v2/console/trash/', className: 'st-btn' }, '打开回收站'),
          Btn('清空回收站', 'danger', async function() {
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
if (root) ReactDOM.createRoot(root).render(React.createElement(SettingsApp));
