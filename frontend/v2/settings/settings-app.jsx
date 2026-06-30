// ============================================================
// settings-app.jsx — Ombre Brain 高级设置
// Tabs: 系统 / 隧道 / GitHub / Embedding / LLM / 回收站
// ============================================================

const { useState, useEffect } = React;

const TABS = ['系统','LLM','隧道','GitHub','Embedding','回收站'];

// ============================================================
function SettingsApp() {
  const [tab, setTab] = useState('系统');
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  const [tunnel, setTunnel] = useState(null);
  const [github, setGithub] = useState(null);
  const [embStatus, setEmbStatus] = useState(null);
  const [bucketsData, setBucketsData] = useState([]);
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');
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
      if (br.ok) {
        const bd = await br.json();
        setBucketsData(Array.isArray(bd) ? bd : []);
      }
    } catch (e) { setMsg('加载失败: ' + e.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
  }, [dark]);

  // ============================================================
  return (
    <div>
      <window.SharedTopBar data={bucketsData} dark={dark} onDark={setDark} />
      <window.SharedNav active="settings" />

      <div className="st-page">
        <div className="st-hd">
          <h1>⚙️ 设置</h1>
        </div>
        <div className="st-tabs">
          {TABS.map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>)}
        </div>
        {msg && <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--rose)', marginBottom: 12 }}>{msg}</div>}
        {loading && <div className="st-loading">加载中…</div>}

        {/* ======================== 系统 ======================== */}
        {tab === '系统' && status && <div>
          <Section title="系统状态" sub="System Health">
            <div className="st-row">Buckets: {(status.buckets) || (status.permanent_count + status.dynamic_count) || '…'}</div>
            <div className="st-row">Decay Engine: <span className={'st-status ' + (status.decay_engine === 'running' ? 'on' : 'off')}>{status.decay_engine || 'unknown'}</span></div>
            <div className="st-row">Version: {status.version || '—'}</div>
          </Section>
          <Section title="快速链接" sub="Quick Links">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a href="/dashboard" className="st-btn">旧版 Dashboard</a>
              <a href="/api/heartbeat" className="st-btn">心跳检查</a>
              <a href="/health" className="st-btn">健康检查</a>
            </div>
          </Section>
        </div>}

        {/* ======================== LLM ======================== */}
        {tab === 'LLM' && config && <div>
          <Section title="Dehydration (摘要/打标)" sub="LLM 配置">
            <div className="st-row"><label>Model</label><span style={{ fontSize: 13 }}>{(config.dehydration && config.dehydration.model) || '—'}</span></div>
            <div className="st-row"><label>Base URL</label><span style={{ fontSize: 12, fontFamily: 'var(--mono)' }}>{(config.dehydration && config.dehydration.base_url) || '—'}</span></div>
            <div className="st-row"><label>API Key</label><span style={{ fontSize: 12 }}>{(config.dehydration && config.dehydration.api_key_masked) || '未设置'}</span></div>
          </Section>
          <Section title="Embedding 配置" sub="向量检索">
            <div className="st-row">Enabled: <span className={'st-status ' + ((config.embedding && config.embedding.enabled) ? 'on' : 'off')}>{(config.embedding && config.embedding.enabled) ? 'ON' : 'OFF'}</span></div>
            <div className="st-row">Model: {(config.embedding && config.embedding.model) || '—'}</div>
          </Section>
          {(config.merge_threshold != null) && <Section title="合并策略" sub="Merge">
            <div className="st-row">Merge Threshold: {config.merge_threshold}</div>
          </Section>}
        </div>}

        {/* ======================== 隧道 ======================== */}
        {tab === '隧道' && <div>
          <Section title="Cloudflare Tunnel" sub="公网穿透">
            {tunnel ? <div>
              <div className="st-row">状态: <span className={'st-status ' + (tunnel.running ? 'on' : 'off')}>{tunnel.running ? '运行中' : (tunnel.configured ? '已配置(未启动)' : '未配置')}</span></div>
              {tunnel.url && <div className="st-row">URL: <code style={{ fontSize: 12 }}>{tunnel.url}</code></div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {tunnel.running
                  ? <button className="st-btn danger" onClick={async () => { await fetch('/api/tunnel/stop', { method: 'POST', credentials: 'include' }); fetchAll(); }}>停止隧道</button>
                  : <button className="st-btn primary" onClick={async () => { await fetch('/api/tunnel/start', { method: 'POST', credentials: 'include' }); fetchAll(); }}>启动隧道</button>}
              </div>
            </div> : <div className="st-loading">加载隧道状态…</div>}
          </Section>
        </div>}

        {/* ======================== GitHub ======================== */}
        {tab === 'GitHub' && <div>
          <Section title="GitHub Sync" sub="自动备份 + 导入">
            {github ? <div>
              <div className="st-row">状态: <span className={'st-status ' + (github.configured ? 'on' : 'off')}>{github.configured ? '已配置' : '未配置'}</span></div>
              {github.repo && <div className="st-row">Repo: {github.repo}</div>}
              {github.last_sync && <div className="st-row">上次同步: {github.last_sync}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="st-btn primary" onClick={async () => { await fetch('/api/github/sync', { method: 'POST', credentials: 'include' }); fetchAll(); }}>手动同步</button>
                <button className="st-btn" onClick={async () => { await fetch('/api/github/import', { method: 'POST', credentials: 'include' }); fetchAll(); }}>从 GitHub 导入</button>
              </div>
            </div> : <div className="st-loading">加载 GitHub 状态…</div>}
          </Section>
        </div>}

        {/* ======================== Embedding ======================== */}
        {tab === 'Embedding' && <div>
          <Section title="Embedding Engine" sub="向量存储与检索">
            {embStatus ? <div>
              <div className="st-row">Enabled: <span className={'st-status ' + (embStatus.enabled ? 'on' : 'off')}>{embStatus.enabled ? 'ON' : 'OFF'}</span></div>
              {embStatus.model && <div className="st-row">Model: {embStatus.model}</div>}
              {embStatus.total_embeddings != null && <div className="st-row">已索引: {embStatus.total_embeddings} 条</div>}
              {embStatus.db_path && <div className="st-row">DB: <code style={{ fontSize: 11 }}>{embStatus.db_path}</code></div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="st-btn primary" onClick={async () => { await fetch('/api/embedding/backfill', { method: 'POST', credentials: 'include' }); fetchAll(); }}>补全索引</button>
              </div>
            </div> : <div className="st-loading">加载 Embedding 状态…</div>}
          </Section>
        </div>}

        {/* ======================== 回收站 ======================== */}
        {tab === '回收站' && <div>
          <Section title="回收站" sub="已删除的记忆">
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>管理已删除的记忆 — 恢复或永久删除</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href="/v2/console/trash/" className="st-btn primary">打开回收站</a>
              <button className="st-btn danger" onClick={async () => {
                if (confirm('确定要清空回收站吗？此操作不可撤销。')) {
                  await fetch('/api/trash/empty', { method: 'POST', credentials: 'include' });
                  fetchAll();
                }
              }}>清空回收站</button>
            </div>
          </Section>
        </div>}
      </div>
    </div>
  );
}

// ============================================================
function Section({ title, sub, children }) {
  return (
    <div className="st-section">
      <h3>{title}</h3>
      {sub && <div className="st-sub">{sub}</div>}
      {children}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SettingsApp />);
