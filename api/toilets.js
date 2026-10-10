export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lng, radius } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const query = `[out:json][timeout:15];node["amenity"="toilets"](around:${radius},${lat},${lng});out qt;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query)
      });

      if (!response.ok) continue;

      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      // 次のサーバーを試行
    }
  }

  return res.status(502).json({ error: 'Overpass gateways failed' });
}
