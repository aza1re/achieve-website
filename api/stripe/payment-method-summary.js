import { getStripe } from '../../lib/stripe.js';
import { getAdmin, verifyFirebaseIdToken } from '../../lib/firebaseAdmin.js';

async function getCustomerId(uid) {
  const admin = getAdmin();
  const db = admin.firestore();
  const snap = await db.collection('stripeCustomers').doc(uid).get();
  return snap.exists ? snap.data()?.customerId : null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const decoded = await verifyFirebaseIdToken(req);
    const customerId = await getCustomerId(decoded.uid);

    if (!customerId) {
      return res.status(200).json({ hasPaymentMethod: false });
    }

    const stripe = getStripe();
    const list = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
      limit: 1,
    });

    const pm = list?.data?.[0];
    if (!pm?.card) {
      return res.status(200).json({ hasPaymentMethod: false });
    }

    return res.status(200).json({
      hasPaymentMethod: true,
      brand: pm.card.brand || 'card',
      last4: pm.card.last4 || '••••',
      expMonth: pm.card.exp_month || null,
      expYear: pm.card.exp_year || null,
    });
  } catch (e) {
    console.error('[stripe] payment-method-summary failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}