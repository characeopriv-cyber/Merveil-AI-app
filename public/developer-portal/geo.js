// Vercel serverless: GET /api/geo
export default function handler(req, res) {
  const country = (req.headers['x-vercel-ip-country'] || 'US').toUpperCase();
  const map = {
    KE: { currency: 'KES', lang: 'sw' }, NG: { currency: 'NGN', lang: 'en' },
    AE: { currency: 'AED', lang: 'ar' }, SA: { currency: 'SAR', lang: 'ar' },
    DE: { currency: 'EUR', lang: 'de' }, FR: { currency: 'EUR', lang: 'fr' },
    GB: { currency: 'GBP', lang: 'en' }, IN: { currency: 'INR', lang: 'hi' },
    US: { currency: 'USD', lang: 'en' },
  };
  const g = map[country] || map.US;
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.status(200).json({ country, currency: g.currency, lang: g.lang });
}
