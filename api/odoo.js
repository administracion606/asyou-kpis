export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const path = req.query.path || '/web/dataset/call_kw'
    const response = await fetch('https://retailasyou.odoo.com' + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('b6397567586fb28ce324157bf57a60a97d37b01e:').toString('base64')
      },
      body: JSON.stringify(req.body)
    })
    const data = await response.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
