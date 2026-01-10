import { getStripe } from '../../lib/stripe.js';
import { getAdmin, verifyFirebaseIdToken } from '../../lib/firebaseAdmin.js';

function pickReturnUrl(body, req) {
  const fromBody = body?.returnUrl;
  if (typeof fromBody === 'string' && fromBody.startsWith('http')) return fromBody;
  const origin = req.headers.origin || `https://${req.headers.host}`;
  return `${origin}/account/account.html`;
}

async function getOrCreateCustomerId({ uid, email }) {
  const admin = getAdmin();
  const db = admin.firestore();
  const docRef = db.collection('stripeCustomers').doc(uid);
  const snap = await docRef.get();

  if (snap.exists && snap.data()?.customerId) return snap.data().customerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: email || undefined,
    metadata: { firebaseUid: uid },
  });

  await docRef.set(
    { customerId: customer.id, email: email || null, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  return customer.id;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const decoded = await verifyFirebaseIdToken(req);
    const uid = decoded.uid;
    const email = decoded.email;

    const customerId = await getOrCreateCustomerId({ uid, email });
    const returnUrl = pickReturnUrl(req.body, req);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}payment=success`,
      cancel_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}payment=cancel`,
      metadata: { firebaseUid: uid },
    });

    return res.status(200).json({ url: session.url });
  } catch (e) {
    console.error('[stripe] create-setup-session failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}