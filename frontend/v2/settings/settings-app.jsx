const { useState, useEffect } = React;

function SettingsApp() {
  const [tab, setTab] = useState('系统');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [tunnel, setTunnel] = useState(null);
  const [github, setGithub] = useState(null);
  const [embStatus, setEmbStatus] = useState(null);
  const [humanName, setHumanName] = useState('');
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, cr, tr, gr, er, hn, br] = await Promise.all([
        fetch('/api/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/config', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/tunnel/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/github/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/embedding/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/settings/human', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      setStatus(sr); setConfig(cr); setTunnel(tr); setGithub(gr); setEmbStatus(er);
      if (hn && hn.name) setHumanName(hn.name);
      if (br && br.ok) { const bd = await br.json(); setBucketsData(Array.isArray(bd) ? bd : []); }
    } catch (e) { setMsg('加载失败: ' + e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const showMsg = (m, isErr) => { setMsg(m); setTimeout(() => setMsg(''), isErr ? 5000 : 2000); };

  const saveHumanName = async () => {
    await fetch('/api/settings/human', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: humanName }), credentials: 'include' });
    showMsg('名称已保存');
  };

  const fetchModels = async () => {
    const dehy = (config && config.dehydration) || {};
    const base = dehy.base_url || '';
    const key = prompt('API Key (留空使用已保存的):', '');
    try {
      const r = await fetch('/api/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base_url: base, api_key: key || '' }), credentials: 'include' });
      const d = await r.json();
      if (d.models) alert('可用模型:\n' + d.models.join('\n'));
      else alert('获取失败: ' + JSON.stringify(d));
    } catch (e) { alert('获取失败: ' + e.message); }
  };

  if (loading) return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'settings' }),
    React.createElement('div', { className: 'st-loading' }, '加载中…'),
  );

  return React.createElement('div', null,
    React.createElement(window.SharedTopBar, { data: bucketsData, dark, onDark: setDark }),
    React.createElement(window.SharedNav, { active: 'settings' }),
    React.createElement('div', { className: 'st-page' },
      React.createElement('div', { className: 'st-hd' }, React.createElement('h1', null, '⚙️ 设置')),
      msg && React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: msg.includes('失败') ? 'var(--rose)' : 'var(--accent)', marginBottom: 8 } }, msg),
      React.createElement('div', { className: 'st-tabs' },
        ['系统','LLM','隧道','GitHub','Embedding','回收站'].map(t =>
          React.createElement('button', { key: t, className: tab === t ? 'on' : '', onClick: () => setTab(t) }, t)
        ),
      ),

      // ═══════ 系统 ═══════
      tab === '系统' && React.createElement('div', null,
        React.createElement(Section, { title: '个人信息', sub: 'Human Name' },
          React.createElement('div', { className: 'st-row' },
            React.createElement('label', null, '称呼'),
            React.createElement('input', { type: 'text', value: humanName, onChange: e => setHumanName(e.target.value), placeholder: '你的名字' }),
            React.createElement('button', { className: 'st-btn primary', onClick: saveHumanName }, '保存'),
          ),
        ),
        status && React.createElement(Section, { title: '系统状态', sub: 'System Health' },
          React.createElement('div', { className: 'st-row' }, 'Version: ' + (status.version || '—')),
          React.createElement('div', { className: 'st-row' }, 'Buckets: ' + ((status.buckets) || (status.permanent_count + status.dynamic_count) || '…')),
          React.createElement('div', { className: 'st-row' }, 'Decay Engine: ', React.createElement('span', { className: 'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off') }, status.decay_engine || 'unknown')),
        ),
        React.createElement(Section, { title: '导出', sub: 'Export' },
          React.createElement('a', { href: '/api/export', className: 'st-btn primary' }, '导出全部记忆 ZIP'),
          React.createElement('span', { style: { fontSize: 11, color: 'var(--ink-4)', marginLeft: 12 } }, '下载包含所有记忆的 ZIP 文件'),
        ),
        React.createElement(Section, { title: '快速链接' },
          React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            React.createElement('a', { href: '/dashboard', className: 'st-btn' }, '旧版 Dashboard'),
            React.createElement('a', { href: '/api/heartbeat', className: 'st-btn' }, '心跳检查'),
            React.createElement('a', { href: '/health', className: 'st-btn' }, '健康检查'),
          ),
        ),
      ),

      // ═══════ LLM ═══════
      tab === 'LLM' && React.createElement('div', null,
        config && React.createElement(Section, { title: 'Dehydration (摘要/打标)', sub: 'LLM 配置' },
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Model'), React.createElement('span', { style: { fontSize: 13 } }, (config.dehydration && config.dehydration.model) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Base URL'), React.createElement('span', { style: { fontSize: 12, fontFamily: 'var(--mono)' } }, (config.dehydration && config.dehydration.base_url) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'API Key'), React.createElement('span', { style: { fontSize: 12 } }, (config.dehydration && config.dehydration.api_key_masked) || '未设置')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Temperature'), React.createElement('span', { style: { fontSize: 13 } }, (config.dehydration && config.dehydration.temperature) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Max Tokens'), React.createElement('span', { style: { fontSize: 13 } }, (config.dehydration && config.dehydration.max_tokens) || '—')),
          React.createElement('div', { style: { marginTop: 8, display: 'flex', gap: 8 } },
            React.createElement('button', { className: 'st-btn', onClick: fetchModels }, '获取模型列表'),
          ),
        ),
        config && React.createElement(Section, { title: 'Embedding 配置', sub: '向量检索' },
          React.createElement('div', { className: 'st-row' }, 'Enabled: ', React.createElement('span', { className: 'st-status ' + ((config.embedding && config.embedding.enabled) ? 'on' : 'off') }, (config.embedding && config.embedding.enabled) ? 'ON' : 'OFF')),
          React.createElement('div', { className: 'st-row' }, 'Model: ' + ((config.embedding && config.embedding.model) || '—')),
        ),
        (config && config.merge_threshold != null) && React.createElement(Section, { title: '合并策略' },
          React.createElement('div', { className: 'st-row' }, 'Merge Threshold: ' + config.merge_threshold),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', padding: '0 20px', textAlign: 'center' } },
          '完整 LLM/Embedding 配置（API Key 写入、格式切换等）请使用旧版 Dashboard 的设置 → Engine 面板'
        ),
      ),

      // ═══════ 隧道 ═══════
      tab === '隧道' && React.createElement('div', null,
        React.createElement(Section, { title: 'Cloudflare Tunnel', sub: '公网穿透' },
          tunnel ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ', React.createElement('span', { className: 'st-status ' + (tunnel.running ? 'on' : 'off') }, tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置'))),
            tunnel.url && React.createElement('div', { className: 'st-row' }, 'URL: ', React.createElement('code', { style: { fontSize: 12 } }, tunnel.url)),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              tunnel.running
                ? React.createElement('button', { className: 'st-btn danger', onClick: async () => { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '停止隧道')
                : React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '启动隧道'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', padding: '0 20px', textAlign: 'center' } },
          '完整隧道配置（Token 设置、开机自启等）请使用旧版 Dashboard → 设置 → Me 面板'
        ),
      ),

      // ═══════ GitHub ═══════
      tab === 'GitHub' && React.createElement('div', null,
        React.createElement(Section, { title: 'GitHub Sync', sub: '自动备份 + 导入' },
          github ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ', React.createElement('span', { className: 'st-status ' + (github.configured ? 'on' : 'off') }, github.configured ? '已配置' : '未配置')),
            github.repo && React.createElement('div', { className: 'st-row' }, 'Repo: ' + github.repo),
            github.last_sync && React.createElement('div', { className: 'st-row' }, '上次同步: ' + github.last_sync),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); showMsg('同步已触发'); fetchAll(); } }, '手动同步'),
              React.createElement('button', { className: 'st-btn', onClick: async () => { await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); showMsg('导入已触发'); } }, '从 GitHub 导入'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', padding: '0 20px', textAlign: 'center' } },
          '完整 GitHub 配置（Token/Repo/Branch/自动同步间隔）请使用旧版 Dashboard → 设置 → GitHub Sync 面板'
        ),
      ),

      // ═══════ Embedding ═══════
      tab === 'Embedding' && React.createElement('div', null,
        React.createElement(Section, { title: 'Embedding Engine', sub: '向量存储与检索' },
          embStatus ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'Enabled: ', React.createElement('span', { className: 'st-status ' + (embStatus.enabled ? 'on' : 'off') }, embStatus.enabled ? 'ON' : 'OFF')),
            embStatus.model && React.createElement('div', { className: 'st-row' }, 'Model: ' + embStatus.model),
            embStatus.total_embeddings != null && React.createElement('div', { className: 'st-row' }, '已索引: ' + embStatus.total_embeddings + ' 条'),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); showMsg('补全已启动'); fetchAll(); } }, '补全索引'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
        React.createElement('div', { style: { fontSize: 11, color: 'var(--ink-4)', padding: '0 20px', textAlign: 'center' } },
          '完整 Embedding 管理（后端切换/本地安装/迁移）请使用旧版 Dashboard → 设置 → Engine 面板'
        ),
      ),

      // ═══════ 回收站 ═══════
      tab === '回收站' && React.createElement('div', null,
        React.createElement(Section, { title: '回收站', sub: '已删除的记忆' },
          React.createElement('div', { style: { fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 } }, '管理已删除的记忆 — 恢复或永久删除'),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('a', { href: '/v2/console/trash/', className: 'st-btn primary' }, '打开回收站'),
            React.createElement('button', { className: 'st-btn danger', onClick: async () => {
              if (confirm('确定要清空回收站吗？此操作不可撤销。')) {
                await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' });
                showMsg('回收站已清空');
                fetchAll();
              }
            } }, '清空回收站'),
          ),
        ),
      ),
    ),
  );
}

function Section({ title, sub, children }) {
  return React.createElement('div', { className: 'st-section' },
    React.createElement('h3', null, title),
    sub && React.createElement('div', { className: 'st-sub' }, sub),
    children,
  );
}

try { ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SettingsApp)); } catch(e) { console.error(e); }
