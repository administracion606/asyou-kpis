import { useState, useEffect, useCallback } from 'react'
import { call, autenticar, resetUid } from './odoo.js'
import './App.css'

const TIENDAS = [
  { name: 'Parque Fabricato', key: 'fabricato', meta: 50000000, color: '#1D9E75' },
  { name: 'Nuestro Montería', key: 'monteria',  meta: 50000000, color: '#378ADD' },
  { name: 'Caribe Plaza',     key: 'caribe',    meta: 50000000, color: '#7F77DD' },
]

function fmt(n) { return '$' + Math.round(n).toLocaleString('es-CO') }
function fmtM(n) { return '$' + (n / 1000000).toFixed(1) + 'M' }
function getToday() { return new Date().toISOString().split('T')[0] }
function matchTienda(name, key) {
  const n = (name || '').toLowerCase()
  if (key === 'fabricato') return n.includes('fabricato')
  if (key === 'monteria')  return n.includes('monter')
  if (key === 'caribe')    return n.includes('caribe')
  return false
}

function BarraProgreso({ pct, color }) {
  return (
    <div style={{ background: '#2a2a2a', borderRadius: 4, height: 10, overflow: 'hidden', margin: '6px 0 12px' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 1s ease' }} />
    </div>
  )
}

function TiendaCard({ tienda }) {
  const pct = Math.round((tienda.ventas / tienda.meta) * 100)
  const color = pct >= 100 ? '#1D9E75' : pct >= 70 ? '#378ADD' : pct >= 40 ? '#EF9F27' : '#E24B4A'
  const ticket = tienda.trans > 0 ? fmt(tienda.ventas / tienda.trans) : '—'
  const upt = tienda.trans > 0 ? (tienda.items / tienda.trans).toFixed(1) : '—'
  return (
    <div className="tienda-card">
      <div className="tienda-nombre">{tienda.name}</div>
      <div className="tienda-header">
        <span className="tienda-ventas">{fmtM(tienda.ventas)}</span>
        <span className="tienda-pct" style={{ color }}>{pct}%</span>
      </div>
      <BarraProgreso pct={pct} color={color} />
      <div className="kpi-grid">
        <div className="kpi-box"><div className="kpi-lbl">Transacciones</div><div className="kpi-val">{tienda.trans}</div></div>
        <div className="kpi-box"><div className="kpi-lbl">Ticket prom.</div><div className="kpi-val">{ticket}</div></div>
        <div className="kpi-box"><div className="kpi-lbl">UPT</div><div className="kpi-val">{upt}</div></div>
        <div className="kpi-box"><div className="kpi-lbl">Falta</div><div className="kpi-val" style={{ color: pct >= 100 ? '#1D9E75' : '#EF9F27' }}>{pct >= 100 ? '✓' : fmtM(Math.max(0, tienda.meta - tienda.ventas))}</div></div>
      </div>
    </div>
  )
}

export default function App() {
  const [estado, setEstado] = useState('loading')
  const [error, setError] = useState('')
  const [datos, setDatos] = useState(null)
  const [ultimaAct, setUltimaAct] = useState('')

  const cargarDatos = useCallback(async () => {
    setEstado('loading')
    try {
      const today = getToday()
      const orders = await call('pos.order', 'search_read',
        [[['date_order', '>=', today + ' 00:00:00'], ['date_order', '<=', today + ' 23:59:59'], ['state', 'in', ['paid', 'done', 'invoiced']]]],
        { fields: ['amount_total', 'lines', 'session_id'], limit: 2000 }
      )
      const sessionIds = [...new Set(orders.map(o => o.session_id[0]).filter(Boolean))]
      const sessions = sessionIds.length ? await call('pos.session', 'search_read', [[['id', 'in', sessionIds]]], { fields: ['id', 'config_id'] }) : []
      const configIds = [...new Set(sessions.map(s => s.config_id[0]).filter(Boolean))]
      const configs = configIds.length ? await call('pos.config', 'search_read', [[['id', 'in', configIds]]], { fields: ['id', 'name'] }) : []
      const sesConfig = {}
      sessions.forEach(s => { sesConfig[s.id] = configs.find(c => c.id === s.config_id[0])?.name || '' })
      const allLineIds = orders.flatMap(o => o.lines)
      const itemsByOrder = {}
      if (allLineIds.length) {
        const lines = await call('pos.order.line', 'search_read', [[['id', 'in', allLineIds]]], { fields: ['qty', 'order_id'], limit: 5000 })
        lines.forEach(l => { itemsByOrder[l.order_id[0]] = (itemsByOrder[l.order_id[0]] || 0) + l.qty })
      }
      const tiendas = TIENDAS.map(t => {
        const tOrders = orders.filter(o => matchTienda(sesConfig[o.session_id[0]], t.key))
        return { ...t, ventas: tOrders.reduce((s, o) => s + o.amount_total, 0), trans: tOrders.length, items: tOrders.reduce((s, o) => s + (itemsByOrder[o.id] || 0), 0) }
      })
      const tv = tiendas.reduce((s, t) => s + t.ventas, 0)
      const tt = tiendas.reduce((s, t) => s + t.trans, 0)
      const ti = tiendas.reduce((s, t) => s + t.items, 0)
      setDatos({ tiendas, tv, tt, ti, cumpl: Math.round((tv / 150000000) * 100) })
      setEstado('ok')
      setUltimaAct(new Date().toLocaleTimeString('es-CO'))
      setError('')
    } catch (e) {
      resetUid()
      setEstado('error')
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
    const interval = setInterval(cargarDatos, 60000)
    return () => clearInterval(interval)
  }, [cargarDatos])

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-left">
          <span className="marca">AS-YOU Martina</span>
          <span className="subtitulo">Dashboard de ventas</span>
        </div>
        <div className="topbar-right">
          <span className={`badge ${estado}`}>{estado === 'ok' ? '● En línea' : estado === 'error' ? '● Error' : '● Cargando'}</span>
          {ultimaAct && <span className="update-time">Actualizado {ultimaAct}</span>}
          <button className="btn-refresh" onClick={cargarDatos}>↻ Actualizar</button>
        </div>
      </div>

      {error && <div className="error-bar">Error al conectar con Odoo: {error}</div>}

      {datos && (
        <>
          <div className="resumen-grid">
            <div className="res-card">
              <div className="res-lbl">Ventas totales hoy</div>
              <div className="res-val">{fmtM(datos.tv)}</div>
              <div className="res-sub">{datos.tt} transacciones</div>
            </div>
            <div className="res-card">
              <div className="res-lbl">Ticket promedio</div>
              <div className="res-val">{datos.tt > 0 ? fmt(datos.tv / datos.tt) : '—'}</div>
              <div className="res-sub">todas las tiendas</div>
            </div>
            <div className="res-card">
              <div className="res-lbl">UPT promedio</div>
              <div className="res-val">{datos.tt > 0 ? (datos.ti / datos.tt).toFixed(1) : '—'}</div>
              <div className="res-sub">unidades/transacción</div>
            </div>
            <div className="res-card" style={{ borderColor: datos.cumpl >= 100 ? '#1D9E75' : datos.cumpl >= 70 ? '#378ADD' : '#EF9F27' }}>
              <div className="res-lbl">Cumplimiento red</div>
              <div className="res-val" style={{ color: datos.cumpl >= 100 ? '#1D9E75' : datos.cumpl >= 70 ? '#378ADD' : '#EF9F27' }}>{datos.cumpl}%</div>
              <div className="res-sub">meta: $150.000.000</div>
            </div>
          </div>

          <div className="section-title">Cumplimiento por tienda</div>
          <div className="tiendas-grid">
            {datos.tiendas.map(t => <TiendaCard key={t.key} tienda={t} />)}
          </div>
        </>
      )}

      <div className="footer">
        {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </div>
    </div>
  )
}
