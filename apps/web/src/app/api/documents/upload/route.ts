import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, user_documents } from '@empresa-ia/db'
import { extractDocument, getConfidence, getDocType, type SupportedMimeType } from '@empresa-ia/core/ocr'
import { ingestDocument } from '@empresa-ia/core/rag'
import { eq } from 'drizzle-orm'

const SUPPORTED_MIME_TYPES: SupportedMimeType[] = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

// Para dev: el tenantId viene del header o del env
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Parsear multipart
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Request inválido — se espera multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const hint = (formData.get('hint') as string | null) ?? undefined // 'invoice' | 'generic'
  const tenantId = (formData.get('tenantId') as string | null) ?? DEMO_TENANT_ID

  if (!file) {
    return NextResponse.json({ error: 'Falta el campo "file"' }, { status: 400 })
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Falta tenantId' }, { status: 400 })
  }

  // Validar tipo MIME
  const mimeType = file.type as SupportedMimeType
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    return NextResponse.json({
      error: `Tipo de archivo no soportado: ${file.type}. Soportados: ${SUPPORTED_MIME_TYPES.join(', ')}`,
    }, { status: 400 })
  }

  // Validar tamaño
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({
      error: `Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 10 MB`,
    }, { status: 400 })
  }

  // Crear registro en DB con status 'processing'
  const [docRecord] = await db.insert(user_documents).values({
    tenant_id: tenantId,
    name: file.name,
    mime_type: mimeType,
    size_bytes: file.size,
    status: 'processing',
    uploaded_by: userId,
    vertical: 'contadores',
  }).returning()

  if (!docRecord) {
    return NextResponse.json({ error: 'Error al crear registro en DB' }, { status: 500 })
  }

  try {
    // Leer buffer del archivo
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // ── OCR con Claude ──────────────────────────────────────────────────────
    const result = await extractDocument(
      buffer,
      mimeType,
      hint as 'invoice' | 'generic' | undefined,
    )

    if (result.type === 'error') {
      await db.update(user_documents)
        .set({ status: 'failed', error: result.error, processed_at: new Date() })
        .where(eq(user_documents.id, docRecord.id))

      return NextResponse.json({
        id: docRecord.id,
        status: 'failed',
        error: result.error,
      }, { status: 422 })
    }

    const confidence = getConfidence(result)
    const docType = getDocType(result)

    // ── Guardar resultado en DB ─────────────────────────────────────────────
    await db.update(user_documents)
      .set({
        status: 'done',
        doc_type: docType,
        extracted: result.raw as Record<string, unknown>,
        validated: result.data as Record<string, unknown>,
        confidence,
        processed_at: new Date(),
      })
      .where(eq(user_documents.id, docRecord.id))

    // ── Embeddings para RAG (si confianza suficiente) ───────────────────────
    let embeddedDocId: string | undefined
    if (confidence >= 60) {
      try {
        const textForRag = buildRagText(result)
        const { documentId } = await ingestDocument({
          tenantId,
          title: file.name,
          content: textForRag,
          type: docType === 'invoice' ? 'invoice' : 'document',
          vertical: 'contadores',
        })
        embeddedDocId = documentId
        await db.update(user_documents)
          .set({ embedded: true, document_id: documentId })
          .where(eq(user_documents.id, docRecord.id))
      } catch {
        // El embedding es best-effort — no falla la request si falla
      }
    }

    return NextResponse.json({
      id: docRecord.id,
      status: 'done',
      doc_type: docType,
      confidence,
      data: result.data,
      embedded: !!embeddedDocId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error inesperado en procesamiento'
    await db.update(user_documents)
      .set({ status: 'failed', error: message, processed_at: new Date() })
      .where(eq(user_documents.id, docRecord.id))

    return NextResponse.json({ id: docRecord.id, status: 'failed', error: message }, { status: 500 })
  }
}

// Construye el texto para RAG a partir del resultado OCR
function buildRagText(result: { type: string; data: Record<string, unknown> }): string {
  if (result.type === 'invoice') {
    const d = result.data as Record<string, unknown>
    const emisor   = (d['emisor'] as Record<string, string> | null) ?? {}
    const receptor = (d['receptor'] as Record<string, string> | null) ?? {}
    const lines = [
      `Tipo: ${d['tipo_comprobante'] ?? ''} ${d['letra'] ?? ''}`.trim(),
      `Número: ${d['numero_completo'] ?? ''}`,
      `Fecha: ${d['fecha_emision'] ?? ''}`,
      `Período fiscal: ${d['periodo_fiscal'] ?? ''}`,
      `Emisor: ${emisor['razon_social'] ?? ''} CUIT ${emisor['cuit'] ?? ''}`,
      `Receptor: ${receptor['razon_social'] ?? ''} CUIT ${receptor['cuit'] ?? ''}`,
      `Neto: ${d['subtotal_neto'] ?? ''} | IVA: ${d['importe_iva'] ?? ''} | Total: ${d['importe_total'] ?? ''}`,
      `CAE: ${d['cae'] ?? 'sin CAE'}`,
      d['observaciones'] ? `Observaciones: ${d['observaciones']}` : '',
    ]
    return lines.filter(Boolean).join('\n')
  }
  const d = result.data as Record<string, unknown>
  return `${d['doc_type'] ?? 'Documento'}\n${d['summary'] ?? ''}\n${JSON.stringify(d['key_data'] ?? {})}`
}
