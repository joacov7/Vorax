import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] })

export async function embed(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // límite de tokens
  })

  return response.data[0]!.embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map((t) => t.slice(0, 8000)),
  })

  return response.data.map((d) => d.embedding)
}
