import { getAdmin } from '../../lib/firebaseAdmin.js';

/**
 * POST /api/auth/line
 * Body: { code: "<line-authorization-code>", redirectUri: "<redirect-uri>" }
 *
 * 1. Exchanges the authorization code for a LINE access token
 * 2. Fetches the LINE user profile
 * 3. Creates (or updates) a Firebase user and mints a custom token
 * 4. Returns { firebaseToken } to the frontend
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { code, redirectUri } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID;
  const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
    return res.status(500).json({ error: 'Server misconfigured: missing LINE_CHANNEL_ID or LINE_CHANNEL_SECRET' });
  }

  try {
    // 1. Exchange authorization code for access token
    const tokenParams = {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: LINE_CHANNEL_ID,
      client_secret: LINE_CHANNEL_SECRET,
    };

    console.log('[line] Token exchange request:', {
      client_id: LINE_CHANNEL_ID,
      redirect_uri: redirectUri,
      code: code?.substring(0, 10) + '...',
    });

    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[line] Token exchange failed:', tokenRes.status, errText);
      return res.status(401).json({ error: 'Failed to exchange LINE authorization code', detail: errText });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from LINE
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const errText = await profileRes.text();
      console.error('[line] Failed to fetch user profile:', profileRes.status, errText);
      return res.status(401).json({ error: 'Invalid LINE access token' });
    }

    const lineUser = await profileRes.json();
    const lineUserId = lineUser.userId;
    const displayName = lineUser.displayName || null;
    const photoURL = lineUser.pictureUrl || null;

    // LINE does not return email via the profile API.
    // Email can be obtained from the id_token if 'email' scope was requested
    // and the LINE channel has email permission approved.
    let email = null;
    if (tokenData.id_token) {
      try {
        // Decode the id_token payload (JWT) to extract email
        const payload = JSON.parse(
          Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString('utf-8')
        );
        if (payload.email) {
          email = payload.email;
        }
      } catch (e) {
        console.warn('[line] Could not decode id_token for email:', e.message);
      }
    }

    // 3. Create or update the Firebase user
    const admin = getAdmin();
    const firebaseUid = `line:${lineUserId}`;

    try {
      await admin.auth().updateUser(firebaseUid, {
        ...(displayName && { displayName }),
        ...(photoURL && { photoURL }),
        ...(email && { email }),
      });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: firebaseUid,
          ...(displayName && { displayName }),
          ...(photoURL && { photoURL }),
          ...(email && { email }),
        });
      } else {
        throw e;
      }
    }

    // 4. Mint a Firebase custom token
    const firebaseToken = await admin.auth().createCustomToken(firebaseUid);
    console.log('[line] Firebase custom token created for uid:', firebaseUid);
    return res.status(200).json({ firebaseToken });
  } catch (e) {
    console.error('[line] auth error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
