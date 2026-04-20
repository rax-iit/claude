import { NextRequest, NextResponse } from 'next/server';
import { saveTasks, loadTasks } from '@/lib/storage';
import { TaskSchema } from '@/lib/schema';

export async function POST(req: NextRequest) {
  let text: string;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    text = await file.text();
  } catch {
    return NextResponse.json({ error: 'Could not parse form data' }, { status: 400 });
  }

  const lines = text.split('\n').filter((l) => l.trim());
  const valid: string[] = [];
  const invalid: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      const parsed = JSON.parse(lines[i]);
      const result = TaskSchema.safeParse(parsed);
      if (result.success) {
        valid.push(lines[i]);
      } else {
        invalid.push(i + 1);
      }
    } catch {
      invalid.push(i + 1);
    }
  }

  if (valid.length === 0) {
    return NextResponse.json(
      { error: 'No valid tasks found in uploaded file', invalid_lines: invalid },
      { status: 422 },
    );
  }

  await saveTasks(valid.join('\n') + '\n');
  const tasks = loadTasks();

  return NextResponse.json({
    ok: true,
    tasks_loaded: valid.length,
    invalid_lines: invalid,
    total_tasks: tasks.length,
  });
}
