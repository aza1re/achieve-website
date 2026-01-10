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
});