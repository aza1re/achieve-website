document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const btn = document.getElementById('signupBtn');
  const errBox = document.getElementById('signupError');

  const params = new URLSearchParams(window.location.search);
  const next = (params.get('next') || '').toLowerCase(); // e.g. ?next=login

  function showError(msg) {
    errBox.style.display = msg ? 'block' : 'none';
    errBox.textContent = msg || '';
  }

  function setLoading(loading) {
    btn.disabled = !!loading;
    btn.classList.toggle('loading', !!loading);
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

  function validate(data, confirm) {
    if (!data.firstName || !data.lastName || !data.email || !data.password || !data.userType) return 'Please fill out all required fields.';
    if (data.password.length < 8) return 'Password must be at least 8 characters.';
    if (data.password !== confirm) return 'Passwords do not match.';
    return '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    const payload = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim().toLowerCase(),
      password: document.getElementById('password').value,
      userType: document.getElementById('userType').value,
      newsletter: !!document.getElementById('newsletter').checked
    };

    const confirm = document.getElementById('confirmPassword').value;
    const v = validate(payload, confirm);
    if (v) return showError(v);

    setLoading(true);
    try {
      const fbReady = await waitForFirebase(5000);
      if (!fbReady || !window.firebaseAuth || !window.firebaseAuth.signupEmail) {
        showError('Authentication is not available. Please reload and try again.');
        return;
      }

      await window.firebaseAuth.signupEmail(payload.email, payload.password);
      await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(8000) : Promise.resolve());

      // If you want to store firstName/lastName/userType/newsletter in a DB (Firestore),
      // add it here after signup. Firebase Auth only stores email/password by default.

      if (next === 'login') {
        if (typeof window.firebaseAuth.signOut === 'function') {
          await window.firebaseAuth.signOut();
        }
        window.location.href = '../login/login.html';
        return;
      }

      window.location.href = '../account/account.html';
    } catch (fbErr) {
      console.warn('Firebase signup error', fbErr);
      const code = fbErr && fbErr.code ? fbErr.code : '';
      if (code === 'auth/email-already-in-use') showError('An account with that email already exists.');
      else if (code === 'auth/invalid-email') showError('Invalid email address.');
      else if (code === 'auth/weak-password') showError('Password is too weak.');
      else if (code === 'auth/operation-not-allowed') showError('Email/password sign-up is not enabled in Firebase.');
      else showError((fbErr && fbErr.message) || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  });
});