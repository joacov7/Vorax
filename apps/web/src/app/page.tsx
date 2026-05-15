import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'

const VERTICALS = [
  {
    emoji: '📊',
    name: 'Estudios Contables',
    tagline: 'Vencimientos, IVA y clientes bajo control',
    features: ['Agenda de vencimientos AFIP/ARBA', 'Gestión de IVA y Multilateral', 'Recordatorios automáticos por WhatsApp', 'Base de clientes centralizada'],
    color: 'blue',
  },
  {
    emoji: '🏋️',
    name: 'Gimnasios y Clubes',
    tagline: 'Socios, cuotas y clases en un solo lugar',
    features: ['Control de socios y cuotas', 'Reserva y gestión de clases', 'Notificaciones de mora automáticas', 'Estadísticas de asistencia'],
    color: 'green',
  },
  {
    emoji: '🏥',
    name: 'Consultorios Médicos',
    tagline: 'Turnos y pacientes con asistente IA 24/7',
    features: ['Agenda de turnos online', 'Historial clínico digital', 'Recordatorios de citas por WhatsApp', 'Gestión de tratamientos'],
    color: 'purple',
  },
  {
    emoji: '🚛',
    name: 'Empresas de Logística',
    tagline: 'Flota, envíos y choferes coordinados',
    features: ['Seguimiento de envíos en tiempo real', 'Control de flota y vencimientos VTV', 'Asignación inteligente de choferes', 'Alertas de documentación vencida'],
    color: 'orange',
  },
]

const PLANS = [
  {
    id: 'trial',
    name: 'Trial',
    price: 'Gratis',
    period: '14 días',
    description: 'Para conocer la plataforma sin compromiso.',
    features: ['2 usuarios', '100 mensajes IA/mes', 'Tickets y CRM básico', 'Soporte por email'],
    cta: 'Empezar gratis',
    href: '/register',
    highlight: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$150',
    period: 'por mes',
    description: 'Para negocios que empiezan a escalar.',
    features: ['5 usuarios', '500 mensajes IA/mes', 'WhatsApp integrado', 'RAG con documentos propios', 'Notificaciones automáticas'],
    cta: 'Contratar Starter',
    href: '/register?plan=starter',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$300',
    period: 'por mes',
    description: 'El preferido por profesionales y PyMEs.',
    features: ['20 usuarios', '2000 mensajes IA/mes', 'Todo lo de Starter', 'Workflows automáticos', 'Documentos y reportes IA', 'Gestión de facturación'],
    cta: 'Contratar Pro',
    href: '/register?plan=pro',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$600',
    period: 'por mes',
    description: 'Para operaciones grandes con necesidades personalizadas.',
    features: ['Usuarios ilimitados', 'Mensajes IA ilimitados', 'Todo lo de Pro', 'API de integración', '100 GB de storage', 'SLA y soporte dedicado'],
    cta: 'Contactar ventas',
    href: '/register?plan=enterprise',
    highlight: false,
  },
]

const FEATURES = [
  { icon: '🤖', title: 'Agente IA multi-especialista', desc: 'Nuestro agente LangGraph gestiona ventas, soporte, onboarding y finanzas en simultáneo, escalando a humano solo cuando hace falta.' },
  { icon: '💬', title: 'WhatsApp + Web integrados', desc: 'Tus clientes te escriben por donde quieran. Todas las conversaciones llegan al mismo panel y el IA responde en segundos.' },
  { icon: '📚', title: 'RAG con tu documentación', desc: 'Subí tus manuales, tarifas y preguntas frecuentes. El agente los usa para responder con precisión sin inventar.' },
  { icon: '🔔', title: 'Alertas y workflows automáticos', desc: 'Vencimientos, cuotas impagas, turnos próximos. La plataforma avisa sola, sin que tengas que acordarte de nada.' },
  { icon: '🎫', title: 'Gestión de tickets integrada', desc: 'Cada conversación puede convertirse en un ticket con prioridad, asignación y seguimiento hasta resolución.' },
  { icon: '📊', title: 'Panel de métricas en tiempo real', desc: 'MRR, tickets abiertos, conversaciones, resolución IA. Toda la operación visible desde un solo dashboard.' },
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-100 text-blue-700',
  green: 'bg-green-50 border-green-100 text-green-700',
  purple: 'bg-purple-50 border-purple-100 text-purple-700',
  orange: 'bg-orange-50 border-orange-100 text-orange-700',
}

const badgeMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
}

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-indigo-700">Vorax</span>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">IA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#verticales" className="hover:text-gray-900 transition-colors">Rubros</a>
            <a href="#funciones" className="hover:text-gray-900 transition-colors">Funciones</a>
            <a href="#precios" className="hover:text-gray-900 transition-colors">Precios</a>
          </div>
          <div className="flex items-center gap-3">
            {userId ? (
              <Link href="/dashboard" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Ir al panel →
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Ingresar</Link>
                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Empezar gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 to-white pt-20 pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.08)_0%,_transparent_70%)]" />
        <div className="max-w-5xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Plataforma SaaS multi-vertical con IA
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight mb-6">
            La IA que gestiona<br />
            <span className="text-indigo-600">tu negocio completo</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Atendé clientes por WhatsApp y web, automatizá recordatorios, gestioná tickets y obtenécompletamente sin código. Adaptado a tu rubro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200"
            >
              Empezar gratis — 14 días sin tarjeta
            </Link>
            <a href="#verticales" className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1.5 transition-colors">
              Ver rubros disponibles <span>↓</span>
            </a>
          </div>
          {/* Stats bar */}
          <div className="mt-16 flex flex-wrap justify-center gap-10 text-center">
            {[['4', 'Rubros activos'], ['∞', 'Mensajes WhatsApp'], ['< 2s', 'Respuesta IA'], ['99.9%', 'Uptime']].map(([val, label]) => (
              <div key={label}>
                <div className="text-3xl font-black text-indigo-700">{val}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERTICALES */}
      <section id="verticales" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Hecho para tu rubro</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Cada vertical trae módulos, workflows y un agente IA entrenado específicamente para ese negocio.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VERTICALS.map((v) => (
              <div key={v.name} className={`rounded-2xl border p-7 ${colorMap[v.color]} transition-shadow hover:shadow-md`}>
                <div className="flex items-start gap-4 mb-5">
                  <span className="text-3xl">{v.emoji}</span>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{v.name}</h3>
                    <p className="text-sm text-gray-600 mt-0.5">{v.tagline}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {v.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className={`mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${badgeMap[v.color]}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FUNCIONES */}
      <section id="funciones" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Todo lo que necesitás, ya incluido</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Sin integraciones adicionales ni configuraciones complejas. Listo para usar desde el día uno.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRECIOS */}
      <section id="precios" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Precios simples y transparentes</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Sin costos ocultos. Todos los precios incluyen onboarding y soporte técnico.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-xl shadow-indigo-200'
                    : 'border-gray-200 bg-white text-gray-900'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    Más popular
                  </span>
                )}
                <div className="mb-5">
                  <h3 className={`font-bold text-lg ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>{plan.period}</span>
                </div>
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? 'text-indigo-100' : 'text-gray-600'}`}>
                      <span className={`font-bold text-xs mt-0.5 ${plan.highlight ? 'text-indigo-300' : 'text-indigo-600'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">¿Listo para automatizar tu negocio?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Empezá el trial gratuito hoy. Sin tarjeta de crédito, sin compromiso.</p>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-indigo-50 text-indigo-700 font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg hover:shadow-xl"
          >
            Crear cuenta gratis →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-indigo-700">Vorax</span>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-800 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gray-800 transition-colors">Términos</a>
            <a href="mailto:hola@vorax.ai" className="hover:text-gray-800 transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
