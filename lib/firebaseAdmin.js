import admin from 'firebase-admin';

function getServiceAccount() {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('Missing FIREBASE_ADMIN_CREDENTIALS');
  return JSON.parse(raw);
}

export function getAdmin() {
  if (admin.apps.length) return admin;

  const serviceAccount = getServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  return admin;
}

export async function verifyFirebaseIdToken(req) {
  const header = req.headers.authorization || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) throw new Error('Missing Authorization Bearer token');

  const token = m[1];
  const a = getAdmin();
  return a.auth().verifyIdToken(token);
}