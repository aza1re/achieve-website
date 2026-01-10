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

  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const profilePicInput = document.getElementById('profilePicInput');
  const managePaymentBtn = document.getElementById('managePaymentBtn');
  const paymentStatus = document.getElementById('paymentStatus');

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

  function setStatus(msg) {
    statusEl.textContent = msg || '';
  }

  function setPaymentStatus(msg) {
    if (!paymentStatus) return;
    paymentStatus.textContent = msg || '';
  }

  function bindPhotoEditing() {
    if (!changePhotoBtn || !profilePicInput) return;

    changePhotoBtn.addEventListener('click', () => {
      profilePicInput.click();
    });

    profilePicInput.addEventListener('change', async () => {
      const file = profilePicInput.files && profilePicInput.files[0];
      if (!file) return;

      if (!file.type || !file.type.startsWith('image/')) {
        setStatus('Please choose an image file.');
        profilePicInput.value = '';
        return;
      }

      // Basic size guard (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatus('Image is too large. Please choose one under 5MB.');
        profilePicInput.value = '';
        return;
      }

      const previousSrc = picEl.src;

      // Preview immediately
      const previewUrl = URL.createObjectURL(file);
      picEl.src = previewUrl;

      let previewRevoked = false;
      const revokePreview = () => {
        if (previewRevoked) return;
        previewRevoked = true;
        try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
      };

      try {
        setStatus('Updating profile photo...');

        // No local fallbacks: only update if Firebase wrapper supports it
        if (!window.firebaseAuth || typeof window.firebaseAuth.updateProfilePhoto !== 'function') {
          throw new Error('Profile photo update is not available (missing firebaseAuth.updateProfilePhoto).');
        }

        const newUrl = await window.firebaseAuth.updateProfilePhoto(file);

        if (typeof newUrl === 'string' && newUrl) {
          picEl.src = newUrl;
          revokePreview(); // safe: no longer using blob URL
        } else {
          // Keep preview if wrapper didn't return a URL; don't revoke it immediately.
          // (Photo should still be persisted in Auth if updateProfile succeeded.)
        }

        setStatus('');
      } catch (e) {
        console.warn('[account] profile photo update failed', e);
        picEl.src = previousSrc; // revert on failure
        revokePreview();
        setStatus(e?.message || 'Failed to update profile photo.');
      } finally {
        // allow selecting same file again later
        profilePicInput.value = '';
      }
    });
  }

  async function init() {
    setStatus('Checking authentication...');

    const ready = await waitForFirebaseReady();
    if (!ready) {
      setStatus('Authentication not available. Try reloading.');
      notSignedEl.style.display = 'block';
      return;
    }

    bindPhotoEditing();

    // Show simple return message from Stripe redirects
    const qs = new URLSearchParams(window.location.search);
    const pay = (qs.get('payment') || '').toLowerCase();
    if (pay === 'success') setPaymentStatus('Payment method saved.');
    if (pay === 'cancel') setPaymentStatus('Payment setup canceled.');

    if (managePaymentBtn) {
      managePaymentBtn.addEventListener('click', async () => {
        setPaymentStatus('');

        const user = window.firebaseAuth?.auth?.currentUser || await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(3000) : null);
        if (!user) {
          setPaymentStatus('Please sign in to manage payment methods.');
          window.location.href = '../login/login.html';
          return;
        }

        try {
          managePaymentBtn.disabled = true;
          setPaymentStatus('Opening secure Stripe page...');

          const idToken = await user.getIdToken();

          // Vercel Serverless Function (same origin)
          const endpoint = '/api/stripe/create-setup-session';

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              returnUrl: window.location.href
            })
          });

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Payment setup failed (${res.status}). ${text}`.trim());
          }

          const data = await res.json();
          if (!data?.url) throw new Error('Payment setup failed: missing redirect URL.');

          window.location.href = data.url;
        } catch (e) {
          console.warn('[payment] failed to open Stripe', e);
          setPaymentStatus(e?.message || 'Could not start payment workflow.');
          managePaymentBtn.disabled = false;
        }
      });
    }

    const maybeUser = await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(4000) : Promise.resolve(null));

    const unsub = window.firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        setStatus('');
        contentEl.style.display = 'none';
        notSignedEl.style.display = 'block';
        setTimeout(() => {
          window.location.href = '../login/login.html';
        }, 900);
        return;
      }

      setStatus('');
      notSignedEl.style.display = 'none';
      contentEl.style.display = 'block';

      picEl.src = user.photoURL || '../sources/avatar-placeholder.png';
      nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
      emailEl.textContent = user.email || '';
      const providers = (user.providerData || []).map(p => p.providerId).join(', ');
      providerEl.textContent = `Providers: ${providers || 'email/password'}`;
      rawMeta.innerText = `UID: ${user.uid}\nEmail verified: ${user.emailVerified}\nCreated: ${user.metadata?.creationTime || 'n/a'}`;

      try { if (typeof unsub === 'function') unsub(); } catch (e) { /* ignore */ }
    });

    if (maybeUser) {
      const user = maybeUser;
      setStatus('');
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
      } catch (e) {
        console.warn('Sign out failed', e);
      } finally {
        window.location.href = '../login/login.html';
      }
    });
  }

  init();
});