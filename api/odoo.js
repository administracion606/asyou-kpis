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
    const authRes = await fetch(`${ODOO}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc:'2.0', method:'call', id:1, params: { db: DB, login: USER, password: PASS } })
    })
    const authData = await authRes.json()
    console.log('AUTH RESULT:', JSON.stringify(authData).substring(0, 500))
    console.log('AUTH COOKIES:', authRes.headers.get('set-cookie'))
    
    if (!authData.result?.uid) {
      return res.status(500).json({ error: 'Auth failed', detail: authData })
    }
    
    const sessionId = authData.result.session_id
    const setCookie = authRes.headers.get('set-cookie') || ''
    console.log('SESSION ID:', sessionId)

    const callRes = await fetch(`${ODOO}/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session_id=${sessionId}`
      },
      body: JSON.stringify(req.body)
    })
    const data = await callRes.json()
    console.log('CALL RESULT:', JSON.stringify(data).substring(0, 200))
    res.status(200).json(data)
  } catch (e) {
    console.log('ERROR:', e.message)
    res.status(500).json({ error: e.message })
  }
}
