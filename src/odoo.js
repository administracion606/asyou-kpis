export async function call(model, method, args, kwargs = {}) {
  const res = await fetch(`/api/odoo?path=${encodeURIComponent('/web/dataset/call_kw')}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', method: 'call', id: 1,
      params: { model, method, args, kwargs }
    })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.data?.message || data.error.message)
  return data.result
}

export function resetUid() {}
