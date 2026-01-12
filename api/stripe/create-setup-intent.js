import { getStripe } from '../../lib/stripe.js';
import { getAdmin, verifyFirebaseIdToken } from '../../lib/firebaseAdmin.js';

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
    {
      customerId: customer.id,
      email: email || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
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

    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true },
      metadata: { firebaseUid: uid },
    });

    return res.status(200).json({ clientSecret: setupIntent.client_secret });
  } catch (e) {
    console.error('[stripe] create-setup-intent failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}