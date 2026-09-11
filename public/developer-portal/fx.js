export default async function handler(_req, res) {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    const j = await r.json();
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=21600');
    res.status(200).json(j.rates || {});
  } catch {
    res.status(200).json({});
  }
}
