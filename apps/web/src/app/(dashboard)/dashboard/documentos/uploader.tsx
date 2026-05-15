'use client'

import { useState, useRef, useCallback } from 'react'

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error'

interface UploadResult {
  id: string
  status: string
  doc_type?: string
  confidence?: number
  data?: Record<string, unknown>
  error?: string
}

interface InvoiceData {
  tipo_comprobante?: string
  letra?: string
  numero_completo?: string
  fecha_emision?: string
  emisor?: { razon_social?: string; cuit?: string }
  receptor?: { razon_social?: string; cuit?: string }
  subtotal_neto?: number
  importe_iva?: number
  importe_total?: number
  alicuota_iva?: number
  cae?: string
  tipo_operacion?: string
  _confidence?: number
  _warnings?: string[]
}

export function DocumentUploader({ tenantId }: { tenantId: string }) {
  const [status, setStatus]   = useState<UploadStatus>('idle')
  const [dragging, setDragging] = useState(false)
  const [result, setResult]   = useState<UploadResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [hint, setHint]       = useState<'invoice' | 'generic' | ''>('')
  const inputRef              = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setStatus('uploading')
    setResult(null)
    setFileName(file.name)

    const form = new FormData()
    form.append('file', file)
    form.append('tenantId', tenantId)
    if (hint) form.append('hint', hint)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: form })
      const data = await res.json() as UploadResult

      setResult(data)
      setStatus(res.ok ? 'done' : 'error')

      // Reload page después de 2s para ver el nuevo doc en la lista
      if (res.ok) {
        setTimeout(() => {
          window.location.reload()
        }, 2500)
      }
    } catch {
      setResult({ id: '', status: 'failed', error: 'Error de conexión' })
      setStatus('error')
    }
  }, [tenantId, hint])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]!
    upload(file)
  }, [upload])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  const isLoading = status === 'uploading'

  return (
    <div className="space-y-4">
      {/* Hint selector */}
      <div className="flex items-center gap-3 text-sm">
        <span className="text-muted-foreground font-medium">Tipo de documento:</span>
        {(['', 'invoice', 'generic'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setHint(v)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              hint === v
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-transparent hover:border-border'
            }`}
          >
            {v === '' ? 'Auto-detectar' : v === 'invoice' ? 'Factura / Comprobante' : 'Documento genérico'}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !isLoading && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl px-8 py-10 text-center transition-all cursor-pointer
          ${dragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/50 hover:bg-muted/30'}
          ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isLoading}
        />

        {status === 'idle' && (
          <>
            <div className="text-4xl mb-3">{dragging ? '📥' : '📤'}</div>
            <p className="font-semibold text-sm">
              {dragging ? 'Soltá el archivo' : 'Arrastrá un archivo o hacé click para seleccionar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP, GIF o PDF · Máximo 10 MB
            </p>
          </>
        )}

        {status === 'uploading' && (
          <div className="space-y-3">
            <div className="text-4xl animate-bounce">⚡</div>
            <p className="font-semibold text-sm">Procesando con IA…</p>
            <p className="text-xs text-muted-foreground">{fileName}</p>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {status === 'done' && result && (
          <SuccessPreview result={result} onNew={() => { setStatus('idle'); setResult(null) }} />
        )}

        {status === 'error' && result && (
          <div className="space-y-2">
            <div className="text-4xl">❌</div>
            <p className="font-semibold text-sm text-red-600">Error al procesar</p>
            <p className="text-xs text-red-500">{result.error}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setStatus('idle'); setResult(null) }}
              className="text-xs font-medium text-primary hover:underline mt-2 block mx-auto"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SuccessPreview({ result, onNew }: { result: UploadResult; onNew: () => void }) {
  const data = result.data as InvoiceData | undefined
  const isInvoice = result.doc_type === 'invoice'

  return (
    <div className="space-y-3 text-left max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-semibold text-sm">
              {isInvoice ? 'Factura extraída correctamente' : 'Documento procesado'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              {result.confidence !== undefined && (
                <span className={`text-xs font-medium ${result.confidence >= 80 ? 'text-green-600' : result.confidence >= 50 ? 'text-yellow-600' : 'text-orange-600'}`}>
                  {result.confidence}% confianza
                </span>
              )}
              <span className="text-xs text-muted-foreground">· recargando…</span>
            </div>
          </div>
        </div>
        <button
          onClick={onNew}
          className="text-xs font-medium text-primary hover:underline"
        >
          + Otro
        </button>
      </div>

      {isInvoice && data && (
        <div className="rounded-lg border bg-card p-3 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comprobante</span>
            <span className="font-mono font-semibold">
              {data.tipo_comprobante}{data.letra} {data.numero_completo}
            </span>
          </div>
          {data.emisor?.razon_social && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emisor</span>
              <span className="font-medium truncate max-w-[200px]">{data.emisor.razon_social}</span>
            </div>
          )}
          {data.fecha_emision && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span>{data.fecha_emision}</span>
            </div>
          )}
          {data.importe_total && (
            <div className="flex justify-between border-t pt-1.5 mt-1">
              <span className="font-semibold">Total</span>
              <span className="font-bold">${data.importe_total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          {data._warnings && data._warnings.length > 0 && (
            <div className="border-t pt-1.5">
              {data._warnings.map((w, i) => (
                <p key={i} className="text-orange-600">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
