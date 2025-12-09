// Initialize Google Identity Services button and handle response
(function () {
  const CLIENT_ID = '260668035138-p6tdbnvffp2q4hadev2b8pbnqm4e55hi.apps.googleusercontent.com'; // <- your web client ID

  function decodeJwtPayload(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(decodeURIComponent(atob(payload).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')));
    } catch (e) {
      return null;
    }
  }

  function handleCredentialResponse(response) {
    // response.credential is the ID token (JWT)
    const idToken = response.credential;
    const info = decodeJwtPayload(idToken) || {};

    // Optionally show user info client-side
    console.log('Google ID token received. user:', info);

    // Send token to server for verification / sign-in
    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    }).then(r => r.json())
      .then(data => {
        if (data && data.success) {
          // login success — redirect or update UI
          window.location.href = data.redirect || '/account.html';
        } else {
          console.error('Server rejected token', data);
          alert('Google sign-in failed.');
        }
      }).catch(err => {
        console.error('Network error', err);
        alert('Sign-in request failed.');
      });
  }

  // Wait until Google script loaded
  function init() {
    if (!window.google || !google.accounts || !google.accounts.id) {
      return setTimeout(init, 100);
    }

    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      ux_mode: 'popup'
    });

    // render the (hidden) native button so library internals are available
    google.accounts.id.renderButton(
      document.getElementById('google-signin-button'),
      { theme: 'outline', size: 'large', width: 300 } // width value ignored — visual hidden by CSS
    );

    // keep One-Tap off by default. If you want prompt: google.accounts.id.prompt();

    // Wire our custom button to forward clicks to the hidden native GSI button
    const custom = document.getElementById('google-custom-btn');
    custom && custom.addEventListener('click', () => {
      // prefer clicking the native role="button" node
      const nativeBtn = document.querySelector('#google-signin-button [role="button"], #google-signin-button button');
      if (nativeBtn) {
        nativeBtn.click();
      } else {
        // fallback: prompt One-Tap (works in many cases)
        try { google.accounts.id.prompt(); } catch (e) { console.warn('Google API not ready', e); }
      }
    });
  }

  init();
})();