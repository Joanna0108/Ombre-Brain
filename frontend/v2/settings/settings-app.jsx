// ============================================================
// settings-app.jsx — Ombre Brain 高级设置
// Tabs: 系统 / 隧道 / GitHub / Embedding / LLM / 回收站
// ============================================================

const { useState, useEffect } = React;

const NAV = `<nav class="st-topbar">
<a href="/v2/" class="st-brand">Ombre Brain</a>
<span class="st-nav-group"><a href="/v2/cells/">Cells</a><a href="/v2/console/breath/">Breath</a><a href="/v2/network/">记忆网络</a><a href="/v2/calendar/">日历</a><a href="/v2/">时间线</a></span><span class="st-nav-divider"></span>
<span class="st-nav-group"><a href="/v2/mood/">情绪</a><a href="/v2/replay/">Replay</a><a href="/v2/plans/">计划</a><a href="/v2/letters/">信</a><a href="/v2/anchors/">锚点</a></span><span class="st-nav-divider"></span>
<span class="st-nav-group"><a href="/v2/console/import/">导入</a><a href="/v2/logs/">日志</a><a href="/v2/settings/" class="on">设置</a><a href="/v2/about/">关于</a></span>
</nav>`;

const TABS = ['系统','LLM','隧道','GitHub','Embedding','回收站'];

// ============================================================
function SettingsApp() {
  const [tab, setTab] = useState('系统');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [tunnel, setTunnel] = useState(null);
  const [github, setGithub] = useState(null);
  const [embStatus, setEmbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, cr, tr, gr, er] = await Promise.all([
        fetch('/api/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/config', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/tunnel/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/github/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/embedding/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
      ]);
      setStatus(sr); setConfig(cr); setTunnel(tr); setGithub(gr); setEmbStatus(er);
    } catch (e) { setMsg('加载失败: ' + e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  // ============================================================
  return React.createElement('div', null,
    React.createElement('div', { dangerouslySetInnerHTML: { __html: NAV } }),
    React.createElement('div', { className: 'st-page' },
      React.createElement('div', { className: 'st-hd' },
        React.createElement('h1', null, '⚙️ 设置'),
      ),
      React.createElement('div', { className: 'st-tabs' },
        TABS.map(t => React.createElement('button', { key: t, className: tab === t ? 'on' : '', onClick: () => setTab(t) }, t)),
      ),
      msg && React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--rose)', marginBottom: 12 } }, msg),
      loading && React.createElement('div', { className: 'st-loading' }, '加载中…'),

      // ======================== 系统 ========================
      tab === '系统' && status && React.createElement('div', null,
        React.createElement(Section, { title: '系统状态', sub: 'System Health' },
          React.createElement('div', { className: 'st-row' }, 'Buckets: ' + ((status.buckets) || (status.permanent_count + status.dynamic_count) || '…')),
          React.createElement('div', { className: 'st-row' }, 'Decay Engine: ' + React.createElement('span', { className: 'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off') }, status.decay_engine || 'unknown')),
          React.createElement('div', { className: 'st-row' }, 'Version: ' + (status.version || '—')),
        ),
        React.createElement(Section, { title: '快速链接', sub: 'Quick Links' },
          React.createElement('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
            React.createElement('a', { href: '/dashboard', className: 'st-btn' }, '旧版 Dashboard'),
            React.createElement('a', { href: '/api/heartbeat', className: 'st-btn' }, '心跳检查'),
            React.createElement('a', { href: '/health', className: 'st-btn' }, '健康检查'),
          ),
        ),
      ),

      // ======================== LLM ========================
      tab === 'LLM' && config && React.createElement('div', null,
        React.createElement(Section, { title: 'Dehydration (摘要/打标)', sub: 'LLM 配置' },
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Model'), React.createElement('span', { style: { fontSize: 13 } }, (config.dehydration && config.dehydration.model) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Base URL'), React.createElement('span', { style: { fontSize: 12, fontFamily: 'var(--mono)' } }, (config.dehydration && config.dehydration.base_url) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'API Key'), React.createElement('span', { style: { fontSize: 12 } }, (config.dehydration && config.dehydration.api_key_masked) || '未设置')),
        ),
        React.createElement(Section, { title: 'Embedding 配置', sub: '向量检索' },
          React.createElement('div', { className: 'st-row' }, 'Enabled: ' + React.createElement('span', { className: 'st-status ' + ((config.embedding && config.embedding.enabled) ? 'on' : 'off') }, (config.embedding && config.embedding.enabled) ? 'ON' : 'OFF')),
          React.createElement('div', { className: 'st-row' }, 'Model: ' + ((config.embedding && config.embedding.model) || '—')),
        ),
        (config.merge_threshold != null) && React.createElement(Section, { title: '合并策略', sub: 'Merge' },
          React.createElement('div', { className: 'st-row' }, 'Merge Threshold: ' + config.merge_threshold),
        ),
      ),

      // ======================== 隧道 ========================
      tab === '隧道' && React.createElement('div', null,
        React.createElement(Section, { title: 'Cloudflare Tunnel', sub: '公网穿透' },
          tunnel ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ' + React.createElement('span', { className: 'st-status ' + (tunnel.running ? 'on' : 'off') }, tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置'))),
            tunnel.url && React.createElement('div', { className: 'st-row' }, 'URL: ' + React.createElement('code', { style: { fontSize: 12 } }, tunnel.url)),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              tunnel.running
                ? React.createElement('button', { className: 'st-btn danger', onClick: async () => { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '停止隧道')
                : React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '启动隧道'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载隧道状态…'),
        ),
      ),

      // ======================== GitHub ========================
      tab === 'GitHub' && React.createElement('div', null,
        React.createElement(Section, { title: 'GitHub Sync', sub: '自动备份 + 导入' },
          github ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ' + React.createElement('span', { className: 'st-status ' + (github.configured ? 'on' : 'off') }, github.configured ? '已配置' : '未配置')),
            github.repo && React.createElement('div', { className: 'st-row' }, 'Repo: ' + github.repo),
            github.last_sync && React.createElement('div', { className: 'st-row' }, '上次同步: ' + github.last_sync),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '手动同步'),
              React.createElement('button', { className: 'st-btn', onClick: async () => { await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '从 GitHub 导入'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载 GitHub 状态…'),
        ),
      ),

      // ======================== Embedding ========================
      tab === 'Embedding' && React.createElement('div', null,
        React.createElement(Section, { title: 'Embedding Engine', sub: '向量存储与检索' },
          embStatus ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'Enabled: ' + React.createElement('span', { className: 'st-status ' + (embStatus.enabled ? 'on' : 'off') }, embStatus.enabled ? 'ON' : 'OFF')),
            embStatus.model && React.createElement('div', { className: 'st-row' }, 'Model: ' + embStatus.model),
            embStatus.total_embeddings != null && React.createElement('div', { className: 'st-row' }, '已索引: ' + embStatus.total_embeddings + ' 条'),
            embStatus.db_path && React.createElement('div', { className: 'st-row' }, 'DB: ' + React.createElement('code', { style: { fontSize: 11 } }, embStatus.db_path)),
            React.createElement('div', { style: { display: 'flex', gap: 8, marginTop: 12 } },
              React.createElement('button', { className: 'st-btn primary', onClick: async () => { await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); fetchAll(); } }, '补全索引'),
            ),
          ) : React.createElement('div', { className: 'st-loading' }, '加载 Embedding 状态…'),
        ),
      ),

      // ======================== 回收站 ========================
      tab === '回收站' && React.createElement('div', null,
        React.createElement(Section, { title: '回收站', sub: '已删除的记忆' },
          React.createElement('div', { style: { fontSize: 13, color: 'var(--ink-dim)', marginBottom: 12 } }, '管理已删除的记忆 — 恢复或永久删除'),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('a', { href: '/v2/console/trash/', className: 'st-btn primary' }, '打开回收站'),
            React.createElement('button', { className: 'st-btn danger', onClick: async () => {
              if (confirm('确定要清空回收站吗？此操作不可撤销。')) {
                await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' });
                fetchAll();
              }
            } }, '清空回收站'),
          ),
        ),
      ),
    ),
  );
}

// ============================================================
function Section({ title, sub, children }) {
  return React.createElement('div', { className: 'st-section' },
    React.createElement('h3', null, title),
    sub && React.createElement('div', { className: 'st-sub' }, sub),
    children,
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SettingsApp));
