import { db, cnt_vat_records, cnt_clients } from '@empresa-ia/db'
import { eq, and, sql, sum, count, desc } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

const CURRENT_PERIOD = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

async function getVatRecords(tenantId: string, period: string) {
  return db
    .select({
      id: cnt_vat_records.id,
      client_id: cnt_vat_records.client_id,
      type: cnt_vat_records.type,
      invoice_number: cnt_vat_records.invoice_number,
      invoice_date: cnt_vat_records.invoice_date,
      cuit_counterpart: cnt_vat_records.cuit_counterpart,
      name_counterpart: cnt_vat_records.name_counterpart,
      net_amount: cnt_vat_records.net_amount,
      vat_amount: cnt_vat_records.vat_amount,
      total_amount: cnt_vat_records.total_amount,
      vat_rate: cnt_vat_records.vat_rate,
    })
    .from(cnt_vat_records)
    .where(and(eq(cnt_vat_records.tenant_id, tenantId), eq(cnt_vat_records.period, period)))
    .orderBy(desc(cnt_vat_records.invoice_date))
    .limit(100)
}

async function getVatSummary(tenantId: string, period: string) {
  const rows = await db
    .select({
      type: cnt_vat_records.type,
      totalNet: sum(cnt_vat_records.net_amount),
      totalVat: sum(cnt_vat_records.vat_amount),
      qty: count(),
    })
    .from(cnt_vat_records)
    .where(and(eq(cnt_vat_records.tenant_id, tenantId), eq(cnt_vat_records.period, period)))
    .groupBy(cnt_vat_records.type)

  const sales   = rows.find((r) => r.type === 'sale')
  const purchases = rows.find((r) => r.type === 'purchase')

  const vatSales     = Number(sales?.totalVat ?? 0)
  const vatPurchases = Number(purchases?.totalVat ?? 0)

  return {
    sales:     { net: Number(sales?.totalNet ?? 0),     vat: vatSales,     qty: Number(sales?.qty ?? 0) },
    purchases: { net: Number(purchases?.totalNet ?? 0), vat: vatPurchases, qty: Number(purchases?.qty ?? 0) },
    balance:   vatSales - vatPurchases,
  }
}

function fmt(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2 })
}

export default async function IvaPage() {
  const tenantId = DEMO_TENANT_ID

  if (!tenantId) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Libro IVA</h2>
        <p className="text-muted-foreground">Configurá DEMO_TENANT_ID en .env.local para ver datos.</p>
      </div>
    )
  }

  const [records, summary] = await Promise.all([
    getVatRecords(tenantId, CURRENT_PERIOD),
    getVatSummary(tenantId, CURRENT_PERIOD),
  ])

  const sales     = records.filter((r) => r.type === 'sale')
  const purchases = records.filter((r) => r.type === 'purchase')

  const periodLabel = new Date(CURRENT_PERIOD + '-01').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Libro IVA</h2>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{periodLabel}</p>
        </div>
        <div className="flex gap-2 text-xs font-medium">
          <span className="bg-muted text-muted-foreground px-3 py-1.5 rounded-lg">← Mes anterior</span>
          <span className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg">{CURRENT_PERIOD}</span>
        </div>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ventas</p>
          <p className="text-2xl font-bold text-green-600">${fmt(summary.sales.net)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            IVA débito: ${fmt(summary.sales.vat)} · {summary.sales.qty} comprobantes
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Compras</p>
          <p className="text-2xl font-bold text-blue-600">${fmt(summary.purchases.net)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            IVA crédito: ${fmt(summary.purchases.vat)} · {summary.purchases.qty} comprobantes
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${summary.balance >= 0 ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Saldo IVA</p>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-orange-600' : 'text-green-600'}`}>
            ${fmt(Math.abs(summary.balance))}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.balance >= 0 ? 'A pagar (débito > crédito)' : 'A favor (crédito > débito)'}
          </p>
        </div>
      </div>

      {/* Libro de Ventas */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          Libro de Ventas ({sales.length})
        </h3>
        <VatTable records={sales} />
      </section>

      {/* Libro de Compras */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          Libro de Compras ({purchases.length})
        </h3>
        <VatTable records={purchases} />
      </section>
    </div>
  )
}

function VatTable({ records }: {
  records: Array<{
    id: string
    invoice_number: string
    invoice_date: string
    cuit_counterpart: string | null
    name_counterpart: string | null
    net_amount: string
    vat_amount: string
    total_amount: string
    vat_rate: string | null
  }>
}) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
        Sin comprobantes en este período.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Comprobante</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">CUIT</th>
            <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Razón social</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Neto</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">IVA</th>
            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map((r) => (
            <tr key={r.id} className="hover:bg-muted/20">
              <td className="px-4 py-2.5 font-mono text-xs">{r.invoice_number}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {new Date(r.invoice_date + 'T00:00:00').toLocaleDateString('es-AR')}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground hidden md:table-cell">
                {r.cuit_counterpart ?? '—'}
              </td>
              <td className="px-4 py-2.5 hidden lg:table-cell max-w-[180px] truncate">
                {r.name_counterpart ?? '—'}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs">${Number(r.net_amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-2.5 text-right font-mono text-xs text-muted-foreground">
                ${Number(r.vat_amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                {r.vat_rate && <span className="ml-1 text-xs">({r.vat_rate}%)</span>}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs font-semibold">
                ${Number(r.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
