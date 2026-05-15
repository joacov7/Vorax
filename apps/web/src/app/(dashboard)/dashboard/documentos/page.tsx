import { db, user_documents } from '@empresa-ia/db'
import { eq, desc } from 'drizzle-orm'
import { DocumentUploader } from './uploader'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

async function getDocuments(tenantId: string) {
  if (!tenantId) return []
  return db
    .select({
      id: user_documents.id,
      name: user_documents.name,
      mime_type: user_documents.mime_type,
      size_bytes: user_documents.size_bytes,
      doc_type: user_documents.doc_type,
      status: user_documents.status,
      confidence: user_documents.confidence,
      validated: user_documents.validated,
      embedded: user_documents.embedded,
      error: user_documents.error,
      processed_at: user_documents.processed_at,
      created_at: user_documents.created_at,
    })
    .from(user_documents)
    .where(eq(user_documents.tenant_id, tenantId))
    .orderBy(desc(user_documents.created_at))
    .limit(50)
}

const STATUS_STYLE: Record<string, string> = {
  processing: 'bg-yellow-50 text-yellow-700',
  done:       'bg-green-50 text-green-700',
  failed:     'bg-red-50 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  processing: 'Procesando…',
  done:       'Listo',
  failed:     'Error',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  invoice:        'Factura / Comprobante',
  bank_statement: 'Extracto Bancario',
  contract:       'Contrato',
  certificate:    'Certificado',
  receipt:        'Recibo',
  other:          'Otro',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

type Doc = Awaited<ReturnType<typeof getDocuments>>[number]

function InvoicePreview({ data }: { data: Record<string, unknown> }) {
  const emisor   = data['emisor'] as Record<string, string> | null
  const receptor = data['receptor'] as Record<string, string> | null

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs border-t pt-3">
      <div>
        <p className="text-muted-foreground mb-0.5">Comprobante</p>
        <p className="font-mono font-semibold">{String(data['numero_completo'] ?? '—')}</p>
        <p className="text-muted-foreground">{String(data['tipo_comprobante'] ?? '')} {String(data['letra'] ?? '')}</p>
      </div>
      <div>
        <p className="text-muted-foreground mb-0.5">Fecha</p>
        <p className="font-semibold">{String(data['fecha_emision'] ?? '—')}</p>
        <p className="text-muted-foreground">Período: {String(data['periodo_fiscal'] ?? '—')}</p>
      </div>
      {emisor && (
        <div>
          <p className="text-muted-foreground mb-0.5">Emisor</p>
          <p className="font-semibold truncate">{emisor['razon_social'] ?? '—'}</p>
          <p className="font-mono text-muted-foreground">{emisor['cuit'] ?? ''}</p>
        </div>
      )}
      {receptor && (
        <div>
          <p className="text-muted-foreground mb-0.5">Receptor</p>
          <p className="font-semibold truncate">{receptor['razon_social'] ?? '—'}</p>
          <p className="font-mono text-muted-foreground">{receptor['cuit'] ?? ''}</p>
        </div>
      )}
      <div className="col-span-2 border-t pt-2 flex gap-6">
        <div>
          <p className="text-muted-foreground">Neto</p>
          <p className="font-semibold">${Number(data['subtotal_neto'] ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-muted-foreground">IVA ({String(data['alicuota_iva'] ?? '')}%)</p>
          <p className="font-semibold">${Number(data['importe_iva'] ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-muted-foreground font-semibold">Total</p>
          <p className="font-bold text-sm">${Number(data['importe_total'] ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
        </div>
        {data['cae'] && (
          <div className="ml-auto text-right">
            <p className="text-muted-foreground">CAE</p>
            <p className="font-mono text-xs">{String(data['cae'])}</p>
          </div>
        )}
      </div>
      {(data['_warnings'] as string[] | undefined)?.length ? (
        <div className="col-span-2">
          {(data['_warnings'] as string[]).map((w, i) => (
            <p key={i} className="text-orange-600 text-xs">⚠ {w}</p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DocumentRow({ doc }: { doc: Doc }) {
  const validated = doc.validated as Record<string, unknown> | null

  return (
    <div className="border rounded-xl bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        {/* Ícono y nombre */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
            {doc.mime_type === 'application/pdf' ? '📄' : '🖼'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{doc.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(doc.size_bytes)}
              {doc.doc_type && ` · ${DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}`}
            </p>
          </div>
        </div>

        {/* Status + confianza */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[doc.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[doc.status] ?? doc.status}
          </span>
          {doc.confidence !== null && doc.confidence !== undefined && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${doc.confidence >= 80 ? 'bg-green-500' : doc.confidence >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
                  style={{ width: `${doc.confidence}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{doc.confidence}%</span>
            </div>
          )}
          {doc.embedded && (
            <span className="text-xs text-blue-600 font-medium">✦ En RAG</span>
          )}
        </div>
      </div>

      {/* Datos extraídos */}
      {doc.status === 'done' && validated && doc.doc_type === 'invoice' && (
        <InvoicePreview data={validated} />
      )}

      {doc.status === 'done' && validated && doc.doc_type !== 'invoice' && (
        <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">{String((validated as { doc_type?: string })['doc_type'] ?? 'Documento')}</p>
          <p>{String((validated as { summary?: string })['summary'] ?? '')}</p>
        </div>
      )}

      {doc.status === 'failed' && doc.error && (
        <p className="mt-3 text-xs text-red-600 border-t pt-3">
          ⚠ {doc.error}
        </p>
      )}

      <p className="text-xs text-muted-foreground mt-3">
        {doc.processed_at
          ? `Procesado ${new Date(doc.processed_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
          : `Subido ${new Date(doc.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
        }
      </p>
    </div>
  )
}

export default async function DocumentosPage() {
  const tenantId = DEMO_TENANT_ID
  const docs = await getDocuments(tenantId)

  const stats = {
    total: docs.length,
    done: docs.filter((d) => d.status === 'done').length,
    invoices: docs.filter((d) => d.doc_type === 'invoice').length,
    embedded: docs.filter((d) => d.embedded).length,
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Documentos OCR</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Subí facturas, comprobantes o documentos — la IA extrae los datos automáticamente.
          </p>
        </div>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total procesados', value: stats.total },
            { label: 'Exitosos', value: stats.done },
            { label: 'Facturas', value: stats.invoices },
            { label: 'En base RAG', value: stats.embedded },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Uploader — client component */}
      <DocumentUploader tenantId={tenantId} />

      {/* Lista */}
      {docs.length === 0 ? (
        <div className="rounded-xl border bg-muted/20 p-12 text-center mt-6">
          <p className="text-3xl mb-3">📂</p>
          <p className="font-semibold text-muted-foreground">Todavía no subiste documentos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Usá el área de arriba para subir tu primera factura o comprobante.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Documentos recientes ({docs.length})
          </h3>
          {docs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
