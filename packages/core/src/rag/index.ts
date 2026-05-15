export { embed, embedBatch } from './embed'
export { searchDocuments } from './search'
export { chunkText } from './chunk'
export type { SearchResult } from './search'
export type { Chunk } from './chunk'

import { db, documents, document_chunks } from '@empresa-ia/db'
import { chunkText } from './chunk'
import { embedBatch } from './embed'

export async function ingestDocument(data: {
  tenantId?: string
  title: string
  content: string
  type: string
  vertical?: string
  sourceUrl?: string
}) {
  const [doc] = await db
    .insert(documents)
    .values({
      tenant_id: data.tenantId ?? null,
      title: data.title,
      content: data.content,
      type: data.type,
      vertical: data.vertical ?? null,
      source_url: data.sourceUrl ?? null,
    })
    .returning()

  if (!doc) throw new Error('Failed to create document')

  const chunks = chunkText(data.content)
  const embeddings = await embedBatch(chunks.map((c) => c.content))

  await db.insert(document_chunks).values(
    chunks.map((chunk, i) => ({
      document_id: doc.id,
      tenant_id: data.tenantId ?? null,
      content: chunk.content,
      chunk_index: chunk.index,
      embedding: embeddings[i]!,
      metadata: chunk.metadata,
    })),
  )

  return { documentId: doc.id, chunksCreated: chunks.length }
}
