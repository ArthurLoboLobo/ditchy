import { sql } from '@/lib/db/connection';

export async function createEmbeddings(
  sectionId: string,
  fileId: string,
  chunks: string[],
  embeddings: number[][],
): Promise<void> {
  const queries = [];

  for (let i = 0; i < chunks.length; i++) {
    const vectorStr = `[${embeddings[i].join(',')}]`;
    queries.push(
      sql`INSERT INTO embeddings (section_id, file_id, chunk_index, chunk_text, embedding)
          VALUES (${sectionId}, ${fileId}, ${i}, ${chunks[i]}, ${vectorStr}::vector)`,
    );
  }

  await sql.transaction(queries);
}

export async function searchChunks(
  sectionId: string,
  queryEmbedding: number[],
  topN: number,
): Promise<{ chunk_text: string; distance: number }[]> {
  const vectorStr = `[${queryEmbedding.join(',')}]`;
  const rows = await sql`
    SELECT chunk_text, embedding <=> ${vectorStr}::vector AS distance
    FROM embeddings
    WHERE section_id = ${sectionId}
    ORDER BY distance ASC
    LIMIT ${topN}
  `;
  return rows as { chunk_text: string; distance: number }[];
}
