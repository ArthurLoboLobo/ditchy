import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { verifySectionOwnership } from '@/lib/db/queries/sections';
import { listTopicsWithChatInfo, getTopicProgress } from '@/lib/db/queries/topics';
import { getRevisionChat } from '@/lib/db/queries/chats';

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

    const [topics, progress, revisionChat] = await Promise.all([
      listTopicsWithChatInfo(id),
      getTopicProgress(id),
      getRevisionChat(id),
    ]);

    return NextResponse.json({
      topics,
      progress,
      revisionChatId: revisionChat?.id ?? null,
    });
  } catch (err) {
    console.error('GET /api/sections/:id/topics error:', err);
    return NextResponse.json({ error: 'UNKNOWN' }, { status: 500 });
  }
}
