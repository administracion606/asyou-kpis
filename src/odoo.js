const DB = 'retailasyou'
const USER = 'administracion@martinamodacolombia.com'
const PASS = 'Martina123.'

let uid = null
let sessionCookie = null

async function proxyCall(odooPath, body) {
  const res = await fetch(`/api/odoo?path=${encodeURIComponent(odooPath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return res.json()
}

export async function autenticar() {
  const data = await proxyCall('/web/session/authenticate', {
    jsonrpc: '2.0', method: 'call',
    params: { db: DB, login: USER, password: PASS }
  })
  if (!data.result?.uid) throw new Error('Autenticación fallida: ' + JSON.stringify(data.error || data))
  uid = data.result.uid
  sessionCookie = data.result.session_id
  return uid
}

export async function call(model, method, args, kwargs = {}) {
  if (!uid) await autenticar()
  const data = await proxyCall('/web/dataset/call_kw', {
    jsonrpc: '2.0', method: 'call', id: 1,
    params: { model, method, args, kwargs, session_id: sessionCookie }
  })
  if (data.error) throw new Error(data.error.data?.message || data.error.message)
  return data.result
}

export function resetUid() { uid = null; sessionCookie = null }
