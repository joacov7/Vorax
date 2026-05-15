import Anthropic from '@anthropic-ai/sdk'
import { invoiceSchema, genericDocSchema, type OcrResult, type SupportedMimeType } from './types'

const client = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] })

const INVOICE_SYSTEM_PROMPT = `Sos un sistema OCR especializado en comprobantes fiscales argentinos.
Tu tarea es extraer todos los datos de la imagen o PDF y retornar un JSON estructurado.

TIPOS DE COMPROBANTE QUE RECONOCÉS:
- Facturas: FA, FB, FC, FE, FM (letra A, B, C, E, M)
- Notas de Débito: NDA, NDB, NDC
- Notas de Crédito: NCA, NCB, NCC
- Recibos: RA, RB, RC
- Tickets y tiques (sin CAE visible)

REGLAS CRÍTICAS:
1. Extraé el CUIT SIEMPRE sin guiones (solo 11 dígitos)
2. Los importes son números decimales, punto como separador decimal
3. Si el total no coincide con neto+IVA, reportalo en _warnings
4. Fecha formato 'YYYY-MM-DD' siempre
5. Si no podés leer un campo, usá null — nunca inventes datos
6. tipo_operacion: 'sale' si la empresa es el EMISOR, 'purchase' si es el RECEPTOR
7. _confidence: 0-100 según claridad del documento

RETORNÁ ÚNICAMENTE el JSON, sin markdown, sin explicación.`

const GENERIC_SYSTEM_PROMPT = `Sos un sistema OCR y analista de documentos.
Analizá el documento y retorná un JSON con la siguiente estructura:
{
  "doc_type": tipo de documento (bank_statement | contract | certificate | invoice | receipt | id | other),
  "date": fecha principal del documento (YYYY-MM-DD o null),
  "entity": entidad que emite o firma (nombre o null),
  "summary": resumen en español de qué trata el documento (1-3 oraciones),
  "key_data": objeto con los datos más importantes extraídos (montos, números, fechas, nombres),
  "_confidence": 0-100 según legibilidad
}
Retorná ÚNICAMENTE el JSON, sin markdown.`

const INVOICE_USER_PROMPT = `Extraé todos los datos de este comprobante fiscal argentino.
Retorná el JSON con exactamente esta estructura:
{
  "tipo_comprobante": string o null,
  "letra": string o null,
  "punto_venta": número entero o null,
  "numero": número entero o null,
  "numero_completo": string (ej: "0001-00012345") o null,
  "fecha_emision": "YYYY-MM-DD" o null,
  "fecha_vencimiento": "YYYY-MM-DD" o null,
  "periodo_fiscal": "YYYY-MM" o null,
  "emisor": {
    "razon_social": string o null,
    "cuit": string (11 dígitos sin guiones) o null,
    "condicion_iva": string o null,
    "domicilio": string o null
  },
  "receptor": {
    "razon_social": string o null,
    "cuit": string (11 dígitos sin guiones) o null,
    "condicion_iva": string o null,
    "domicilio": string o null
  },
  "moneda": "ARS" por defecto,
  "tipo_cambio": 1 por defecto,
  "items": [{"descripcion": string, "cantidad": número o null, "precio_unitario": número o null, "subtotal": número o null, "alicuota_iva": número o null}],
  "subtotal_neto": número o null,
  "alicuota_iva": número (21, 10.5, 27, 0) o null,
  "importe_iva": número o null,
  "importe_no_gravado": número o null,
  "importe_exento": número o null,
  "importe_otros": número o null,
  "importe_total": número o null,
  "cae": string o null,
  "cae_vencimiento": "YYYY-MM-DD" o null,
  "tipo_operacion": "sale" | "purchase" | "unknown",
  "observaciones": string o null,
  "_confidence": número 0-100,
  "_warnings": array de strings con inconsistencias detectadas
}`

// ── Determinar si el documento parece una factura ─────────────────────────────
function looksLikeInvoice(text: string): boolean {
  const invoiceKeywords = [
    'factura', 'invoice', 'nota de débito', 'nota de crédito',
    'punto de venta', 'cae', 'afip', 'cuit', 'iva', 'neto gravado',
    'importe total', 'responsable inscripto', 'monotributista',
  ]
  const lower = text.toLowerCase()
  return invoiceKeywords.filter((kw) => lower.includes(kw)).length >= 2
}

// ── Extraer texto de PDF con pdf-parse ───────────────────────────────────────
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
    const result = await pdfParse(buffer)
    return result.text
  } catch {
    return ''
  }
}

// ── Extractor principal ───────────────────────────────────────────────────────
export async function extractDocument(
  buffer: Buffer,
  mimeType: SupportedMimeType,
  hint?: 'invoice' | 'generic',
): Promise<OcrResult> {
  const isPdf  = mimeType === 'application/pdf'
  const isImage = !isPdf

  try {
    // Construir el content block para Claude
    let contentBlock: Anthropic.Messages.ContentBlockParam

    if (isImage) {
      const imageMediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
      contentBlock = {
        type: 'image',
        source: {
          type: 'base64',
          media_type: imageMediaType,
          data: buffer.toString('base64'),
        },
      }
    } else {
      // PDF: extraer texto primero para decidir el prompt
      const pdfText = await extractPdfText(buffer)

      if (!pdfText.trim()) {
        // PDF escaneado sin texto — enviar como imagen usando base64
        // Claude puede procesar PDFs directamente
        contentBlock = {
          type: 'text' as const,
          text: '[Documento PDF escaneado — no se pudo extraer texto. Procesá la imagen del documento.]',
        }
      } else {
        // PDF con texto — enviarlo como texto (más económico y confiable)
        contentBlock = {
          type: 'text',
          text: pdfText.slice(0, 12000), // límite razonable
        }
      }
    }

    // Determinar si es factura
    const isInvoice = hint === 'invoice' ||
      (hint !== 'generic' && isImage) || // images sin hint → intentar como factura primero
      (hint !== 'generic' && isPdf &&
        contentBlock.type === 'text' &&
        looksLikeInvoice((contentBlock as Anthropic.Messages.TextBlockParam).text))

    // ── Llamada a Claude ─────────────────────────────────────────────────────
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: isInvoice ? INVOICE_SYSTEM_PROMPT : GENERIC_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: isInvoice ? INVOICE_USER_PROMPT : 'Analizá este documento.' },
          ],
        },
      ],
    })

    const rawText = response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : ''

    // Limpiar posible markdown ```json ... ```
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

    const raw = JSON.parse(jsonText) as unknown

    if (isInvoice) {
      const parsed = invoiceSchema.safeParse(raw)
      if (!parsed.success) {
        // Si la validación falla, guardamos el raw igual y lo marcamos como error parcial
        const fallback = invoiceSchema.parse({ ...raw as object, _confidence: 0, _warnings: ['Validación parcial fallida'] })
        return { type: 'invoice', data: fallback, raw }
      }
      return { type: 'invoice', data: parsed.data, raw }
    } else {
      const parsed = genericDocSchema.safeParse(raw)
      if (!parsed.success) {
        const fallback = genericDocSchema.parse({ doc_type: 'other', summary: 'No se pudo estructurar el resultado', key_data: raw as Record<string, unknown>, _confidence: 0 })
        return { type: 'generic', data: fallback, raw }
      }
      return { type: 'generic', data: parsed.data, raw }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido en OCR'
    return { type: 'error', error: message }
  }
}

// ── Helpers para el resultado ─────────────────────────────────────────────────
export function getConfidence(result: OcrResult): number {
  if (result.type === 'error') return 0
  return result.data._confidence ?? 0
}

export function getDocType(result: OcrResult): string {
  if (result.type === 'error') return 'error'
  if (result.type === 'invoice') return 'invoice'
  return (result.data as { doc_type: string }).doc_type
}
