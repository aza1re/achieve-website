document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const btn = document.getElementById('signupBtn');
  const errBox = document.getElementById('signupError');

  function showError(msg) {
    errBox.style.display = msg ? 'block' : 'none';
    errBox.textContent = msg || '';
  }

  function setLoading(loading) {
    btn.disabled = !!loading;
    btn.classList.toggle('loading', !!loading);
  }

  // NEW: wait for firebase-client to attach window.firebaseAuth
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

    const fbReady = await waitForFirebase();
    if (fbReady && window.firebaseAuth && window.firebaseAuth.signupEmail) {
      try {
        await window.firebaseAuth.signupEmail(payload.email, payload.password);
        await window.firebaseAuth.waitForSignIn(4000);
        // redirect to account (use relative path from signup page)
        window.location.href = '../account/account.html';
        return;
      } catch (fbErr) {
        console.warn('Firebase signup error', fbErr);
        showError((fbErr && fbErr.message) || 'Signup failed with Firebase. Falling back.');
      } finally {
        setLoading(false);
      }
    }

    // existing server fallback / localStorage dev fallback
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const json = await res.json().catch(() => null);
      if (res.ok && json && json.success) {
        window.location.href = json.redirect || '/login/login.html';
        return;
      }

      const users = JSON.parse(localStorage.getItem('dev_users') || '[]');
      users.push({ email: payload.email, password: payload.password, firstName: payload.firstName, lastName: payload.lastName });
      localStorage.setItem('dev_users', JSON.stringify(users));
      window.location.href = '/login/login.html';
    } catch (err) {
      const users = JSON.parse(localStorage.getItem('dev_users') || '[]');
      users.push({ email: payload.email, password: payload.password, firstName: payload.firstName, lastName: payload.lastName });
      localStorage.setItem('dev_users', JSON.stringify(users));
      window.location.href = '/login/login.html';
    } finally {
      setLoading(false);
    }
  });
});