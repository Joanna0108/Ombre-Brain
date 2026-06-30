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

function Inp(opts) {
  var o = opts || {};
  return ce('input', { type: o.type || 'text', value: o.value || '', onChange: o.onChange, placeholder: o.placeholder || '',
    style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: (o.flex !== false) ? 1 : 'none', width: o.width || 'auto', minWidth: o.minWidth || 0 },
  });
}

function Sel(opts) {
  var o = opts || {};
  var choices = o.choices || [];
  return ce('select', { value: o.value || '', onChange: o.onChange,
    style: { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)', flex: 1 },
  }, choices.map(function(c) { return ce('option', { key: c.v, value: c.v }, c.label); }));
}

function showMsg(setMsg, txt) { setMsg(txt); setTimeout(function() { setMsg(''); }, 3000); }

var TABS = ['⓪版本','①我','②服务','③引擎','④桶行为','⑥MCP','⑦GitHub','⑧危险区'];

function SettingsApp() {
  var a = useSt(null), status = a[0], setStatus = a[1];
  var b = useSt(null), config = b[0], setConfig = b[1];
  var c = useSt(null), tunnel = c[0], setTunnel = c[1];
  var d = useSt(null), github = d[0], setGithub = d[1];
  var e = useSt(null), embInfo = e[0], setEmbInfo = e[1];
  var g = useSt(null), sampling = g[0], setSampling = g[1];
  var h = useSt(''), humanName = h[0], setHumanName = h[1];
  var i = useSt(''), hostVault = i[0], setHostVault = i[1];
  var j = useSt([]), bucketsData = j[0], setBucketsData = j[1];
  var k = useSt(false), dark = k[0], setDark = k[1];
  var l = useSt(true), loading = l[0], setLoading = l[1];
  var m = useSt(''), msg = m[0], setMsg = m[1];
  var n = useSt(null), version = n[0], setVersion = n[1];
  var o = useSt(null), localEmb = o[0], setLocalEmb = o[1];
  var tab = useSt('⓪版本'), curTab = tab[0], setTab = tab[1];

  var sm = function(t) { showMsg(setMsg, t); };

  useEf(function() {
    var f = function(url, opt) { return fetch(url, opt).then(function(r) { return r.ok ? r.json() : null; }).catch(function() { return null; }); };
    Promise.all([
      f('/api/status', { credentials: 'include' }),
      f('/api/config', { credentials: 'include' }),
      f('/api/tunnel/status', { credentials: 'include' }),
      f('/api/github/status', { credentials: 'include' }),
      f('/api/embedding/info'),
      f('/api/settings/sampling', { credentials: 'include' }),
      f('/api/settings/human', { credentials: 'include' }),
      f('/api/host-vault', { credentials: 'include' }),
      f('/api/version'),
      f('/api/buckets', { credentials: 'include' }),
      f('/api/embedding/local/status?model=bge-m3', { credentials: 'include' }),
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

  if (curTab === '⓪版本') {
    panel = Sec('⓪ 版本 & 更新', 'Version & Update',
      status ? Row('当前版本', ce('span', null, status.version || '—')) : null,
      version ? Row('版本号', ce('span', null, version.version || '—')) : null,
      ce('div', { style: { marginTop: 6, display: 'flex', gap: 8 } },
        Btn('检查 GitHub 更新', 'primary', async function() {
          try { var rr = await fetch('/api/update-info', { credentials: 'include' }); var dd = await rr.json();
            alert('当前: ' + (dd.version || '?') + '\n远程: ' + (dd.remote_version || '?') + '\n' + (dd.up_to_date ? '已是最新' : '有新版本可用'));
          } catch(ex) { alert('检查失败'); }
        }),
        Btn('热更新', '', async function() {
          if (!confirm('将从 GitHub 拉取最新代码并重启服务，确定？')) return;
          try {
            var r = await fetch('/api/do-update', { method: 'POST', credentials: 'include' });
            alert(r.ok ? '更新已触发，服务将重启' : '更新失败');
          } catch(ex) { alert('更新失败: ' + ex.message); }
        }),
      ),
    );
  } else if (curTab === '①我') {
    panel = Sec('① 我', '个人信息 / 密码 / Tunnel / 登出',
      Row('称呼',
        Inp({ value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类' }),
        Btn('保存', 'primary', async function() {
          await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' }); sm('已保存');
        }),
      ),
      ce('div', { style: { marginTop: 4 } },
        Btn('同步旧称呼', '', async function() {
          var old = window.prompt('要替换的旧称呼（如"用户"）：', '');
          if (!old) return;
          await fetch('/api/settings/human/sync-existing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old_name: old }), credentials: 'include' });
          sm('旧称呼已替换');
        }),
      ),
      ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 4 } }, '账户密码'),
        Btn('修改密码', '', async function() {
          var cur = window.prompt('当前密码：', ''); if (!cur) return;
          var nw = window.prompt('新密码（至少6位）：', ''); if (!nw || nw.length < 6) { alert('至少6位'); return; }
          var cf = window.prompt('确认新密码：', ''); if (nw !== cf) { alert('两次不一致'); return; }
          var r = await fetch('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: cur, new: nw }), credentials: 'include' });
          var d = await r.json();
          if (d.ok) { sm('密码已修改'); } else { sm('失败: ' + (d.error || ''), true); }
        }),
        Btn('设置安全问题', '', async function() {
          var q = window.prompt('安全问题：', ''); if (!q) return;
          var a = window.prompt('答案：', ''); if (!a) return;
          var r = await fetch('/auth/security-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, answer: a }), credentials: 'include' });
          var d = await r.json();
          if (d.ok) sm('安全问题已设置'); else sm('失败: ' + d.error, true);
        }, { marginLeft: 8 }),
      ),
      tunnel ? ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, 'Cloudflare Tunnel'),
        ce('div', null, '状态：' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置' : '未配置')) + (tunnel.url ? ' · ' + tunnel.url : '')),
        ce('div', { style: { marginTop: 6 } },
          tunnel.running
            ? Btn('停止', 'danger', async function() { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); location.reload(); })
            : Btn('启动', 'primary', async function() { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); location.reload(); }),
          Btn('配置 Token', '', async function() {
            var tok = window.prompt('Tunnel Token（从 Cloudflare 复制）：', '');
            if (!tok) return;
            await fetch('/api/tunnel/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tok }), credentials: 'include' });
            sm('Token 已保存');
          }, { marginLeft: 8 }),
        ),
      ) : null,
      ce('div', { style: { marginTop: 16 } },
        Btn('退出登录', 'danger', function() { if (confirm('退出登录？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } }),
      ),
    );
  } else if (curTab === '②服务') {
    panel = Sec('② 服务', 'Service Status',
      status ? ce('div', null,
        Row('Buckets', ce('span', null, '' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…'))),
        Row('Decay', Badge(status.decay_engine === 'running', ['运行中','停止'])),
      ) : null,
      ce('div', { style: { marginTop: 12 } },
        Btn('修复钉选计数', '', async function() {
          if (!confirm('检查并修复孤儿固化桶？')) return;
          var r = await fetch('/api/maintenance/fix-pinned-desync', { credentials: 'include' });
          var d = await r.json();
          sm((d.fixed || 0) + ' 个已修复');
        }),
      ),
      ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 6 } }, '宿主机目录 (Docker)'),
        Row('路径',
          Inp({ value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian' }),
          Btn('保存', 'primary', async function() {
            await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' }); sm('已保存，需 docker compose down && up');
          }),
        ),
      ),
    );
  } else if (curTab === '③引擎') {
    panel = Sec('③ 引擎', '脱水 LLM / 向量化 Embedding / 本地模型',
      config && config.dehydration ? ce('div', { style: { marginBottom: 20 } },
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '脱水 LLM'),
        Row('Model', ce('span', null, config.dehydration.model || '—')),
        Row('Base URL', ce('code', { style: { fontSize: 11, fontFamily: 'var(--mono)' } }, config.dehydration.base_url || '—')),
        Row('API Key', ce('span', null, config.dehydration.api_key_masked || '未设置')),
        Row('Tokens / Temp', ce('span', null, (config.dehydration.max_tokens || '—') + ' / ' + (config.dehydration.temperature || '—'))),
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('保存 Key', '', async function() {
            var key = window.prompt('新 API Key：', ''); if (!key) return;
            await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { OMBRE_COMPRESS_API_KEY: key } }), credentials: 'include' });
            sm('Key 已保存'); location.reload();
          }),
          Btn('测试连接', '', async function() {
            var r = await fetch('/api/test/dehydration', { method: 'POST', credentials: 'include' });
            var d = await r.json(); alert(d.ok ? '连接成功' : '失败: ' + (d.error || ''));
          }),
          Btn('获取模型', '', async function() {
            var r = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}), credentials: 'include' });
            var d = await r.json();
            alert(d.models ? '可用模型:\n' + d.models.join('\n') : '获取失败: ' + JSON.stringify(d));
          }),
        ),
      ) : null,
      embInfo ? ce('div', { style: { marginBottom: 20 } },
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '向量化 Embedding'),
        Row('后端', ce('span', null, (embInfo.backend || '—') + ' / ' + (embInfo.model || '—') + ' / dim ' + (embInfo.dimension || '—'))),
        Row('已索引', ce('span', null, (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · ' + (embInfo.enabled ? '启用' : '禁用'))),
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('保存 Key', '', async function() {
            var key = window.prompt('新 Embedding API Key：', ''); if (!key) return;
            await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { OMBRE_EMBED_API_KEY: key } }), credentials: 'include' });
            sm('Key 已保存'); location.reload();
          }),
          Btn('测试', '', async function() {
            var r = await fetch('/api/test/embedding', { method: 'POST', credentials: 'include' });
            var d = await r.json(); alert(d.ok ? '连接成功' : '失败: ' + (d.error || ''));
          }),
          Btn('补全缺失向量', 'primary', async function() {
            var r = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); sm(r.ok ? '补全已启动' : '失败');
          }),
        ),
        ce('div', { style: { marginTop: 8, display: 'flex', gap: 8 } },
          Btn('切换后端并重算', '', async function() {
            var be = window.prompt('目标后端（api/ollama）：', embInfo.backend || 'api');
            if (!be) return;
            if (!confirm('切换到 ' + be + ' 后端？将触发全量重算')) return;
            await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: be }), credentials: 'include' });
            sm('迁移已启动');
          }),
        ),
      ) : null,
      localEmb ? ce('div', null,
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地 Ollama / bge-m3'),
        Row('状态', Badge(localEmb.ollama_reachable, ['可达','不可达'])),
        localEmb.models && localEmb.models.length ? Row('模型', ce('span', null, localEmb.models.join(', '))) : null,
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          !localEmb.installed ? Btn('安装 Ollama', '', async function() {
            var mr = window.prompt('镜像 (留空=官方)：', ''); if (mr === null) return;
            var r = await fetch('/api/embedding/local/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mr ? { mirror: mr } : {}), credentials: 'include' });
            sm(r.ok ? '安装已启动' : '启动失败');
          }) : null,
          localEmb.installed && !localEmb.ollama_reachable ? Btn('启动 Ollama', '', async function() {
            await fetch('/api/embedding/local/start', { method: 'POST', credentials: 'include' }); sm('启动中...'); setTimeout(function() { location.reload(); }, 3000);
          }) : null,
          localEmb.ollama_reachable && !localEmb.has_model ? Btn('下载 bge-m3', '', async function() {
            var mr = window.prompt('模型镜像 (留空=官方)：', ''); if (mr === null) return;
            var r = await fetch('/api/embedding/local/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mr ? { model: 'bge-m3', mirror: mr } : { model: 'bge-m3' }), credentials: 'include' });
            sm(r.ok ? '下载已启动' : '启动失败');
          }) : null,
          localEmb.has_model ? Btn('切换到本地向量', 'primary', async function() {
            if (!confirm('切换本地？全量重算')) return;
            await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' });
            sm('迁移已启动');
          }) : null,
        ),
      ) : null,
    );
  } else if (curTab === '④桶行为') {
    panel = Sec('④ 桶行为', 'Breath 采样 / 默认参数',
      sampling ? ce('div', null,
        Row('加权采样', Badge(sampling.enabled)),
        Row('top_k', ce('span', null, sampling.top_k || '—')),
        Row('sample_k', ce('span', null, sampling.sample_k || '—')),
        Row('温度', ce('span', null, sampling.temperature || '—')),
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('保存采样', 'primary', async function() {
            var tk = window.prompt('top_k (1-50)：', sampling.top_k || 10);
            if (tk === null) return;
            var sk = window.prompt('sample_k (1-20)：', sampling.sample_k || 5);
            if (sk === null) return;
            var tp = window.prompt('温度 (0.1-2.0)：', sampling.temperature || 0.7);
            if (tp === null) return;
            await fetch('/api/settings/sampling', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: sampling.enabled, top_k: parseInt(tk), sample_k: parseInt(sk), temperature: parseFloat(tp) }), credentials: 'include' });
            sm('已保存'); setTimeout(function() { location.reload(); }, 800);
          }),
          Btn('试 Breath', '', async function() {
            var r = await fetch('/api/breath?n=5', { credentials: 'include' });
            var d = await r.json();
            alert('Top 5:\n' + (d.buckets || []).map(function(b) { return b.name + ' (' + b.score + ')'; }).join('\n'));
          }),
        ),
      ) : null,
      config ? ce('div', { style: { marginTop: 12 } },
        Row('合并阈值', ce('span', null, config.merge_threshold || '—')),
        config.surfacing ? Row('breath 桶数', ce('span', null, config.surfacing.breath_max_results || '—')) : null,
        Btn('保存配置', '', async function() {
          sm('完整配置保存请用旧版 Dashboard → 引擎 → 保存配置');
        }),
      ) : null,
    );
  } else if (curTab === '⑥MCP') {
    panel = Sec('⑥ MCP 配置', 'Claude Desktop 连接端点 · 主 /mcp + 副 /mcp-extra（突破 claude.ai 5 工具上限）',
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点（5工具）')),
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点（剩余工具）')),
      ce('div', { style: { marginTop: 12, fontSize: 11, color: 'var(--ink-4)' } }, '本地：http://127.0.0.1:7890/mcp · 公网使用当前域名'),
    );
  } else if (curTab === '⑦GitHub') {
    panel = Sec('⑦ GitHub 同步', '备份 + 导入恢复',
      github ? ce('div', null,
        Row('状态', Badge(github.configured, ['已配置','未配置'])),
        github.repo ? Row('Repo', ce('span', null, github.repo)) : null,
        github.last_sync ? Row('上次同步', ce('span', null, github.last_sync)) : null,
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 6 } },
          Btn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); sm('同步已触发'); }),
          Btn('从 GitHub 导入', '', async function() { if (!confirm('导入覆盖同名记忆？')) return; await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); sm('导入已触发'); }),
        ),
        ce('div', { style: { marginTop: 12 } },
          Btn('配置 GitHub', '', async function() {
            var token = window.prompt('GitHub Token：', ''); if (token === null) return;
            var repo = window.prompt('仓库 (owner/repo)：', ''); if (repo === null) return;
            var branch = window.prompt('分支：', 'main'); if (branch === null) return;
            await fetch('/api/github/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: token, repo: repo, branch: branch }), credentials: 'include' });
            sm('配置已保存'); setTimeout(function() { location.reload(); }, 800);
          }),
          Btn('验证连接', '', async function() {
            var r = await fetch('/api/github/validate', { method: 'POST', credentials: 'include' });
            var d = await r.json(); alert(d.ok ? '连接成功' : '失败: ' + (d.error || ''));
          }, { marginLeft: 8 }),
        ),
      ) : null,
    );
  } else if (curTab === '⑧危险区') {
    panel = Sec('⑧ 危险区', '导出 / 回收站 / 清理',
      ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 } },
        ce('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部 ZIP'),
        ce('a', { href: '/v2/console/trash/', className: 'st-btn' }, '回收站'),
        Btn('清空回收站', 'danger', async function() { if (!confirm('永久删除？')) return; await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' }); sm('已清空'); }),
      ),
      ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 } },
        Btn('检查重复桶', '', async function() {
          var r = await fetch('/api/duplicates', { credentials: 'include' });
          var d = await r.json();
          alert((d.pairs || []).length + ' 对重复桶');
        }),
        Btn('进入清理模式', 'danger', async function() { if (!confirm('清理模式允许批量永久删除？')) return; sm('请用旧版 Dashboard → ⑧ 危险区 → 进入清理模式'); }),
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
          return ce('button', { key: t, className: curTab === t ? 'on' : '', onClick: function() { setTab(t); } }, t);
        }),
      ),
      panel,
    ),
  );
}

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
