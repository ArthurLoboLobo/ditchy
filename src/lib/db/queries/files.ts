import { sql } from '@/lib/db/connection';

export async function listFileBlobUrls(sectionId: string): Promise<string[]> {
  const rows = await sql`
    SELECT blob_url FROM files WHERE section_id = ${sectionId}
  `;
  return rows.map((r) => (r as { blob_url: string }).blob_url);
}
