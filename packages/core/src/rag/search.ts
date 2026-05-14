import { db } from '@empresa-ia/db'
import { sql } from 'drizzle-orm'
import { embed } from './embed.js'

export interface SearchResult {
  content: string
  title: string
  type: string
  similarity: number
  documentId: string
}

export async function searchDocuments(
  query: string,
  tenantId: string,
  options: { limit?: number; threshold?: number; vertical?: string } = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.72, vertical } = options

  const embedding = await embed(query)
  const vectorStr = JSON.stringify(embedding)

  // Búsqueda híbrida: semántica + full-text combinadas con RRF
  const results = await db.execute(sql`
    WITH semantic AS (
      SELECT
        dc.id,
        dc.content,
        d.title,
        d.type,
        d.id AS document_id,
        1 - (dc.embedding <=> ${vectorStr}::vector) AS similarity,
        ROW_NUMBER() OVER (ORDER BY dc.embedding <=> ${vectorStr}::vector) AS rank
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE
        (dc.tenant_id = ${tenantId} OR dc.tenant_id IS NULL)
        ${vertical ? sql`AND (d.vertical = ${vertical} OR d.vertical IS NULL)` : sql``}
        AND 1 - (dc.embedding <=> ${vectorStr}::vector) > ${threshold}
    ),
    fulltext AS (
      SELECT
        dc.id,
        dc.content,
        d.title,
        d.type,
        d.id AS document_id,
        ts_rank(to_tsvector('spanish', dc.content), plainto_tsquery('spanish', ${query})) AS similarity,
        ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('spanish', dc.content), plainto_tsquery('spanish', ${query})) DESC) AS rank
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE
        (dc.tenant_id = ${tenantId} OR dc.tenant_id IS NULL)
        AND to_tsvector('spanish', dc.content) @@ plainto_tsquery('spanish', ${query})
    )
    SELECT
      COALESCE(s.id, f.id) AS id,
      COALESCE(s.content, f.content) AS content,
      COALESCE(s.title, f.title) AS title,
      COALESCE(s.type, f.type) AS type,
      COALESCE(s.document_id, f.document_id) AS document_id,
      COALESCE(s.similarity, 0) AS similarity
    FROM semantic s
    FULL OUTER JOIN fulltext f ON s.id = f.id
    ORDER BY (
      COALESCE(1.0 / (60 + s.rank), 0) +
      COALESCE(1.0 / (60 + f.rank), 0)
    ) DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row) => ({
    content: row.content as string,
    title: row.title as string,
    type: row.type as string,
    similarity: Number(row.similarity),
    documentId: row.document_id as string,
  }))
}
