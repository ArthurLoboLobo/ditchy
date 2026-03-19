import { sql } from '@/lib/db/connection';
import type { PlanJSON } from '@/lib/ai';

export type Topic = {
  id: string;
  section_id: string;
  title: string;
  order: number;
  is_completed: boolean;
  created_at: Date;
};

export type Subtopic = {
  id: string;
  topic_id: string;
  text: string;
  order: number;
};

export type TopicWithSubtopics = Topic & {
  subtopics: Subtopic[];
};

export type TopicWithChatInfo = TopicWithSubtopics & {
  chat_id: string;
  message_count: number;
};

export async function createTopicsFromPlan(
  sectionId: string,
  planJson: PlanJSON,
): Promise<void> {
  const queries = [];

  for (let i = 0; i < planJson.topics.length; i++) {
    const topic = planJson.topics[i];
    const topicId = crypto.randomUUID();

    queries.push(
      sql`INSERT INTO topics (id, section_id, title, "order", is_completed)
          VALUES (${topicId}, ${sectionId}, ${topic.title}, ${i}, ${topic.isKnown ?? false})`,
    );

    for (let j = 0; j < topic.subtopics.length; j++) {
      queries.push(
        sql`INSERT INTO subtopics (id, topic_id, text, "order")
            VALUES (${crypto.randomUUID()}, ${topicId}, ${topic.subtopics[j]}, ${j})`,
      );
    }
  }

  await sql.transaction(queries);
}

export async function listTopics(
  sectionId: string,
): Promise<TopicWithSubtopics[]> {
  const rows = await sql`
    SELECT
      t.id AS topic_id, t.section_id, t.title, t."order" AS topic_order,
      t.is_completed, t.created_at,
      s.id AS subtopic_id, s.text, s."order" AS subtopic_order
    FROM topics t
    LEFT JOIN subtopics s ON s.topic_id = t.id
    WHERE t.section_id = ${sectionId}
    ORDER BY t."order", s."order"
  `;

  const topicMap = new Map<string, TopicWithSubtopics>();
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const topicId = r.topic_id as string;

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        id: topicId,
        section_id: r.section_id as string,
        title: r.title as string,
        order: r.topic_order as number,
        is_completed: r.is_completed as boolean,
        created_at: r.created_at as Date,
        subtopics: [],
      });
    }

    if (r.subtopic_id) {
      topicMap.get(topicId)!.subtopics.push({
        id: r.subtopic_id as string,
        topic_id: topicId,
        text: r.text as string,
        order: r.subtopic_order as number,
      });
    }
  }

  return Array.from(topicMap.values());
}

export async function verifyTopicOwnership(topicId: string, userId: string): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM topics t
    JOIN sections s ON s.id = t.section_id
    WHERE t.id = ${topicId} AND s.user_id = ${userId}
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function toggleTopicCompletion(topicId: string): Promise<boolean> {
  const rows = await sql`
    UPDATE topics SET is_completed = NOT is_completed WHERE id = ${topicId} RETURNING is_completed
  `;
  return (rows[0] as { is_completed: boolean }).is_completed;
}

export async function getTopicProgress(sectionId: string): Promise<{ completed: number; total: number }> {
  const rows = await sql`
    SELECT COUNT(*)::int AS total, COUNT(CASE WHEN is_completed THEN 1 END)::int AS completed
    FROM topics WHERE section_id = ${sectionId}
  `;
  return rows[0] as { completed: number; total: number };
}

export async function listTopicsWithChatInfo(sectionId: string): Promise<TopicWithChatInfo[]> {
  const rows = await sql`
    SELECT
      t.id AS topic_id, t.section_id, t.title, t."order" AS topic_order,
      t.is_completed, t.created_at,
      s.id AS subtopic_id, s.text, s."order" AS subtopic_order,
      c.id AS chat_id,
      COALESCE(mc.msg_count, 0)::int AS message_count
    FROM topics t
    LEFT JOIN subtopics s ON s.topic_id = t.id
    LEFT JOIN chats c ON c.topic_id = t.id AND c.type = 'topic'
    LEFT JOIN (
      SELECT chat_id, COUNT(*)::int AS msg_count
      FROM messages WHERE role = 'user' GROUP BY chat_id
    ) mc ON mc.chat_id = c.id
    WHERE t.section_id = ${sectionId}
    ORDER BY t."order", s."order"
  `;

  const topicMap = new Map<string, TopicWithChatInfo>();
  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const topicId = r.topic_id as string;

    if (!topicMap.has(topicId)) {
      topicMap.set(topicId, {
        id: topicId,
        section_id: r.section_id as string,
        title: r.title as string,
        order: r.topic_order as number,
        is_completed: r.is_completed as boolean,
        created_at: r.created_at as Date,
        subtopics: [],
        chat_id: r.chat_id as string,
        message_count: r.message_count as number,
      });
    }

    if (r.subtopic_id) {
      topicMap.get(topicId)!.subtopics.push({
        id: r.subtopic_id as string,
        topic_id: topicId,
        text: r.text as string,
        order: r.subtopic_order as number,
      });
    }
  }

  return Array.from(topicMap.values());
}
