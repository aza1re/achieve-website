document.addEventListener('DOMContentLoaded', () => {
  const loginEl = document.querySelector('[data-auth="login"]');
  const accountEl = document.querySelector('[data-auth="account"]');
  if (!loginEl || !accountEl) return;

  const navAuth = loginEl.closest('.nav-auth');
  const avatarEl = accountEl.querySelector('[data-avatar]');
  const avatarPreviewEl = accountEl.querySelector('[data-avatar-preview]');
  const nameEl = accountEl.querySelector('[data-name]');
  const emailEl = accountEl.querySelector('[data-email]');
  const signOutBtn = accountEl.querySelector('[data-signout]');
  const trigger = accountEl.querySelector('.account-trigger');
  let currentUserId = null;

  function showOnly(which) {
    const showLogin = which === 'login';

    // Keep both hidden-attribute + inline display for stronger enforcement
    loginEl.hidden = !showLogin;
    accountEl.hidden = showLogin;
    loginEl.style.display = showLogin ? '' : 'none';
    accountEl.style.display = showLogin ? 'none' : '';

    if (navAuth) navAuth.classList.toggle('is-authenticated', !showLogin);
  }

  function setAuthLoading(isLoading) {
    if (navAuth) navAuth.classList.toggle('is-auth-loading', isLoading);

    // During auth check, always show Sign In only
    if (isLoading) {
      showOnly('login');
      accountEl.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  }

  // Force Sign In only at startup
  setAuthLoading(true);

  function waitForAuthReady(timeout = 5000) {
    return new Promise(resolve => {
      const start = Date.now();
      const tick = () => {
        const fa = window.firebaseAuth;
        const hasListener =
          fa && (typeof fa.onAuthStateChanged === 'function'
            || (fa.auth && typeof fa.auth.onAuthStateChanged === 'function'));
        if (hasListener) return resolve(true);
        if (Date.now() - start > timeout) return resolve(false);
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  function getInitials(name) {
    if (!name) return 'AC';
    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function setAvatar(url, initials) {
    [avatarEl, avatarPreviewEl].forEach(el => {
      if (!el) return;
      if (url) {
        el.style.backgroundImage = `url("${url}")`;
        el.textContent = '';
        el.classList.add('has-photo');
      } else {
        el.style.backgroundImage = '';
        el.textContent = initials || 'AC';
        el.classList.remove('has-photo');
      }
    });
  }

  function applyUser(user) {
    currentUserId = user?.uid || null;

    if (user) {
      showOnly('account');

      const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Account');
      const email = user.email || '';
      const initials = getInitials(displayName);

      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) emailEl.textContent = email;

      setAvatar(user.photoURL, initials);
    } else {
      showOnly('login');
      setAvatar('', 'AC');
      if (nameEl) nameEl.textContent = 'Account';
      if (emailEl) emailEl.textContent = '';
    }
  }

  async function hydrateUser(user) {
    if (!user) return null;
    try {
      if (typeof user.reload === 'function') {
        await user.reload();
      }
    } catch {
      // Ignore reload failures and continue with existing values.
    }
    return (window.firebaseAuth && window.firebaseAuth.auth && window.firebaseAuth.auth.currentUser) || user;
  }

  async function initAuthUI() {
    setAuthLoading(true);

    const ready = await waitForAuthReady(7000);
    if (!ready || !window.firebaseAuth) {
      applyUser(null);
      setAuthLoading(false);
      return;
    }

    const fa = window.firebaseAuth;
    const onChange = fa.onAuthStateChanged
      || (fa.auth && fa.auth.onAuthStateChanged && fa.auth.onAuthStateChanged.bind(fa.auth));

    if (!onChange) {
      const currentUser = (fa.auth && fa.auth.currentUser) || fa.currentUser;
      applyUser(currentUser || null);
      setAuthLoading(false);
      return;
    }

    let settled = false;
    const settle = (user) => {
      applyUser(user || null);
      if (!settled) {
        settled = true;
        setAuthLoading(false);
      }
    };

    onChange(async (user) => {
      const hydrated = await hydrateUser(user);
      settle(hydrated);
    });

    // Fallback: avoid getting stuck in loading if callback is delayed
    setTimeout(() => {
      if (settled) return;
      const currentUser = (fa.auth && fa.auth.currentUser) || fa.currentUser;
      hydrateUser(currentUser || null).then((hydrated) => {
        settle(hydrated || null);
      });
    }, 1500);
  }

  window.addEventListener('achieve:profile-updated', (e) => {
    const details = e && e.detail ? e.detail : {};
    if (!details || !details.uid || details.uid !== currentUserId) return;

    const liveUser =
      (window.firebaseAuth && window.firebaseAuth.auth && window.firebaseAuth.auth.currentUser) ||
      null;

    if (liveUser) {
      applyUser(liveUser);
      return;
    }

    const existingName = (nameEl && nameEl.textContent) || 'Account';
    setAvatar(details.photoURL || '', getInitials(existingName));
  });

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      accountEl.classList.toggle('open');
      trigger.setAttribute('aria-expanded', accountEl.classList.contains('open') ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!accountEl.contains(e.target)) {
        accountEl.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      signOutBtn.disabled = true;
      try {
        if (window.firebaseAuth && window.firebaseAuth.signOut) {
          await window.firebaseAuth.signOut();
        }
      } finally {
        // Fallback UI reset in case auth state event is delayed
        accountEl.classList.remove('open');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
        applyUser(null);
        signOutBtn.disabled = false;
      }
    });
  }

  initAuthUI();
});