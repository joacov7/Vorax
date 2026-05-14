export interface Chunk {
  content: string
  index: number
  metadata: Record<string, unknown>
}

export function chunkText(
  text: string,
  options: { chunkSize?: number; overlap?: number } = {},
): Chunk[] {
  const { chunkSize = 512, overlap = 64 } = options
  const chunks: Chunk[] = []

  // Split por párrafos primero, luego por tamaño
  const paragraphs = text.split(/\n\n+/)
  let currentChunk = ''
  let index = 0

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length <= chunkSize) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph
    } else {
      if (currentChunk) {
        chunks.push({ content: currentChunk.trim(), index: index++, metadata: {} })
      }

      // Si el párrafo solo supera el chunk size, dividirlo por oraciones
      if (paragraph.length > chunkSize) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/)
        let sentenceChunk = ''

        for (const sentence of sentences) {
          if ((sentenceChunk + ' ' + sentence).length <= chunkSize) {
            sentenceChunk = sentenceChunk ? `${sentenceChunk} ${sentence}` : sentence
          } else {
            if (sentenceChunk) {
              chunks.push({ content: sentenceChunk.trim(), index: index++, metadata: {} })
            }
            sentenceChunk = sentence
          }
        }

        if (sentenceChunk) currentChunk = sentenceChunk
      } else {
        currentChunk = paragraph
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push({ content: currentChunk.trim(), index: index++, metadata: {} })
  }

  return chunks
}
