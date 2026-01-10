import { getStripe } from '../../lib/stripe.js';
import { getAdmin, verifyFirebaseIdToken } from '../../lib/firebaseAdmin.js';

function pickReturnUrl(body, req) {
  const fromBody = body?.returnUrl;
  if (typeof fromBody === 'string' && fromBody.startsWith('http')) return fromBody;
  const origin = req.headers.origin || `https://${req.headers.host}`;
  return `${origin}/account/account.html`;
}

async function getCustomerId(uid) {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('stripeCustomers').doc(uid).get();
  return snap.exists ? snap.data()?.customerId : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const decoded = await verifyFirebaseIdToken(req);
    const uid = decoded.uid;

    const customerId = await getCustomerId(uid);
    if (!customerId) return res.status(400).send('No Stripe customer found for this user.');

    const returnUrl = pickReturnUrl(req.body, req);

    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[stripe] create-portal-session failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}