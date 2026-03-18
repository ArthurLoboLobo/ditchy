import { sql } from '@/lib/db/connection';

export type PlanDraft = {
  id: string;
  section_id: string;
  plan_json: unknown;
  created_at: Date;
};

export async function createPlanDraft(
  sectionId: string,
  planJson: unknown,
): Promise<PlanDraft> {
  const rows = await sql`
    INSERT INTO plan_drafts (section_id, plan_json)
    VALUES (${sectionId}, ${JSON.stringify(planJson)})
    RETURNING *
  `;
  return rows[0] as PlanDraft;
}

export async function getCurrentPlanDraft(
  sectionId: string,
): Promise<PlanDraft | null> {
  const rows = await sql`
    SELECT * FROM plan_drafts
    WHERE section_id = ${sectionId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as PlanDraft) ?? null;
}

export async function getDraftCount(sectionId: string): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count FROM plan_drafts
    WHERE section_id = ${sectionId}
  `;
  return (rows[0] as { count: number }).count;
}

export async function deleteNewestPlanDraft(sectionId: string): Promise<void> {
  await sql`
    DELETE FROM plan_drafts
    WHERE id = (
      SELECT id FROM plan_drafts
      WHERE section_id = ${sectionId}
      ORDER BY created_at DESC
      LIMIT 1
    )
  `;
}

export async function deleteAllPlanDrafts(sectionId: string): Promise<void> {
  await sql`
    DELETE FROM plan_drafts WHERE section_id = ${sectionId}
  `;
}
