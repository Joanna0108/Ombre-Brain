// ============================================================
// Ombre Brain v2 — 全局鉴权注入 (所有 v2 页面在 <head> 最前加载)
// ------------------------------------------------------------
// 适配当前项目 cookie-session 认证:
//   1. 页面加载时检查 /auth/status, 未登录则弹出密码输入框
//   2. 调用 /auth/login 获取 session token 存入 localStorage
//   3. 包 fetch / XMLHttpRequest, 给 /api/* + /mcp 请求自动带 X-Admin-Token
//   4. 后端 _is_authenticated 同时接受 cookie 和 X-Admin-Token header
// ============================================================
(function () {
  if (window.__obAuthPatched) return;
  window.__obAuthPatched = true;

  var KEY = 'ombre-admin-token';

  function getToken() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setToken(t) {
    try { localStorage.setItem(KEY, t); } catch (e) {}
  }

  function clearToken() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }

  // 需要鉴权的请求: /api/* 或 /mcp
  function needsToken(url) {
    if (!url || typeof url !== 'string') return false;
    return /(^|\/)(api|mcp)(\/|$|\?|#)/.test(url);
  }

  function urlOf(input) {
    try {
      if (typeof input === 'string') return input;
      if (input && typeof input.url === 'string') return input.url;
    } catch (e) {}
    return '';
  }

  // ============================================================
  // 登录流程 — 调用 /auth/login, 拿到 session token 存 localStorage
  // ============================================================
  var _loginBusy = false;

  async function doLogin(password) {
    if (_loginBusy) return false;
    _loginBusy = true;
    try {
      var resp = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password }),
        credentials: 'include'
      });
      if (!resp.ok) return false;
      var data = await resp.json();
      if (data.ok && data.token) {
        setToken(data.token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    } finally {
      _loginBusy = false;
    }
  }

  async function checkAuth() {
    try {
      var resp = await fetch('/auth/status', { credentials: 'include' });
      var data = await resp.json();
      if (data.authenticated) {
        // 已经有有效 session cookie, 尝试同步 token 到 localStorage
        // (cookie 是 httponly 的, 读不到值; 但 X-Admin-Token 需要 localStorage 里有值。
        //  如果 localStorage 里没有 token, 后续请求纯靠 cookie 也能过。
        //  如果已经有 localStorage token, 直接用。)
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // 显示登录弹窗 (轻量密码 prompt — 后续可视需求替换为 styled overlay)
  async function showLoginPrompt() {
    if (window.__obAuthPrompting) return false;
    window.__obAuthPrompting = true;
    try {
      var password = window.prompt(
        'Ombre Brain\n请输入 Dashboard 密码:',
        ''
      );
      if (password && password.trim()) {
        var ok = await doLogin(password.trim());
        if (ok) return true;
        alert('密码错误, 请重试。');
      }
      return false;
    } finally {
      window.__obAuthPrompting = false;
    }
  }

  // 页面加载时检查 auth
  (async function initAuth() {
    var authed = await checkAuth();
    if (!authed) {
      // 尝试登录
      var ok = await showLoginPrompt();
      if (ok) {
        location.reload();
      }
      // 如果取消或失败, 不刷新 — 页面会显示空白/loading, 401 时会再次弹出
    }
  })();

  // ============================================================
  // 包 fetch — 自动注入 X-Admin-Token
  // ============================================================
  var _fetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url = urlOf(input);
    var need = needsToken(url);

    if (need) {
      var token = getToken();
      if (token) {
        init = init || {};
        var h = new Headers(init.headers || {});
        if (!h.has('X-Admin-Token')) h.set('X-Admin-Token', token);
        init.headers = h;
      }
      // credentials: 'include' 确保 cookie 也会随请求发送 (后端同时接受 cookie 和 header)
      if (init) {
        init.credentials = init.credentials || 'include';
      } else {
        init = { credentials: 'include' };
      }
    }

    return _fetch(input, init).then(function (res) {
      if (res && res.status === 401 && need && !window.__obAuthPrompting) {
        // token 过期或无效, 清掉旧 token, 弹出登录
        clearToken();
        showLoginPrompt().then(function (ok) {
          if (ok) location.reload();
        });
      }
      return res;
    });
  };

  // ============================================================
  // 包 XMLHttpRequest — 同样注入 X-Admin-Token
  // ============================================================
  try {
    var XHR = window.XMLHttpRequest;
    if (XHR && XHR.prototype && XHR.prototype.open && XHR.prototype.send) {
      var _open = XHR.prototype.open;
      var _send = XHR.prototype.send;
      XHR.prototype.open = function (method, url) {
        try { this.__obUrl = url; } catch (e) {}
        // 默认带上 cookie
        try { this.withCredentials = true; } catch (e) {}
        return _open.apply(this, arguments);
      };
      XHR.prototype.send = function () {
        try {
          if (needsToken(this.__obUrl)) {
            var t = getToken();
            if (t) {
              try { this.setRequestHeader('X-Admin-Token', t); } catch (e) {}
            }
          }
        } catch (e) {}
        return _send.apply(this, arguments);
      };
    }
  } catch (e) {}
})();
