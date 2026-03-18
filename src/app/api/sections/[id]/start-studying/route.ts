import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifySectionOwnership, getSection, updateSectionStatus } from '@/lib/db/queries/sections';
import { getCurrentPlanDraft, deleteAllPlanDrafts } from '@/lib/db/queries/plans';
import { createTopicsFromPlan } from '@/lib/db/queries/topics';
import type { PlanJSON } from '@/lib/ai';
import { validatePlanJSON } from '@/lib/ai';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const owns = await verifySectionOwnership(id, userId);
    if (!owns) {
      return NextResponse.json({ error: 'SECTION_NOT_FOUND' }, { status: 404 });
    }

    const section = await getSection(id);
    if (!section || section.status !== 'planning') {
      return NextResponse.json({ error: 'INVALID_SECTION_STATUS' }, { status: 400 });
    }

    const draft = await getCurrentPlanDraft(id);
    if (!draft) {
      return NextResponse.json({ error: 'NO_PLAN_DRAFT' }, { status: 400 });
    }

    const plan = draft.plan_json as PlanJSON;
    if (!validatePlanJSON(plan)) {
      return NextResponse.json({ error: 'EMPTY_PLAN' }, { status: 400 });
    }

    await createTopicsFromPlan(id, plan);
    await deleteAllPlanDrafts(id);
    await updateSectionStatus(id, 'studying');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/sections/:id/start-studying error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
