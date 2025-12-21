// Populate account.html with current Firebase user and handle sign out
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('accountStatus');
  const contentEl = document.getElementById('accountContent');
  const notSignedEl = document.getElementById('notSignedIn');
  const picEl = document.getElementById('profilePic');
  const nameEl = document.getElementById('displayName');
  const emailEl = document.getElementById('email');
  const providerEl = document.getElementById('providerInfo');
  const rawMeta = document.getElementById('rawMeta');
  const signOutBtn = document.getElementById('signOutBtn');

  function waitForFirebaseReady(timeout = 4000) {
    return new Promise(resolve => {
      if (window.firebaseAuth) return resolve(true);
      const interval = setInterval(() => {
        if (window.firebaseAuth) {
          clearInterval(interval);
          clearTimeout(to);
          resolve(true);
        }
      }, 80);
      const to = setTimeout(() => {
        clearInterval(interval);
        resolve(false);
      }, timeout);
    });
  }

  async function init() {
    console.log('[account] init start');
    statusEl.textContent = 'Checking authentication...';

    const ready = await waitForFirebaseReady();
    console.log('[account] firebase ready =', ready, 'window.firebaseAuth=', !!window.firebaseAuth);
    if (!ready) {
      statusEl.textContent = 'Authentication not available. Try reloading.';
      notSignedEl.style.display = 'block';
      return;
    }

    // Try immediate currentUser + waitForSignIn helper to handle redirect timing
    try {
      const current = window.firebaseAuth.auth.currentUser;
      console.log('[account] auth.currentUser before wait =', current);
    } catch (e) {
      console.warn('[account] cannot read auth.currentUser', e);
    }

    // Wait briefly for sign-in state to become available (if user just signed in)
    const maybeUser = await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(4000) : Promise.resolve(null));
    console.log('[account] waitForSignIn result =', maybeUser);

    // subscribe to auth changes (will run immediately if state already known)
    const unsub = window.firebaseAuth.onAuthStateChanged((user) => {
      console.log('[account] onAuthStateChanged ->', user);
      if (!user) {
        // No firebase user — check local dev session (for local-testing fallback)
        const devSession = localStorage.getItem('dev_session');
        if (devSession) {
          const s = JSON.parse(devSession);
          console.log('[account] using dev_session', s);
          statusEl.textContent = '';
          notSignedEl.style.display = 'none';
          contentEl.style.display = 'block';
          picEl.src = '../sources/avatar-placeholder.png';
          nameEl.textContent = (s.firstName || s.email.split('@')[0] || 'User');
          emailEl.textContent = s.email || '';
          providerEl.textContent = 'Providers: local-dev';
          rawMeta.innerText = `DEV SESSION\nEmail: ${s.email}`;
          return;
        }

        statusEl.textContent = '';
        contentEl.style.display = 'none';
        notSignedEl.style.display = 'block';
        // If not signed in, redirect back to login after a short delay
        setTimeout(() => {
          window.location.href = '../login/login.html';
        }, 900);
        return;
      }

      // user is signed in: populate UI
      statusEl.textContent = '';
      notSignedEl.style.display = 'none';
      contentEl.style.display = 'block';

      picEl.src = user.photoURL || '../sources/avatar-placeholder.png';
      nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      emailEl.textContent = user.email || '';
      const providers = (user.providerData || []).map(p => p.providerId).join(', ');
      providerEl.textContent = `Providers: ${providers || 'email/password'}`;
      rawMeta.innerText = `UID: ${user.uid}\nEmail verified: ${user.emailVerified}\nCreated: ${user.metadata?.creationTime || 'n/a'}`;

      // we can unsubscribe once we've populated UI
      try { if (typeof unsub === 'function') unsub(); } catch(e){/*ignore*/ }
    });

    // If waitForSignIn returned a user, populate immediately (covers some timing cases)
    if (maybeUser) {
      console.log('[account] populating from maybeUser');
      const user = maybeUser;
      statusEl.textContent = '';
      notSignedEl.style.display = 'none';
      contentEl.style.display = 'block';
      picEl.src = user.photoURL || '../sources/avatar-placeholder.png';
      nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      emailEl.textContent = user.email || '';
      const providers = (user.providerData || []).map(p => p.providerId).join(', ');
      providerEl.textContent = `Providers: ${providers || 'email/password'}`;
      rawMeta.innerText = `UID: ${user.uid}\nEmail verified: ${user.emailVerified}\nCreated: ${user.metadata?.creationTime || 'n/a'}`;
    }

    signOutBtn.addEventListener('click', async () => {
      try {
        await window.firebaseAuth.signOut();
        // clear local dev session too
        localStorage.removeItem('dev_session');
      } catch (e) {
        console.warn('Sign out failed', e);
      } finally {
        window.location.href = '../login/login.html';
      }
    });
  }

  init();
});