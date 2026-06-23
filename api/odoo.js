const ODOO = 'https://retailasyou.odoo.com'
const API_KEY = 'b6397567586fb28ce324157bf57a60a97d37b01e'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const { model, method, args = [], kwargs = {} } = req.body?.params || {}
    
    // Usar API REST de Odoo en lugar de JSON-RPC
    const endpoint = `${ODOO}/api/method/${model}/${method}`
    console.log('CALLING:', endpoint)
    
    const callRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ args, kwargs })
    })
    const text = await callRes.text()
    console.log('STATUS:', callRes.status, 'RESPONSE:', text.substring(0, 300))
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(text)
  } catch (e) {
    console.log('ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
