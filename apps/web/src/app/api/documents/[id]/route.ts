import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db, user_documents } from '@empresa-ia/db'
import { eq, and } from 'drizzle-orm'

const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? ''

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const tenantId = DEMO_TENANT_ID

  const [doc] = await db
    .select()
    .from(user_documents)
    .where(and(eq(user_documents.id, id), eq(user_documents.tenant_id, tenantId)))
    .limit(1)

  if (!doc) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })

  return NextResponse.json(doc)
}
