import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifyTopicOwnership, toggleTopicCompletion } from '@/lib/db/queries/topics';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const owns = await verifyTopicOwnership(id, userId);
    if (!owns) {
      return NextResponse.json({ error: 'TOPIC_NOT_FOUND' }, { status: 404 });
    }

    const isCompleted = await toggleTopicCompletion(id);
    return NextResponse.json({ isCompleted });
  } catch (err) {
    console.error('PATCH /api/topics/:id error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
