// api/toilets.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { lat, lng, radius } = req.query;

  if (!lat || !lng || !radius) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  // サーバー側で最も負荷が少なく高速に通る構文
  const query = `[out:json][timeout:10];node["amenity"="toilets"](around:${radius},${lat},${lng});out;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'RESTSTOP-Radar/1.0'
        },
        body: new URLSearchParams({ data: query }).toString()
      });

      if (!response.ok) continue;

      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      // 次のミラーサーバーへフォールバック
    }
  }

  return res.status(502).json({ error: 'All Overpass servers failed' });
}
