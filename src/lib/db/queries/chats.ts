import { sql } from '@/lib/db/connection';

export type Chat = {
  id: string;
  section_id: string;
  topic_id: string | null;
  type: string;
  created_at: Date;
};

export async function createChatsForSection(
  sectionId: string,
  topicIds: string[],
): Promise<void> {
  const queries = [];

  for (const topicId of topicIds) {
    queries.push(
      sql`INSERT INTO chats (id, section_id, topic_id, type)
          VALUES (${crypto.randomUUID()}, ${sectionId}, ${topicId}, 'topic')`,
    );
  }

  // One revision chat per section
  queries.push(
    sql`INSERT INTO chats (id, section_id, topic_id, type)
        VALUES (${crypto.randomUUID()}, ${sectionId}, ${null}, 'revision')`,
  );

  await sql.transaction(queries);
}

export async function getRevisionChat(sectionId: string): Promise<Chat | null> {
  const rows = await sql`
    SELECT * FROM chats WHERE section_id = ${sectionId} AND type = 'revision' LIMIT 1
  `;
  return (rows[0] as Chat) ?? null;
}
