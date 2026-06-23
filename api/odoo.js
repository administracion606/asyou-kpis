const ODOO = 'https://retailasyou.odoo.com'
const API_KEY = 'b6397567586fb28ce324157bf57a60a97d37b01e'

async function odooGet(model, domain, fields, limit = 500) {
  const params = new URLSearchParams()
  params.append('domain', JSON.stringify(domain))
  params.append('fields', JSON.stringify(fields))
  params.append('limit', limit)
  
  const res = await fetch(`${ODOO}/api/${model}?${params}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  })
  const text = await res.text()
  console.log(`GET ${model} STATUS:`, res.status, 'RESP:', text.substring(0, 200))
  return JSON.parse(text)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    const today = new Date().toISOString().split('T')[0]
    const orders = await odooGet('pos.order', 
      [['date_order', '>=', today + ' 00:00:00'], ['state', 'in', ['paid','done','invoiced']]],
      ['amount_total', 'session_id', 'lines']
    )
    res.status(200).json({ result: orders })
  } catch (e) {
    console.log('ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
