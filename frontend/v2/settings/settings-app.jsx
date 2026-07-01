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
  return ce('button', { className: 'st-btn' + (cls ? ' ' + cls : ''), onClick: onClick, type: 'button' }, label);
}
function Badge(on, labels) {
  var ll = labels || ['ON','OFF'];
  return ce('span', { className: 'st-status ' + (on ? 'on' : 'off') }, on ? ll[0] : ll[1]);
}
var inpStyle = { padding: '6px 10px', border: '0.5px solid var(--line-2)', borderRadius: 6, fontSize: 13, background: 'var(--bg)', color: 'var(--ink)' };
function Inp(props) {
  return ce('input', Object.assign({ type: 'text', style: Object.assign({}, inpStyle, { flex: 1 }, props.style || {}) }, props));
}
function Pwd(props) {
  return ce('input', Object.assign({ type: 'password', style: Object.assign({}, inpStyle, { flex: 1 }, props.style || {}) }, props));
}
function Sel(opts, choices) {
  return ce('select', { value: opts.value || '', onChange: opts.onChange,
    style: Object.assign({}, inpStyle, { flex: 1 }, opts.style || {}),
  }, choices.map(function(c) { return ce('option', { key: c.v, value: c.v }, c.label); }));
}

function showMsg(setMsg, txt) { setMsg(txt); setTimeout(function() { setMsg(''); }, 3000); }

var DEHY_PRESETS = [
  { v: 'deepseek', label: 'DeepSeek (deepseek-chat)' },
  { v: 'gemini', label: 'Gemini (gemini-2.5-flash-lite)' },
  { v: 'siliconflow', label: 'SiliconFlow (DeepSeek-V3)' },
  { v: 'anthropic', label: 'Anthropic (claude-haiku)' },
  { v: 'custom', label: '自定义' },
];
var EMB_PRESETS = [
  { v: 'gemini', label: 'Gemini (gemini-embedding-001)' },
  { v: 'siliconflow', label: 'SiliconFlow (BAAI/bge-m3)' },
  { v: 'ollama', label: 'Ollama 本地 (bge-m3)' },
  { v: 'custom', label: '自定义' },
];
var TABS = ['⓪版本','①我','②服务','③引擎','④桶行为','⑥MCP','⑦GitHub','⑧危险区'];

function SettingsApp(opts) {
  var embedded = opts && opts.embedded;
  var _s = useSt(null), status = _s[0], setStatus = _s[1];
  var _c = useSt(null), config = _c[0], setConfig = _c[1];
  var _t = useSt(null), tunnel = _t[0], setTunnel = _t[1];
  var _g = useSt(null), github = _g[0], setGithub = _g[1];
  var _e = useSt(null), embInfo = _e[0], setEmbInfo = _e[1];
  var _sm = useSt(null), sampling = _sm[0], setSampling = _sm[1];
  var _h = useSt(''), humanName = _h[0], setHumanName = _h[1];
  var _v = useSt(''), hostVault = _v[0], setHostVault = _v[1];
  var _b = useSt([]), bucketsData = _b[0], setBucketsData = _b[1];
  var _d = useSt(false), dark = _d[0], setDark = _d[1];
  var _l = useSt(true), loading = _l[0], setLoading = _l[1];
  var _m = useSt(''), msg = _m[0], setMsg = _m[1];
  var _n = useSt(null), version = _n[0], setVersion = _n[1];
  var _o = useSt(null), localEmb = _o[0], setLocalEmb = _o[1];
  var _tab = useSt('⓪版本'), curTab = _tab[0], setTab = _tab[1];

  // Form state — single object for all editable fields
  var _f = useSt({}), form = _f[0], setForm = _f[1];
  function setF(key, val) { setForm(function(prev) { var n = {}; n[key] = val; return Object.assign({}, prev, n); }); }

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
      // Init form defaults from config
      if (r[1]) {
        var dd = r[1].dehydration || {};
        // Detect matching preset
        var dm = dd.model || '', du = dd.base_url || '';
        var dPreset = 'custom';
        if (dm === 'deepseek-chat' && du.indexOf('deepseek') >= 0) dPreset = 'deepseek';
        else if (dm === 'gemini-2.5-flash-lite') dPreset = 'gemini';
        else if (dm === 'deepseek-ai/DeepSeek-V3' && du.indexOf('siliconflow') >= 0) dPreset = 'siliconflow';
        else if (dm.indexOf('claude') >= 0) dPreset = 'anthropic';
        var em = (r[1].embedding || {}).model || '';
        var ePreset = 'custom';
        if (em === 'gemini-embedding-001') ePreset = 'gemini';
        else if (em === 'BAAI/bge-m3' && ((r[1].embedding || {}).backend || '') === 'ollama') ePreset = 'ollama';
        else if (em === 'BAAI/bge-m3') ePreset = 'siliconflow';
        setForm(Object.assign({}, form, {
          dehyPreset: dPreset, dehyModel: dm, dehyUrl: du, dehyTokens: dd.max_tokens || 1024, dehyTemp: dd.temperature || 0.1,
          embPreset: ePreset, embModel: em, embUrl: (r[1].embedding || {}).base_url || '', mergeThresh: r[1].merge_threshold || 75,
          breathResults: (r[1].surfacing || {}).breath_max_results || 20, breathTokens: (r[1].surfacing || {}).breath_max_tokens || 10000,
        }));
      }
    }).catch(function() {}).finally(function() { setLoading(false); });
  }, []);

  if (loading) {
    if (embedded) return ce('div', { className: 'st-loading' }, '加载设置…');
    return ce('div', null,
      ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
      ce(window.SharedNav, { active: 'settings' }),
      ce('div', { className: 'st-loading' }, '加载设置…'),
    );
  }

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
          var r = await fetch('/api/do-update', { method: 'POST', credentials: 'include' });
          alert(r.ok ? '更新已触发' : '更新失败');
        }),
      ),
    );
  } else if (curTab === '①我') {
    panel = Sec('① 我', '个人信息 / 密码 / Tunnel / 登出',
      Row('称呼', Inp({ value: humanName, onChange: function(ev) { setHumanName(ev.target.value); }, placeholder: '人类' }),
        Btn('保存', 'primary', async function() {
          await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' }); sm('已保存');
        }),
      ),
      Btn('同步旧称呼', '', async function() {
        var old = window.prompt('要替换的旧称呼：', ''); if (!old) return;
        await fetch('/api/settings/human/sync-existing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ old_name: old }), credentials: 'include' }); sm('已替换');
      }),
      ce('div', { style: { marginTop: 12 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 4 } }, '账户密码'),
        Btn('修改密码', '', async function() {
          var cur = window.prompt('当前密码：', ''); if (!cur) return;
          var nw = window.prompt('新密码（≥6位）：', ''); if (!nw || nw.length < 6) { alert('至少6位'); return; }
          var cf = window.prompt('确认新密码：', ''); if (nw !== cf) { alert('不一致'); return; }
          var r = await fetch('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: cur, new: nw }), credentials: 'include' });
          var d = await r.json(); sm(d.ok ? '密码已修改' : '失败: ' + d.error);
        }),
        Btn('安全问题', '', async function() {
          var q = window.prompt('安全问题：', ''); if (!q) return;
          var a = window.prompt('答案：', ''); if (!a) return;
          var r = await fetch('/auth/security-question', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, answer: a }), credentials: 'include' });
          var d = await r.json(); sm(d.ok ? '已设置' : '失败: ' + d.error);
        }, { marginLeft: 8 }),
      ),
      tunnel ? ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 4 } }, 'Cloudflare Tunnel · ' + (tunnel.running ? '运行中' : (tunnel.configured ? '已配置' : '未配置')) + (tunnel.url ? ' · ' + tunnel.url : '')),
        ce('div', { style: { display: 'flex', gap: 8 } },
          Btn(tunnel.running ? '停止' : '启动', tunnel.running ? 'danger' : 'primary', async function() {
            await fetch('/api/tunnel/' + (tunnel.running ? 'stop' : 'start'), { method: 'POST', credentials: 'include' }); location.reload();
          }),
          Btn('配置 Token', '', async function() {
            var tok = window.prompt('Tunnel Token：', ''); if (!tok) return;
            await fetch('/api/tunnel/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tok }), credentials: 'include' }); sm('已保存');
          }),
        ),
      ) : null,
      ce('div', { style: { marginTop: 16 } }, Btn('退出登录', 'danger', function() { if (confirm('退出？')) { fetch('/auth/logout', { method: 'POST', credentials: 'include' }); location.reload(); } })),
    );
  } else if (curTab === '②服务') {
    panel = Sec('② 服务', 'Service Status',
      status ? ce('div', null,
        Row('Buckets', ce('span', null, '' + (status.buckets || (status.permanent_count + status.dynamic_count) || '…'))),
        Row('Decay', Badge(status.decay_engine === 'running', ['运行中','停止'])),
      ) : null,
      ce('div', { style: { marginTop: 8 } }, Btn('修复钉选计数', '', async function() {
        if (!confirm('检查并修复孤儿固化桶？')) return;
        var r = await fetch('/api/maintenance/fix-pinned-desync', { credentials: 'include' }); var d = await r.json(); sm((d.fixed || 0) + ' 个已修复');
      })),
      ce('div', { style: { marginTop: 16 } },
        ce('div', { className: 'st-sub', style: { marginBottom: 4 } }, '宿主机目录 (Docker)'),
        Row('路径', Inp({ value: hostVault, onChange: function(ev) { setHostVault(ev.target.value); }, placeholder: '/Users/you/Obsidian' }),
          Btn('保存', 'primary', async function() {
            await fetch('/api/host-vault', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: hostVault }), credentials: 'include' }); sm('已保存');
          }),
        ),
      ),
    );
  } else if (curTab === '③引擎') {
    var dehy = (config && config.dehydration) || {};
    panel = Sec('③ 引擎', '脱水 LLM / 向量化 Embedding / 本地模型',
      // -- Dehydration --
      ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 8 } }, '脱水 / 打标 LLM'),
      Row('预设', Sel({ value: form.dehyPreset || '', onChange: function(ev) {
        setF('dehyPreset', ev.target.value);
        var p = { deepseek: { m: 'deepseek-chat', u: 'https://api.deepseek.com/v1' }, gemini: { m: 'gemini-2.5-flash-lite', u: 'https://generativelanguage.googleapis.com/v1beta/openai/' }, siliconflow: { m: 'deepseek-ai/DeepSeek-V3', u: 'https://api.siliconflow.cn/v1' }, anthropic: { m: 'claude-3-5-haiku-latest', u: 'https://api.anthropic.com' } };
        var x = p[ev.target.value]; if (x) { setF('dehyModel', x.m); setF('dehyUrl', x.u); }
      } }, DEHY_PRESETS)),
      Row('Model', Inp({ value: form.dehyModel || dehy.model || '', onChange: function(ev) { setF('dehyModel', ev.target.value); setF('dehyPreset', 'custom'); }, placeholder: 'deepseek-chat' }),
        Btn('获取', '', async function() {
          var r = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}), credentials: 'include' });
          var d = await r.json(); alert(d.models ? '可用:\n' + d.models.join('\n') : '失败: ' + JSON.stringify(d));
        }),
      ),
      Row('Base URL', Inp({ value: form.dehyUrl || dehy.base_url || '', onChange: function(ev) { setF('dehyUrl', ev.target.value); setF('dehyPreset', 'custom'); }, style: { fontFamily: 'var(--mono)', fontSize: 11 } })),
      Row('API Key', Pwd({ value: form.dehyKeyShow || dehy.api_key_masked || '', onFocus: function() { setF('dehyKeyShow', ''); }, onChange: function(ev) { setF('dehyKey', ev.target.value); setF('dehyKeyShow', ev.target.value); }, placeholder: dehy.api_key_masked || '留空 = 不修改' }),
        Btn('保存', '', async function() { if (!form.dehyKey) return; await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { OMBRE_COMPRESS_API_KEY: form.dehyKey } }), credentials: 'include' });
          var v = form.dehyKey, m = v.length > 3 ? v[0] + '***' + v[v.length-1] : '***'; setF('dehyKeyShow', m); sm('Key 已保存'); }),
        Btn('测试', '', async function() { var r = await fetch('/api/test/dehydration', { method: 'POST', credentials: 'include' }); var d = await r.json(); alert(d.ok ? 'OK' : 'FAIL: ' + (d.error || '')); }),
      ),
      Row('Max Tokens', ce('input', { type: 'number', value: form.dehyTokens || dehy.max_tokens || 1024, onChange: function(ev) { setF('dehyTokens', parseInt(ev.target.value)); },
        min: 128, max: 8192, style: Object.assign({}, inpStyle, { width: 80, flex: 'none' }),
      }), ce('span', { style: { fontSize: 12, color: 'var(--ink-3)', marginLeft: 4 } }, 'Temp'),
        ce('input', { type: 'number', value: form.dehyTemp || dehy.temperature || 0.1, onChange: function(ev) { setF('dehyTemp', parseFloat(ev.target.value)); },
          min: 0, max: 2, step: 0.05, style: Object.assign({}, inpStyle, { width: 70, flex: 'none', marginLeft: 4 }),
        }),
      ),
      Btn('保存引擎配置', 'primary', async function() {
        var body = {};
        if (form.dehyModel) (body.dehydration = body.dehydration || {}).model = form.dehyModel;
        if (form.dehyUrl) (body.dehydration = body.dehydration || {}).base_url = form.dehyUrl;
        if (form.dehyTokens != null) (body.dehydration = body.dehydration || {}).max_tokens = form.dehyTokens;
        if (form.dehyTemp != null) (body.dehydration = body.dehydration || {}).temperature = form.dehyTemp;
        if (form.embModel) (body.embedding = body.embedding || {}).model = form.embModel;
        if (form.mergeThresh != null) body.merge_threshold = parseInt(form.mergeThresh);
        body.persist = true;
        var r = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
        var d = await r.json(); sm(d.ok ? '配置已保存' : '失败');
      }),

      // -- Embedding --
      ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginTop: 20, marginBottom: 8 } }, '向量化 Embedding'),
      embInfo ? Row('当前', ce('span', { style: { fontSize: 12 } }, (embInfo.backend || '—') + ' / ' + (embInfo.model || '—') + ' / dim ' + (embInfo.dimension || '—') + ' · 已索引 ' + (embInfo.total_embeddings != null ? embInfo.total_embeddings : '—') + ' 条 · ' + (embInfo.enabled ? '启用' : '禁用'))) : null,
      Row('预设', Sel({ value: form.embPreset || '', onChange: function(ev) {
        setF('embPreset', ev.target.value);
        var p = { gemini: { m: 'gemini-embedding-001', u: 'https://generativelanguage.googleapis.com/v1beta/openai/' }, siliconflow: { m: 'BAAI/bge-m3', u: 'https://api.siliconflow.cn/v1' }, ollama: { m: 'bge-m3', u: '' } };
        var x = p[ev.target.value]; if (x) { setF('embModel', x.m); setF('embUrl', x.u); }
      } }, EMB_PRESETS)),
      Row('Model', Inp({ value: form.embModel || '', onChange: function(ev) { setF('embModel', ev.target.value); setF('embPreset', 'custom'); }, placeholder: 'gemini-embedding-001' })),
      Row('API Key', Pwd({ value: form.embKeyShow || '', onFocus: function() { setF('embKeyShow', ''); }, onChange: function(ev) { setF('embKey', ev.target.value); setF('embKeyShow', ev.target.value); }, placeholder: '留空 = 不修改' }),
        Btn('保存', '', async function() { if (!form.embKey) return; await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { OMBRE_EMBED_API_KEY: form.embKey } }), credentials: 'include' });
          var v = form.embKey, m = v.length > 3 ? v[0] + '***' + v[v.length-1] : '***'; setF('embKeyShow', m); sm('Key 已保存'); }),
        Btn('测试', '', async function() { var r = await fetch('/api/test/embedding', { method: 'POST', credentials: 'include' }); var d = await r.json(); alert(d.ok ? 'OK' : 'FAIL: ' + (d.error || '')); }),
      ),
      ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
        Btn('补全缺失向量', 'primary', async function() { var r = await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); sm(r.ok ? '补全已启动' : '失败'); }),
        Btn('切换后端重算', '', async function() {
          var be = window.prompt('目标后端 (api/ollama)：', (embInfo && embInfo.backend) || 'api'); if (!be) return;
          if (!confirm('切换并全量重算？')) return;
          await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: be }), credentials: 'include' }); sm('迁移已启动');
        }),
      ),

      // -- Replay --
      ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginTop: 20, marginBottom: 8 } }, '🎬 Replay 人生电影旁白'),
      Row('API Key', Pwd({ value: form.replayKeyShow || '', onFocus: function() { setF('replayKeyShow', ''); }, onChange: function(ev) { setF('replayKey', ev.target.value); setF('replayKeyShow', ev.target.value); }, placeholder: '留空 = 不修改' }),
        Btn('保存', '', async function() { if (!form.replayKey) return; await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: { OMBRE_REPLAY_API_KEY: form.replayKey } }), credentials: 'include' });
          var v = form.replayKey, m = v.length > 3 ? v[0] + '***' + v[v.length-1] : '***'; setF('replayKeyShow', m); sm('Key 已保存'); }),
      ),
      Row('Base URL', Inp({ value: form.replayUrl || '', onChange: function(ev) { setF('replayUrl', ev.target.value); }, placeholder: 'https://api.deepseek.com/v1', style: { fontFamily: 'var(--mono)', fontSize: 11 } })),
      Row('Model', Inp({ value: form.replayModel || '', onChange: function(ev) { setF('replayModel', ev.target.value); }, placeholder: 'deepseek-chat' }),
        Btn('保存', '', async function() {
          var updates = {}; if (form.replayModel) updates.OMBRE_REPLAY_MODEL = form.replayModel; if (form.replayUrl) updates.OMBRE_REPLAY_BASE_URL = form.replayUrl;
          if (!Object.keys(updates).length) return;
          await fetch('/api/env-config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates: updates }), credentials: 'include' }); sm('已保存');
        }),
      ),

      // -- Local --
      localEmb ? ce('div', { style: { marginTop: 16 } },
        ce('h4', { style: { fontFamily: 'var(--serif)', fontSize: 14, marginBottom: 4 } }, '本地 Ollama / bge-m3'),
        Row('状态', Badge(localEmb.ollama_reachable, ['可达','不可达'])),
        localEmb.models && localEmb.models.length ? Row('模型', ce('span', null, localEmb.models.join(', '))) : null,
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          !localEmb.installed ? Btn('安装 Ollama', '', async function() { var r = await fetch('/api/embedding/local/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}), credentials: 'include' }); sm(r.ok ? '已启动' : '失败'); }) : null,
          localEmb.installed && !localEmb.ollama_reachable ? Btn('启动 Ollama', '', async function() { await fetch('/api/embedding/local/start', { method: 'POST', credentials: 'include' }); sm('启动中...'); }) : null,
          localEmb.ollama_reachable && !localEmb.has_model ? Btn('下载 bge-m3', '', async function() { var r = await fetch('/api/embedding/local/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'bge-m3' }), credentials: 'include' }); sm(r.ok ? '已启动' : '失败'); }) : null,
          localEmb.has_model ? Btn('切换到本地', 'primary', async function() { if (!confirm('切换？全量重算')) return; await fetch('/api/embedding/migrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_backend: 'ollama', api_format: 'ollama', model: 'bge-m3' }), credentials: 'include' }); sm('迁移已启动'); }) : null,
        ),
      ) : null,
    );
  } else if (curTab === '④桶行为') {
    panel = Sec('④ 桶行为', 'Breath 采样 / 默认参数',
      sampling ? ce('div', null,
        Row('加权采样', Badge(sampling.enabled)),
        Row('top_k (1-50)', Inp({ type: 'number', value: form.sampTopK || sampling.top_k || 10, onChange: function(ev) { setF('sampTopK', parseInt(ev.target.value)); }, style: { width: 80, flex: 'none' } })),
        Row('sample_k (1-20)', Inp({ type: 'number', value: form.sampSampleK || sampling.sample_k || 5, onChange: function(ev) { setF('sampSampleK', parseInt(ev.target.value)); }, style: { width: 80, flex: 'none' } })),
        Row('温度 (0.1-2.0)', Inp({ type: 'number', value: form.sampTemp || sampling.temperature || 0.7, onChange: function(ev) { setF('sampTemp', parseFloat(ev.target.value)); }, step: 0.1, style: { width: 80, flex: 'none' } })),
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('保存采样', 'primary', async function() {
            await fetch('/api/settings/sampling', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ enabled: sampling.enabled, top_k: form.sampTopK || sampling.top_k || 10, sample_k: form.sampSampleK || sampling.sample_k || 5, temperature: form.sampTemp || sampling.temperature || 0.7 }), credentials: 'include' });
            sm('已保存');
          }),
          Btn('试 Breath', '', async function() {
            var r = await fetch('/api/breath?n=5', { credentials: 'include' }); var d = await r.json();
            alert((d.buckets || []).map(function(b) { return b.name + ' (' + b.score + ')'; }).join('\n'));
          }),
        ),
      ) : null,
      ce('div', { style: { marginTop: 12 } },
        Row('合并阈值 (0-100)', Inp({ type: 'number', value: form.mergeThresh || (config && config.merge_threshold) || 75, onChange: function(ev) { setF('mergeThresh', parseInt(ev.target.value)); }, min: 0, max: 100, style: { width: 80, flex: 'none' } })),
        config && config.surfacing ? Row('breath 默认桶数', Inp({ type: 'number', value: form.breathResults || config.surfacing.breath_max_results || 20, onChange: function(ev) { setF('breathResults', parseInt(ev.target.value)); }, style: { width: 80, flex: 'none' } })) : null,
        config && config.surfacing ? Row('breath token 上限', Inp({ type: 'number', value: form.breathTokens || config.surfacing.breath_max_tokens || 10000, onChange: function(ev) { setF('breathTokens', parseInt(ev.target.value)); }, style: { width: 100, flex: 'none' } })) : null,
      ),
      ce('div', { style: { marginTop: 12 } }, Btn('保存配置 (写入 config.yaml)', 'primary', async function() {
        var body = { persist: true };
        if (form.mergeThresh != null) body.merge_threshold = parseInt(form.mergeThresh);
        if (form.breathResults != null) (body.surfacing = body.surfacing || {}).breath_max_results = parseInt(form.breathResults);
        if (form.breathTokens != null) (body.surfacing = body.surfacing || {}).breath_max_tokens = parseInt(form.breathTokens);
        var r = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'include' });
        var d = await r.json(); sm(d.ok ? '已保存' : '失败');
      })),
    );
  } else if (curTab === '⑥MCP') {
    panel = Sec('⑥ MCP 配置', 'Claude Desktop 连接端点',
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '主端点（5工具）')),
      ce('div', { className: 'st-row' }, ce('code', { style: { fontFamily: 'var(--mono)', fontSize: 12 } }, '/mcp-extra'), ce('span', { style: { color: 'var(--ink-3)', fontSize: 12, marginLeft: 8 } }, '副端点（剩余工具）')),
      ce('div', { style: { marginTop: 12, fontSize: 11, color: 'var(--ink-4)' } }, '本地模式：http://127.0.0.1:7890 · 公网使用当前域名'),
    );
  } else if (curTab === '⑦GitHub') {
    panel = Sec('⑦ GitHub 同步', '备份 + 导入恢复',
      github ? ce('div', null,
        Row('状态', Badge(github.configured, ['已配置','未配置'])),
        github.repo ? Row('Repo', ce('span', null, github.repo)) : null,
        github.last_sync ? Row('上次同步', ce('span', null, github.last_sync)) : null,
        ce('div', { style: { display: 'flex', gap: 8, marginTop: 8 } },
          Btn('手动同步', 'primary', async function() { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); sm('同步已触发'); }),
          Btn('从 GitHub 导入', '', async function() { if (!confirm('导入覆盖同名记忆？')) return; await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); sm('导入已触发'); }),
        ),
        ce('div', { style: { marginTop: 12 } },
          Btn('配置 GitHub', '', async function() {
            var token = window.prompt('GitHub Token：', ''); if (token === null) return;
            var repo = window.prompt('仓库 (owner/repo)：', ''); if (repo === null) return;
            var branch = window.prompt('分支：', 'main'); if (branch === null) return;
            await fetch('/api/github/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token, repo: repo, branch: branch }), credentials: 'include' });
            sm('已保存'); setTimeout(function() { location.reload(); }, 800);
          }),
          Btn('验证', '', async function() { var r = await fetch('/api/github/validate', { method: 'POST', credentials: 'include' }); var d = await r.json(); alert(d.ok ? 'OK' : 'FAIL'); }, { marginLeft: 8 }),
        ),
      ) : null,
    );
  } else if (curTab === '⑧危险区') {
    panel = Sec('⑧ 危险区', '导出 / 回收站',
      ce('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        ce('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部 ZIP'),
        ce('a', { href: '/v2/console/trash/', className: 'st-btn' }, '回收站'),
        Btn('清空回收站', 'danger', async function() { if (!confirm('永久删除？')) return; await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' }); sm('已清空'); }),
      ),
    );
  }

  var content = ce('div', { className: 'st-page' },
    ce('div', { className: 'st-hd' }, ce('h1', null, '设置')),
    msg ? ce('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--accent)', marginBottom: 8 } }, msg) : null,
    ce('div', { className: 'st-tabs' },
      TABS.map(function(t) { return ce('button', { key: t, className: curTab === t ? 'on' : '', onClick: function() { setTab(t); } }, t); }),
    ),
    panel,
  );
  if (embedded) return content;
  return ce('div', null,
    ce(window.SharedTopBar, { data: bucketsData, dark: dark, onDark: setDark }),
    ce(window.SharedNav, { active: 'settings' }),
    content,
  );
}

window.SettingsApp = SettingsApp;
var root = document.getElementById('root');
if (root && !window.__OB_SPA) ReactDOM.createRoot(root).render(ce(SettingsApp));

var root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(ce(SettingsApp));
