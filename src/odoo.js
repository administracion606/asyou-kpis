const BASE = '/odoo'
const DB = 'retailasyou'
const USER = 'administracion@martinamodacolombia.com'
const PASS = 'Martina123.'

let uid = null

export async function autenticar() {
  const res = await fetch(`${BASE}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { db: DB, login: USER, password: PASS } })
  })
  const data = await res.json()
  if (!data.result?.uid) throw new Error('Autenticación fallida')
  uid = data.result.uid
  return uid
}

export async function call(model, method, args, kwargs = {}) {
  if (!uid) await autenticar()
  const res = await fetch(`${BASE}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: 1, params: { model, method, args, kwargs } })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.data?.message || data.error.message)
  return data.result
}

export function resetUid() { uid = null }
