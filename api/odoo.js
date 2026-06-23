const ODOO = 'https://retailasyou.odoo.com'
const DB = 'retailasyou'
const USER = 'administracion@martinamodacolombia.com'
const PASS = 'Martina123.'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // Autenticar en cada llamada (stateless)
    const authRes = await fetch(`${ODOO}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', method:'call', id:1, params: { db: DB, login: USER, password: PASS } })
    })
    const authData = await authRes.json()
    if (!authData.result?.uid) throw new Error('Auth failed: ' + JSON.stringify(authData.error || 'no uid'))
    
    const sessionId = authData.result.session_id
    const cookie = authRes.headers.get('set-cookie') || `session_id=${sessionId}`

    // Hacer la llamada real
    const callRes = await fetch(`${ODOO}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie
      },
      body: JSON.stringify(req.body)
    })
    const data = await callRes.json()
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
