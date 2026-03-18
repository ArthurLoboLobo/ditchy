import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifySectionOwnership, getSection } from '@/lib/db/queries/sections';
import { getCurrentPlanDraft, createPlanDraft } from '@/lib/db/queries/plans';
import { validatePlanJSON } from '@/lib/ai';

export async function GET(
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

    const draft = await getCurrentPlanDraft(id);
    return NextResponse.json({ plan: draft?.plan_json ?? null });
  } catch (err) {
    console.error('GET /api/sections/:id/plan error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    if (!validatePlanJSON(body.plan)) {
      return NextResponse.json({ error: 'INVALID_PLAN_JSON' }, { status: 400 });
    }

    await createPlanDraft(id, body.plan);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT /api/sections/:id/plan error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
