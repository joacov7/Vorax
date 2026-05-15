import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Empresa IA</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sistemas inteligentes para tu negocio
          </p>
        </div>
        <SignIn
          routing="hash"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
