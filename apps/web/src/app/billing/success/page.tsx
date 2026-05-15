import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="max-w-md w-full text-center p-8 rounded-xl border bg-card shadow-sm">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2">¡Suscripción activada!</h1>
        <p className="text-muted-foreground mb-6">
          Tu pago fue procesado correctamente. Tu plan ya está activo y podés empezar a usar todas las funcionalidades.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
