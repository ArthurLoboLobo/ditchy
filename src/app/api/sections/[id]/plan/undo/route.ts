import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifySectionOwnership, getSection } from '@/lib/db/queries/sections';
import { getDraftCount, deleteNewestPlanDraft, getCurrentPlanDraft } from '@/lib/db/queries/plans';

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

    const count = await getDraftCount(id);
    if (count < 2) {
      return NextResponse.json({ error: 'NOTHING_TO_UNDO' }, { status: 400 });
    }

    await deleteNewestPlanDraft(id);
    const draft = await getCurrentPlanDraft(id);
    return NextResponse.json({ plan: draft!.plan_json });
  } catch (err) {
    console.error('POST /api/sections/:id/plan/undo error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
