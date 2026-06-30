// ============================================================
// shared-nav.jsx — Ombre Brain v2 共享导航栏（所有模块共用）
// 提供两层导航: TopBarV2Ext (品牌+统计+主题切换) + NavBarV2Ext (14项链接)
// 在每个 index.html 中通过 <script type="text/babel" src="/v2/shared-nav.jsx"> 加载
// 使用方式: 在 app JSX 中渲染 <window.SharedTopBar data={buckets} /> 和 <window.SharedNav active="..." />
// ============================================================

// ---- TopBar (品牌行 + 统计 + 主题切换) ----
function SharedTopBar({ dark, onDark, data }) {
  const stats = data || [];
  return (
    <div className="ob-topbar">
      <div className="ob-brand">
        <span className="ob-brand-mark" />
        <span className="ob-brand-name">Ombre Brain</span>
        <div className="ob-brand-stats">
          <span><b>{stats.length}</b> 格</span>
          <span><b>{stats.filter(i => i.protected || i.pinned).length}</b> 钉决</span>
          <span><b>{stats.filter(i => i.feel || i.type === 'feel').length}</b> feel</span>
          <span><b>{stats.filter(i => i.importance >= 8 || i.highlight).length}</b> 重要</span>
        </div>
      </div>
      <div className="ob-topbar-actions">
        {window.ThemeToggle && <window.ThemeToggle />}
        <DarkToggle dark={dark} onChange={onDark} />
      </div>
    </div>
  );
}

// ---- DarkToggle (matches original ob-dark-btn style) ----
function DarkToggle({ dark, onChange }) {
  return (
    <button
      className={'ob-dark-btn' + (dark ? ' on' : '')}
      onClick={() => onChange && onChange(!dark)}
      title={dark ? '切到日间' : '切到暗夜'}
    >
      <span className="ob-dark-icon">{dark ? '☀' : '☾'}</span>
    </button>
  );
}

// ---- NavBar (14项导航链接，分三组) ----
function SharedNav({ active }) {
  const link = (href, label, id) => (
    <a key={id} href={href} className={active === id ? 'on' : ''}>{label}</a>
  );

  const divider1 = <span key="d1" style={{
    width: '0.5px', background: 'var(--line-2)',
    margin: '6px 6px', alignSelf: 'stretch'
  }} />;
  const divider2 = <span key="d2" style={{
    width: '0.5px', background: 'var(--line-2)',
    margin: '6px 6px', alignSelf: 'stretch'
  }} />;

  const group1 = [
    { id: 'cells',    href: '/v2/cells/',           label: '记忆格' },
    { id: 'breath',   href: '/v2/console/breath/',   label: 'Breath' },
    { id: 'network',  href: '/v2/network/',          label: '记忆网络' },
    { id: 'calendar', href: '/v2/calendar/',         label: '日历' },
    { id: 'timeline', href: '/v2/',                  label: '时间线' },
  ];
  const group2 = [
    { id: 'mood',     href: '/v2/mood/',             label: '情绪' },
    { id: 'replay',   href: '/v2/replay/',           label: 'Replay' },
    { id: 'plans',    href: '/v2/plans/',            label: '计划' },
    { id: 'letters',  href: '/v2/letters/',          label: '信' },
    { id: 'anchors',  href: '/v2/anchors/',          label: '锚点' },
  ];
  const group3 = [
    { id: 'import',   href: '/v2/console/import/',   label: '导入' },
    { id: 'logs',     href: '/v2/logs/',             label: '日志' },
    { id: 'settings', href: '/v2/settings/',         label: '设置' },
    { id: 'about',    href: '/v2/about/',            label: '关于' },
  ];

  return (
    <nav className="ob-nav">
      {group1.map(g => link(g.href, g.label, g.id))}
      {divider1}
      {group2.map(g => link(g.href, g.label, g.id))}
      {divider2}
      {group3.map(g => link(g.href, g.label, g.id))}
    </nav>
  );
}

// Expose to window for use by modules
window.SharedTopBar = SharedTopBar;
window.SharedNav = SharedNav;
window.DarkToggle = DarkToggle;
