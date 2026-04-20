import { NextRequest, NextResponse } from 'next/server';
import { getNextTask, getAnnotationProgress } from '@/lib/storage';

export async function GET(req: NextRequest) {
  const annotatorId = req.nextUrl.searchParams.get('annotator_id');

  if (!annotatorId?.trim()) {
    return NextResponse.json({ error: 'annotator_id is required' }, { status: 400 });
  }

  const task = getNextTask(annotatorId);
  const progress = getAnnotationProgress(annotatorId);

  if (!task) {
    return NextResponse.json({ task: null, progress, done: true });
  }

  // Strip hidden_meta from the response — sent separately to avoid leaking model names
  const { hidden_meta: _hidden, ...safeTask } = task;

  return NextResponse.json({
    task: safeTask,
    hidden_meta: _hidden,
    progress,
    done: false,
  });
}
