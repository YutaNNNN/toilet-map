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

  // node（点）と way（駅・建物内）の両方を網羅する完全クエリ
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="toilets"](around:${radius},${lat},${lng});
      way["amenity"="toilets"](around:${radius},${lat},${lng});
    );
    out center qt;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  // 複数サーバーに同時リクエストし、最速で返ってきた結果を採用（Fastest-Wins）
  const fetchPromises = endpoints.map(url =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'RESTSTOP-Radar/1.0'
      },
      body: new URLSearchParams({ data: query }).toString()
    }).then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    })
  );

  try {
    const data = await Promise.any(fetchPromises);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'All Overpass gateways timed out or failed' });
  }
}
