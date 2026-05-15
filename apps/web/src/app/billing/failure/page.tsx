import Link from 'next/link'

export default function BillingFailurePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="max-w-md w-full text-center p-8 rounded-xl border bg-card shadow-sm">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">El pago no se pudo procesar</h1>
        <p className="text-muted-foreground mb-6">
          Hubo un problema al procesar tu pago en MercadoPago. Podés intentarlo de nuevo o contactarnos si el problema persiste.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard/billing"
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Intentar de nuevo
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
