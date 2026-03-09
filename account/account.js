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
  const campSignupsStatus = document.getElementById('campSignupsStatus');
  const campSignupsList = document.getElementById('campSignupsList');

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

  function renderCampSignups(items) {
    if (!campSignupsList || !campSignupsStatus) return;
    campSignupsList.innerHTML = '';

    if (!items || items.length === 0) {
      campSignupsStatus.textContent = 'No camp registrations yet.';
      return;
    }

    campSignupsStatus.textContent = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item.campName || 'Unnamed camp';
      campSignupsList.appendChild(li);
    });
  }

  async function loadCampSignups() {
    if (!window.firebaseAuth || typeof window.firebaseAuth.getUserCampSignups !== 'function') {
      renderCampSignups([]);
      return;
    }

    try {
      const signups = await window.firebaseAuth.getUserCampSignups();
      renderCampSignups(signups);
    } catch (e) {
      console.warn('Failed to load camp signups', e);
      if (campSignupsStatus) {
        campSignupsStatus.textContent = 'Unable to load camp registrations right now.';
      }
    }
  }

  function clearCampSignups() {
    if (!campSignupsList || !campSignupsStatus) return;
    campSignupsList.innerHTML = '';
    campSignupsStatus.textContent = '';
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

        const currentUser = window.firebaseAuth?.auth?.currentUser;
        if (currentUser && typeof currentUser.reload === 'function') {
          try {
            await currentUser.reload();
          } catch {
            // ignore reload hiccups and still use returned URL
          }
        }

        const refreshedUrl = window.firebaseAuth?.auth?.currentUser?.photoURL || newUrl;
        if (typeof refreshedUrl === 'string' && refreshedUrl) {
          picEl.src = refreshedUrl;
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

  function applyUser(user) {
    setStatus('');
    notSignedEl.style.display = 'none';
    contentEl.style.display = 'block';

    picEl.src = user.photoURL || DEFAULT_AVATAR_PATH;
    nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'User');
    emailEl.textContent = user.email || '';
    const providers = (user.providerData || []).map(p => p.providerId).join(', ');
    providerEl.textContent = `Providers: ${providers || 'email/password'}`;
    rawMeta.innerText = `UID: ${user.uid}\nEmail verified: ${user.emailVerified}\nCreated: ${user.metadata?.creationTime || 'n/a'}`;

    loadCampSignups();
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

    const maybeUser = await (window.firebaseAuth.waitForSignIn ? window.firebaseAuth.waitForSignIn(4000) : Promise.resolve(null));

    window.firebaseAuth.onAuthStateChanged((user) => {
      if (!user) {
        setStatus('');
        contentEl.style.display = 'none';
        notSignedEl.style.display = 'block';
        clearCampSignups();
        setTimeout(() => {
          window.location.href = '../login/login.html';
        }, 900);
        return;
      }

      applyUser(user);
    });

    if (maybeUser) {
      applyUser(maybeUser);
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