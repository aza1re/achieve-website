import { getStripe } from '../../lib/stripe.js';
import { getAdmin, verifyFirebaseIdToken } from '../../lib/firebaseAdmin.js';

const CAMP_CATALOG = {
  'rumble-cup-spring': {
    name: 'Rumble Cup (Spring)',
    productId: 'prod_U5nJVx2n4UnVnz',
  },
};

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

async function resolvePriceForCamp(campId) {
  const camp = CAMP_CATALOG[campId];
  if (!camp) throw new Error('Unknown campId');

  const stripe = getStripe();
  const prices = await stripe.prices.list({
    product: camp.productId,
    active: true,
    limit: 100,
  });

  const oneTime = prices.data.filter((p) => p.type === 'one_time' && p.unit_amount != null);
  const picked = oneTime.find((p) => p.currency === 'usd') || oneTime[0];
  if (!picked) throw new Error('No active one-time price found for this product.');

  return { camp, price: picked };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const decoded = await verifyFirebaseIdToken(req);
    const uid = decoded.uid;
    const email = decoded.email;

    const campId = String(req.body?.campId || '').trim();
    if (!campId) return res.status(400).send('Missing campId');

    const { camp, price } = await resolvePriceForCamp(campId);
    const customerId = await getOrCreateCustomerId({ uid, email });
    const returnUrl = pickReturnUrl(req.body, req);

    const success = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}payment=success`;
    const cancel = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}payment=cancel`;

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      success_url: success,
      cancel_url: cancel,
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        firebaseUid: uid,
        campId,
        campName: camp.name,
        productId: camp.productId,
        priceId: price.id,
      },
    });

    return res.status(200).json({ url: session.url, id: session.id });
  } catch (e) {
    console.error('[stripe] create-camp-checkout-session failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}