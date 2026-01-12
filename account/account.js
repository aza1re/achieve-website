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

  const stripeInlineWrap = document.getElementById('stripeInlineWrap');
  const submitPaymentBtn = document.getElementById('submitPaymentBtn');
  const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

  const DEFAULT_AVATAR_PATH = '../sources/avatar-placeholder.svg';
  const DEFAULT_AVATAR_DATA_URI =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Default profile avatar">
        <rect width="96" height="96" rx="14" fill="#222"/>
        <circle cx="48" cy="38" r="14" fill="none" stroke="#8C2131" stroke-width="4"/>
        <path d="M24 82c4-14 18-22 24-22s20 8 24 22" fill="none" stroke="#8C2131" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `.trim());

  function setDefaultAvatar() {
    if (!picEl) return;
    picEl.src = DEFAULT_AVATAR_PATH;
  }

  // If a remote photo URL is broken, fall back to the default icon.
  // If the default SVG file is missing too, fall back to an inline (data URI) SVG.
  if (picEl) {
    picEl.addEventListener('error', () => {
      const current = picEl.getAttribute('src') || '';

      // If we already tried the file-path placeholder and it failed, use data URI.
      if (current.includes('avatar-placeholder.svg')) {
        picEl.src = DEFAULT_AVATAR_DATA_URI;
        return;
      }

      // Otherwise try the normal placeholder file first.
      setDefaultAvatar();
    });
  }

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
        }

        setStatus('');
      } catch (e) {
        console.warn('[account] profile photo update failed', e);
        picEl.src = previousSrc || DEFAULT_AVATAR_PATH; // revert on failure
        revokePreview();
        setStatus(e?.message || 'Failed to update profile photo.');
      } finally {
        // allow selecting same file again later
        profilePicInput.value = '';
      }
    });
  }

  // -------- Stripe Elements (inline payment) --------
  let stripe = null;
  let elements = null;
  let paymentElement = null;

  async function getStripePublishableKey() {
    const res = await fetch('/api/stripe/config', { method: 'GET' });
    if (!res.ok) throw new Error(`Stripe config failed (${res.status}).`);
    const data = await res.json();
    if (!data?.publishableKey) throw new Error('Missing Stripe publishable key.');
    return data.publishableKey;
  }

  async function createSetupIntentClientSecret(idToken) {
    const res = await fetch('/api/stripe/create-setup-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to start payment (${res.status}). ${text}`.trim());
    }

    const data = await res.json();
    if (!data?.clientSecret) throw new Error('Missing SetupIntent client secret.');
    return data.clientSecret;
  }

  function showInlinePayment(show) {
    if (!stripeInlineWrap) return;
    stripeInlineWrap.style.display = show ? 'block' : 'none';
  }

  async function ensureStripeMounted(user) {
    if (paymentElement) return;

    if (typeof window.Stripe !== 'function') {
      throw new Error('Stripe.js failed to load.');
    }

    const idToken = await user.getIdToken();
    const [publishableKey, clientSecret] = await Promise.all([
      getStripePublishableKey(),
      createSetupIntentClientSecret(idToken),
    ]);

    stripe = window.Stripe(publishableKey);

    elements = stripe.elements({
      clientSecret,
      appearance: { theme: 'night' },
    });

    paymentElement = elements.create('payment');
    paymentElement.mount('#payment-element');
  }

  async function confirmSetup() {
    const user =
      window.firebaseAuth?.auth?.currentUser ||
      (window.firebaseAuth.waitForSignIn ? await window.firebaseAuth.waitForSignIn(3000) : null);

    if (!user) {
      setPaymentStatus('Please sign in to manage payment methods.');
      window.location.href = '../login/login.html';
      return;
    }

    if (!stripe || !elements) throw new Error('Payment form is not ready.');

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        // In case a redirect-based method is used, come back here:
        return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) throw new Error(error.message || 'Payment confirmation failed.');
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

    // Show simple return message from redirects
    const qs = new URLSearchParams(window.location.search);
    const pay = (qs.get('payment') || '').toLowerCase();
    if (pay === 'success') setPaymentStatus('Payment method saved.');
    if (pay === 'cancel') setPaymentStatus('Payment setup canceled.');

    if (managePaymentBtn) {
      managePaymentBtn.addEventListener('click', async () => {
        setPaymentStatus('');

        const user =
          window.firebaseAuth?.auth?.currentUser ||
          (window.firebaseAuth.waitForSignIn ? await window.firebaseAuth.waitForSignIn(3000) : null);

        if (!user) {
          setPaymentStatus('Please sign in to manage payment methods.');
          window.location.href = '../login/login.html';
          return;
        }

        try {
          managePaymentBtn.disabled = true;
          setPaymentStatus('Loading secure payment form...');

          showInlinePayment(true);
          await ensureStripeMounted(user);

          setPaymentStatus('');
        } catch (e) {
          console.warn('[payment] failed to load Stripe Elements', e);
          setPaymentStatus(e?.message || 'Could not load payment form.');
          showInlinePayment(false);
        } finally {
          managePaymentBtn.disabled = false;
        }
      });
    }

    if (submitPaymentBtn) {
      submitPaymentBtn.addEventListener('click', async () => {
        try {
          submitPaymentBtn.disabled = true;
          setPaymentStatus('Saving payment method...');

          await confirmSetup();

          setPaymentStatus('Payment method saved.');
          showInlinePayment(false);
        } catch (e) {
          console.warn('[payment] confirm setup failed', e);
          setPaymentStatus(e?.message || 'Could not save payment method.');
        } finally {
          submitPaymentBtn.disabled = false;
        }
      });
    }

    if (cancelPaymentBtn) {
      cancelPaymentBtn.addEventListener('click', () => {
        setPaymentStatus('');
        showInlinePayment(false);
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

      picEl.src = user.photoURL || DEFAULT_AVATAR_PATH;
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
      picEl.src = user.photoURL || DEFAULT_AVATAR_PATH;
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