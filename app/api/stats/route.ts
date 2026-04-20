import { NextResponse } from 'next/server';
import { loadAnnotations, loadTasks } from '@/lib/storage';
import { computeStats } from '@/lib/stats';

export async function GET() {
  const annotations = loadAnnotations();
  const tasks = loadTasks();
  const stats = computeStats(annotations, tasks.length);
  return NextResponse.json(stats);
}
