import { getAdmin } from '../../lib/firebaseAdmin.js';

/**
 * POST /api/auth/kakao
 * Body: { code: "<kakao-authorization-code>", redirectUri: "<redirect-uri>" }
 *
 * 1. Exchanges the authorization code for a Kakao access token
 * 2. Fetches the Kakao user profile
 * 3. Creates (or updates) a Firebase user and mints a custom token
 * 4. Returns { firebaseToken } to the frontend
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { code, redirectUri } = req.body || {};
  if (!code) return res.status(400).json({ error: 'Missing authorization code' });

  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY;
  const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET;
  if (!KAKAO_REST_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing KAKAO_REST_API_KEY' });

  try {
    // 1. Exchange authorization code for access token
    const tokenParams = {
      grant_type: 'authorization_code',
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code: code,
    };

    // Client secret is required by default for Kakao REST API keys
    if (KAKAO_CLIENT_SECRET) {
      tokenParams.client_secret = KAKAO_CLIENT_SECRET;
    }

    console.log('[kakao] Token exchange request:', {
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code: code?.substring(0, 10) + '...',
      has_client_secret: !!KAKAO_CLIENT_SECRET,
    });

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(tokenParams),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('[kakao] Token exchange failed:', tokenRes.status, errText);
      return res.status(401).json({ error: 'Failed to exchange Kakao authorization code', detail: errText });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user info from Kakao
    const kakaoRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!kakaoRes.ok) {
      const errText = await kakaoRes.text();
      console.error('[kakao] Failed to fetch user info:', kakaoRes.status, errText);
      return res.status(401).json({ error: 'Invalid Kakao access token' });
    }

    const kakaoUser = await kakaoRes.json();
    const kakaoUid = String(kakaoUser.id);

    // Extract profile info
    const kakaoAccount = kakaoUser.kakao_account || {};
    const profile = kakaoAccount.profile || {};
    const email = kakaoAccount.email || null;
    const displayName = profile.nickname || null;
    const photoURL = profile.profile_image_url || null;

    // 3. Create or update the Firebase user
    const admin = getAdmin();
    const firebaseUid = `kakao:${kakaoUid}`;

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

    return res.status(200).json({ firebaseToken });
  } catch (e) {
    console.error('[kakao] auth error:', e);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
