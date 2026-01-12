export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) return res.status(500).send('Missing STRIPE_PUBLISHABLE_KEY');

  return res.status(200).json({ publishableKey: key });
}