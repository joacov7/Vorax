import { z } from 'zod'

// ── CUIT validator ────────────────────────────────────────────────────────────
// Formato: XX-XXXXXXXX-X  o  XXXXXXXXXXX (sin guiones)
const cuitSchema = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (v ? v.replace(/\D/g, '') : v))
  .refine((v) => !v || v.length === 11, { message: 'CUIT debe tener 11 dígitos' })

// ── Sujeto (emisor / receptor) ────────────────────────────────────────────────
const sujetoSchema = z.object({
  razon_social: z.string().nullable().optional(),
  cuit:         cuitSchema,
  condicion_iva: z.string().nullable().optional(), // 'Responsable Inscripto' | 'Monotributista' | ...
  domicilio:     z.string().nullable().optional(),
})

// ── Ítem de factura ──────────────────────────────────────────────────────────
const itemSchema = z.object({
  descripcion:    z.string(),
  cantidad:       z.number().nullable().optional(),
  precio_unitario: z.number().nullable().optional(),
  subtotal:       z.number().nullable().optional(),
  alicuota_iva:   z.number().nullable().optional(), // 0 | 10.5 | 21 | 27
})

// ── Factura Electrónica Argentina ────────────────────────────────────────────
export const invoiceSchema = z.object({
  // Identificación
  tipo_comprobante: z.string().nullable().optional(),     // 'FA' | 'FB' | 'FC' | 'FE' | 'FM' | 'ND' | 'NC' | ...
  letra:            z.string().nullable().optional(),     // 'A' | 'B' | 'C' | 'E' | 'M'
  punto_venta:      z.number().int().nullable().optional(),
  numero:           z.number().int().nullable().optional(),
  numero_completo:  z.string().nullable().optional(),     // '0001-00012345'

  // Fechas
  fecha_emision:    z.string().nullable().optional(),     // 'YYYY-MM-DD'
  fecha_vencimiento: z.string().nullable().optional(),
  periodo_fiscal:   z.string().nullable().optional(),     // 'YYYY-MM'

  // Partes
  emisor:   sujetoSchema.nullable().optional(),
  receptor: sujetoSchema.nullable().optional(),

  // Moneda
  moneda:       z.string().nullable().optional().default('ARS'),
  tipo_cambio:  z.number().nullable().optional().default(1),

  // Ítems
  items: z.array(itemSchema).nullable().optional(),

  // Importes (los más importantes)
  subtotal_neto:    z.number().nullable().optional(),
  alicuota_iva:     z.number().nullable().optional(), // alícuota principal
  importe_iva:      z.number().nullable().optional(),
  importe_no_gravado: z.number().nullable().optional(),
  importe_exento:   z.number().nullable().optional(),
  importe_otros:    z.number().nullable().optional(),
  importe_total:    z.number().nullable().optional(),

  // CAE (validación AFIP)
  cae:              z.string().nullable().optional(),
  cae_vencimiento:  z.string().nullable().optional(), // 'YYYY-MM-DD'

  // Clasificación
  tipo_operacion:   z.enum(['sale', 'purchase', 'unknown']).default('unknown'),

  // Observaciones
  observaciones:    z.string().nullable().optional(),

  // Metadata del extractor
  _confidence:      z.number().min(0).max(100).default(0),
  _warnings:        z.array(z.string()).default([]),
})

export type ExtractedInvoice = z.infer<typeof invoiceSchema>

// ── Documento genérico (no factura) ─────────────────────────────────────────
export const genericDocSchema = z.object({
  doc_type:     z.string(),          // 'bank_statement' | 'contract' | 'certificate' | 'other'
  date:         z.string().nullable().optional(),
  entity:       z.string().nullable().optional(), // entidad que emite
  summary:      z.string(),          // resumen del contenido
  key_data:     z.record(z.unknown()).default({}),
  _confidence:  z.number().min(0).max(100).default(0),
})

export type ExtractedGenericDoc = z.infer<typeof genericDocSchema>

// ── Resultado del OCR ────────────────────────────────────────────────────────
export type OcrResult =
  | { type: 'invoice'; data: ExtractedInvoice; raw: unknown }
  | { type: 'generic'; data: ExtractedGenericDoc; raw: unknown }
  | { type: 'error'; error: string }

export type SupportedMimeType =
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'application/pdf'
