const { useState, useEffect } = React;

function SettingsApp() {
  const [tab, setTab] = useState('系统');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [tunnel, setTunnel] = useState(null);
  const [github, setGithub] = useState(null);
  const [embStatus, setEmbStatus] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, cr, tr, gr, er, br] = await Promise.all([
        fetch('/api/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/config', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/tunnel/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/github/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/embedding/status', { credentials: 'include' }).then(r => r.json()).catch(() => null),
        fetch('/api/buckets', { credentials: 'include' }),
      ]);
      setStatus(sr); setConfig(cr); setTunnel(tr); setGithub(gr); setEmbStatus(er);
      if (br && br.ok) {
        const bd = await br.json();
        setBucketsData(Array.isArray(bd) ? bd : []);
      }
    } catch (e) { setMsg('加载失败: ' + e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { document.documentElement.setAttribute('data-theme', dark ? 'dark' : ''); }, [dark]);

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
      msg && React.createElement('div', { style: { textAlign: 'center', fontSize: 12, color: 'var(--rose)', marginBottom: 12 } }, msg),
      React.createElement('div', { className: 'st-tabs' },
        ['系统','LLM','隧道','GitHub','Embedding','回收站'].map(t =>
          React.createElement('button', { key: t, className: tab === t ? 'on' : '', onClick: () => setTab(t) }, t)
        )
      ),
      tab === '系统' && status && React.createElement('div', null,
        React.createElement(Section, { title: '系统状态', sub: 'System Health' },
          React.createElement('div', { className: 'st-row' }, 'Buckets: ' + ((status.buckets) || (status.permanent_count + status.dynamic_count) || '…')),
          React.createElement('div', { className: 'st-row' }, 'Decay Engine: ', React.createElement('span', { className: 'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off') }, status.decay_engine || 'unknown')),
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
      tab === 'LLM' && config && React.createElement('div', null,
        React.createElement(Section, { title: 'Dehydration', sub: 'LLM 配置' },
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Model'), React.createElement('span', { style: { fontSize: 13 } }, (config.dehydration && config.dehydration.model) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'Base URL'), React.createElement('span', { style: { fontSize: 12, fontFamily: 'var(--mono)' } }, (config.dehydration && config.dehydration.base_url) || '—')),
          React.createElement('div', { className: 'st-row' }, React.createElement('label', null, 'API Key'), React.createElement('span', { style: { fontSize: 12 } }, (config.dehydration && config.dehydration.api_key_masked) || '未设置')),
        ),
      ),
      tab === '隧道' && React.createElement('div', null,
        React.createElement(Section, { title: 'Cloudflare Tunnel', sub: '公网穿透' },
          tunnel ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ', React.createElement('span', { className: 'st-status ' + (tunnel.running ? 'on' : 'off') }, tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置'))),
            tunnel.url && React.createElement('div', { className: 'st-row' }, 'URL: ', React.createElement('code', { style: { fontSize: 12 } }, tunnel.url)),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
      ),
      tab === 'GitHub' && React.createElement('div', null,
        React.createElement(Section, { title: 'GitHub Sync', sub: '自动备份' },
          github ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, '状态: ', React.createElement('span', { className: 'st-status ' + (github.configured ? 'on' : 'off') }, github.configured ? '已配置' : '未配置')),
            github.repo && React.createElement('div', { className: 'st-row' }, 'Repo: ' + github.repo),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
      ),
      tab === 'Embedding' && React.createElement('div', null,
        React.createElement(Section, { title: 'Embedding Engine', sub: '向量检索' },
          embStatus ? React.createElement('div', null,
            React.createElement('div', { className: 'st-row' }, 'Enabled: ', React.createElement('span', { className: 'st-status ' + (embStatus.enabled ? 'on' : 'off') }, embStatus.enabled ? 'ON' : 'OFF')),
            embStatus.model && React.createElement('div', { className: 'st-row' }, 'Model: ' + embStatus.model),
          ) : React.createElement('div', { className: 'st-loading' }, '加载中…'),
        ),
      ),
      tab === '回收站' && React.createElement('div', null,
        React.createElement(Section, { title: '回收站', sub: '已删除的记忆' },
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('a', { href: '/v2/console/trash/', className: 'st-btn primary' }, '打开回收站'),
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

try {
  const root = document.getElementById('root');
  if (root) ReactDOM.createRoot(root).render(React.createElement(SettingsApp));
} catch(e) { console.error(e); document.getElementById('root').innerText = 'Error: ' + e.message; }
