import { getStripe } from '../../lib/stripe.js';

const CAMP_CATALOG = {
  'rumble-cup-spring': {
    name: 'Rumble Cup (Spring)',
    productId: 'prod_U5nJVx2n4UnVnz',
  },
};

async function resolvePriceForCamp(campId) {
  const camp = CAMP_CATALOG[campId];
  if (!camp) throw new Error('Unknown campId');

  const stripe = getStripe();
  const prices = await stripe.prices.list({
    product: camp.productId,
    active: true,
    limit: 100,
    expand: ['data.product'],
  });

  const oneTime = prices.data.filter((p) => p.type === 'one_time' && p.unit_amount != null);
  const picked = oneTime.find((p) => p.currency === 'usd') || oneTime[0];
  if (!picked) throw new Error('No active one-time price found for this product.');

  return {
    campId,
    campName: camp.name,
    productId: camp.productId,
    priceId: picked.id,
    amountCents: picked.unit_amount,
    currency: picked.currency,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const campId = String(req.query?.campId || '').trim();
    if (!campId) return res.status(400).send('Missing campId');

    const out = await resolvePriceForCamp(campId);
    return res.status(200).json(out);
  } catch (e) {
    console.error('[stripe] camp-price failed', e);
    return res.status(400).send(e?.message || 'Bad Request');
  }
}