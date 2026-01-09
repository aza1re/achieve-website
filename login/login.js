document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  let errBox = document.getElementById('loginError');
  if (!errBox) {
    errBox = document.createElement('div');
    errBox.id = 'loginError';
    errBox.style.display = 'none';
    errBox.style.margin = '12px 0';
    errBox.style.color = '#ffb4b4';
    form.insertBefore(errBox, form.firstChild);
  }

  function showError(msg) {
    errBox.style.display = msg ? 'block' : 'none';
    errBox.textContent = msg || '';
  }

  function waitForFirebase(timeout = 3000) {
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

  // Resolve when a user is observed by onAuthStateChanged or timeout
  function waitForUser(timeout = 4000) {
    return new Promise(resolve => {
      if (window.firebaseAuth && window.firebaseAuth.auth && window.firebaseAuth.auth.currentUser) {
        return resolve(window.firebaseAuth.auth.currentUser);
      }
      let settled = false;
      const off = window.firebaseAuth && window.firebaseAuth.onAuthStateChanged
        ? window.firebaseAuth.onAuthStateChanged(user => {
            if (settled) return;
            settled = true;
            try { off && off(); } catch (e) {}
            resolve(user || null);
          })
        : null;

      const to = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { off && off(); } catch (e) {}
        resolve(null);
      }, timeout);
    });
  }

  async function firebaseEmailSignIn(email, password) {
    if (!window.firebaseAuth || !window.firebaseAuth.signInEmail) throw new Error('Firebase auth not available');
    return window.firebaseAuth.signInEmail(email, password);
  }

  async function firebaseGoogleSignIn() {
    if (!window.firebaseAuth || !window.firebaseAuth.signInWithGooglePopup) throw new Error('Firebase auth not available');
    return window.firebaseAuth.signInWithGooglePopup();
  }

  function tryLocalLogin(email, password) {
    const users = JSON.parse(localStorage.getItem('dev_users') || '[]');
    return users.find(u => (u.email || '').toLowerCase() === email && u.password === password) || null;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) return showError('Enter email and password.');

    const fbReady = await waitForFirebase();

    // Prefer Firebase if available
    if (fbReady && window.firebaseAuth && window.firebaseAuth.signInEmail) {
      try {
        await firebaseEmailSignIn(email, password);
        const user = await waitForUser(5000);
        if (user) {
          console.log('[login] sign-in successful (navigation disabled). user=', user);
          showError('Login successful — navigation to account is disabled for testing.');
          return;
        }
        showError('Sign-in succeeded but auth state not available yet. Try refreshing.');
        return;
      } catch (fbErr) {
        console.error('[login] Firebase signIn error:', fbErr && fbErr.code, fbErr && fbErr.message);
        const code = fbErr && fbErr.code ? fbErr.code : '';
        if (code === 'auth/invalid-email') showError('Invalid email address.');
        else if (code === 'auth/user-disabled') showError('This account has been disabled.');
        else if (code === 'auth/user-not-found') showError('No account found with that email.');
        else if (code === 'auth/wrong-password') showError('Incorrect password.');
        else if (code === 'auth/operation-not-allowed') showError('Email/password sign-in is not enabled in Firebase.');
        else showError((fbErr && fbErr.message) || 'Login failed with Firebase.');
        // continue to server/local fallback after showing message
      }
    }

    // Server fallback, then localStorage fallback
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        console.log('[login] server login successful (navigation disabled). resp=', json);
        showError('Login successful (server) — navigation to account is disabled for testing.');
        return;
      }

      // ✅ localStorage fallback success
      const u = tryLocalLogin(email, password);
      if (u) {
        console.log('[login] local login successful (navigation disabled). user=', { email: u.email });
        showError('Login successful (local) — navigation to account is disabled for testing.');
        return;
      }

      showError((json && json.message) || 'Invalid credentials.');
    } catch (err) {
      // ✅ localStorage fallback if server is unreachable
      const u = tryLocalLogin(email, password);
      if (u) {
        console.log('[login] local login successful (navigation disabled). user=', { email: u.email });
        showError('Login successful (local) — navigation to account is disabled for testing.');
        return;
      }
      showError('Login failed (network).');
    }
  });

  const googleBtn = document.getElementById('google-custom-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      showError('');
      const fbReady = await waitForFirebase();
      if (fbReady && window.firebaseAuth && window.firebaseAuth.signInWithGooglePopup) {
        try {
          await firebaseGoogleSignIn();
          await window.firebaseAuth.waitForSignIn(4000);
          console.log('[login] google sign-in successful (navigation disabled).');
          showError('Google sign-in successful — navigation to account is disabled for testing.');
          return;
        } catch (err) {
          console.warn('Firebase Google sign-in error', err);
          showError((err && err.message) || 'Google sign-in failed.');
        }
      } else {
        const nativeBtn = document.querySelector('#google-signin-button [role="button"], #google-signin-button button');
        if (nativeBtn) nativeBtn.click();
        else showError('Google sign-in not available.');
      }
    });
  }
});