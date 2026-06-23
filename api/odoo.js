const ODOO = 'https://retailasyou.odoo.com'
const API_KEY = 'b6397567586fb28ce324157bf57a60a97d37b01e'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const callRes = await fetch(`${ODOO}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(API_KEY + ':').toString('base64')}`
      },
      body: JSON.stringify(req.body)
    })
    console.log('STATUS:', callRes.status)
    const text = await callRes.text()
    console.log('RESPONSE:', text.substring(0, 300))
    res.status(200).send(text)
  } catch (e) {
    console.log('ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
