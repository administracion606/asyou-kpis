const ODOO = 'https://retailasyou.odoo.com'
const DB = 'retailasyou'
const USER = 'administracion@martinamodacolombia.com'
const PASS = 'Martina123.'

let sessionId = null

async function authenticate() {
  const res = await fetch(`${ODOO}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc:'2.0', method:'call', id:1, params: { db: DB, login: USER, password: PASS } })
  })
  const data = await res.json()
  if (!data.result?.uid) throw new Error('Auth failed: ' + JSON.stringify(data.error || data.result))
  sessionId = data.result.session_id
  return sessionId
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  try {
    if (!sessionId) await authenticate()
    const body = { ...req.body }
    if (body.params) body.params = { ...body.params, session_id: sessionId }
    const response = await fetch(`${ODOO}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_id=${sessionId}`
      },
      body: JSON.stringify(body)
    })
    const data = await response.json()
    if (data.error?.data?.name?.includes('AccessDenied')) {
      sessionId = null
      throw new Error('Session expired, retry')
    }
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
