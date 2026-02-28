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
  function waitForUser(timeout = 5000) {
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!email || !password) return showError('Enter email and password.');

    const fbReady = await waitForFirebase(5000);
    if (!fbReady || !window.firebaseAuth || !window.firebaseAuth.signInEmail) {
      showError('Authentication is not available. Please reload and try again.');
      return;
    }

    try {
      await firebaseEmailSignIn(email, password);
      const user = await waitForUser(8000);
      if (!user) return showError('Signed in, but auth state is not available yet. Try refreshing.');
      window.location.href = '../account/account.html';
    } catch (fbErr) {
      console.error('[login] Firebase signIn error:', fbErr && fbErr.code, fbErr && fbErr.message);
      const code = fbErr && fbErr.code ? fbErr.code : '';
      if (code === 'auth/invalid-email') showError('Invalid email address.');
      else if (code === 'auth/user-disabled') showError('This account has been disabled.');
      else if (code === 'auth/user-not-found') showError('No account found with that email.');
      else if (code === 'auth/wrong-password') showError('Incorrect password.');
      else if (code === 'auth/operation-not-allowed') showError('Email/password sign-in is not enabled in Firebase.');
      else showError((fbErr && fbErr.message) || 'Login failed.');
    }
  });

  const googleBtn = document.getElementById('google-custom-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      showError('');

      const fbReady = await waitForFirebase(5000);
      if (fbReady && window.firebaseAuth && window.firebaseAuth.signInWithGooglePopup) {
        try {
          await firebaseGoogleSignIn();
          await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(8000) : Promise.resolve());
          window.location.href = '../account/account.html';
        } catch (err) {
          console.warn('Firebase Google sign-in error', err);
          showError((err && err.message) || 'Google sign-in failed.');
        }
        return;
      }

      // If Firebase Google popup isn’t wired, try clicking the rendered GSI button (if present)
      const nativeBtn = document.querySelector('#google-signin-button [role="button"], #google-signin-button button');
      if (nativeBtn) nativeBtn.click();
      else showError('Google sign-in not available.');
    });
  }
  // ── Apple Sign-In ──
  const appleBtn = document.getElementById('apple-signin-btn');
  if (appleBtn) {
    appleBtn.addEventListener('click', async () => {
      showError('');

      const fbReady = await waitForFirebase(5000);
      if (!fbReady || !window.firebaseAuth || !window.firebaseAuth.signInWithApplePopup) {
        showError('Apple sign-in is not available. Please reload and try again.');
        return;
      }

      try {
        await window.firebaseAuth.signInWithApplePopup();
        await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(8000) : Promise.resolve());
        window.location.href = '../account/account.html';
      } catch (err) {
        console.warn('Apple sign-in error', err);
        if (err && err.code === 'auth/popup-closed-by-user') {
          // user closed the popup — don't show an error
          return;
        }
        showError((err && err.message) || 'Apple sign-in failed.');
      }
    });
  }

  // ── Kakao Sign-In ──
  // Initialize Kakao SDK
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init('19736c7403c9763661e0e7a9ecd6de7f');
  }

  // Handle Kakao redirect callback (page reloads with ?code=xxx after Kakao login)
  // Only process if state is NOT 'line' (LINE Login also returns ?code= but includes state=line)
  const urlParams = new URLSearchParams(window.location.search);
  const kakaoCode = urlParams.get('code');
  const oauthState = urlParams.get('state');
  if (kakaoCode && oauthState !== 'line') {
    (async () => {
      showError('');
      try {
        // Remove code from URL so refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname);

        // Send authorization code to backend
        const res = await fetch('/api/auth/kakao', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: kakaoCode, redirectUri: window.location.origin + '/login/login.html' }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Kakao authentication failed');
        }

        const { firebaseToken } = await res.json();

        // Sign into Firebase with the custom token
        const fbReady = await waitForFirebase(5000);
        if (!fbReady || !window.firebaseAuth || !window.firebaseAuth.signInWithCustomToken) {
          showError('Firebase is not available. Please reload and try again.');
          return;
        }

        await window.firebaseAuth.signInWithCustomToken(firebaseToken);
        await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(8000) : Promise.resolve());
        window.location.href = '../account/account.html';
      } catch (err) {
        console.warn('Kakao sign-in error', err);
        showError((err && err.message) || 'Kakao sign-in failed.');
      }
    })();
  }

  const kakaoBtn = document.getElementById('kakao-signin-btn');
  if (kakaoBtn) {
    kakaoBtn.addEventListener('click', () => {
      showError('');

      if (!window.Kakao || !window.Kakao.isInitialized()) {
        showError('Kakao SDK not loaded. Please reload and try again.');
        return;
      }

      // Redirect to Kakao login page
      window.Kakao.Auth.authorize({
        redirectUri: window.location.origin + '/login/login.html',
      });
    });
  }

  // ── LINE Sign-In ──

  // LINE Channel ID (must match the value in your .env / LINE Developers Console)
  const LINE_CHANNEL_ID = '2008862439';

  // Handle LINE redirect callback (page reloads with ?code=xxx&state=line after LINE login)
  const lineState = urlParams.get('state');
  const lineCode = urlParams.get('code');
  if (lineCode && lineState === 'line') {
    (async () => {
      showError('');
      try {
        // Remove query params so a refresh doesn't re-trigger
        window.history.replaceState({}, '', window.location.pathname);

        // Send authorization code to backend
        const res = await fetch('/api/auth/line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: lineCode, redirectUri: window.location.origin + '/login/login.html' }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'LINE authentication failed');
        }

        const { firebaseToken } = await res.json();

        // Sign into Firebase with the custom token
        const fbReady = await waitForFirebase(5000);
        if (!fbReady || !window.firebaseAuth || !window.firebaseAuth.signInWithCustomToken) {
          showError('Firebase is not available. Please reload and try again.');
          return;
        }

        await window.firebaseAuth.signInWithCustomToken(firebaseToken);
        await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(8000) : Promise.resolve());
        window.location.href = '../account/account.html';
      } catch (err) {
        console.warn('LINE sign-in error', err);
        showError((err && err.message) || 'LINE sign-in failed.');
      }
    })();
  }

  // LINE button click → redirect to LINE authorization page
  const lineBtn = document.getElementById('line-signin-btn');
  if (lineBtn) {
    lineBtn.addEventListener('click', () => {
      showError('');
      const redirectUri = encodeURIComponent(window.location.origin + '/login/login.html');
      const lineAuthUrl = 'https://access.line.me/oauth2/v2.1/authorize'
        + '?response_type=code'
        + '&client_id=' + LINE_CHANNEL_ID
        + '&redirect_uri=' + redirectUri
        + '&state=line'
        + '&scope=profile%20openid%20email';
      window.location.href = lineAuthUrl;
    });
  }
});