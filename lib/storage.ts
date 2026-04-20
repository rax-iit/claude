import fs from 'fs';
import path from 'path';
import { Task, TaskSchema, Annotation } from './schema';

const DATA_DIR = path.join(process.cwd(), 'data');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.jsonl');
const RESULTS_FILE = path.join(DATA_DIR, 'results.jsonl');
const LOCK_FILE = path.join(DATA_DIR, '.results.lock');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function acquireLock(timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (fs.existsSync(LOCK_FILE)) {
    if (Date.now() - start > timeoutMs) {
      try { fs.unlinkSync(LOCK_FILE); } catch { /* stale lock — ignore */ }
      break;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  fs.writeFileSync(LOCK_FILE, String(process.pid), 'utf-8');
}

function releaseLock(): void {
  try { fs.unlinkSync(LOCK_FILE); } catch { /* already gone */ }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function loadTasks(): Task[] {
  ensureDataDir();
  if (!fs.existsSync(TASKS_FILE)) return [];

  const lines = fs.readFileSync(TASKS_FILE, 'utf-8').split('\n');
  const tasks: Task[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      const result = TaskSchema.safeParse(JSON.parse(trimmed));
      if (result.success) tasks.push(result.data);
    } catch {
      // skip malformed lines
    }
  }

  return tasks;
}

export async function saveTasks(content: string): Promise<void> {
  ensureDataDir();
  fs.writeFileSync(TASKS_FILE, content, 'utf-8');
}

// ─── Annotations ─────────────────────────────────────────────────────────────

export function loadAnnotations(): Annotation[] {
  ensureDataDir();
  if (!fs.existsSync(RESULTS_FILE)) return [];

  const lines = fs.readFileSync(RESULTS_FILE, 'utf-8').split('\n');
  const annotations: Annotation[] = [];

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    try {
      annotations.push(JSON.parse(trimmed) as Annotation);
    } catch {
      // skip malformed lines
    }
  }

  return annotations;
}

export async function appendAnnotation(annotation: Annotation): Promise<void> {
  ensureDataDir();
  await acquireLock();
  try {
    fs.appendFileSync(RESULTS_FILE, JSON.stringify(annotation) + '\n', 'utf-8');
  } finally {
    releaseLock();
  }
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export function getNextTask(annotatorId: string): Task | null {
  const tasks = loadTasks();
  const annotations = loadAnnotations();

  const done = new Set(
    annotations.filter((a) => a.annotator_id === annotatorId).map((a) => a.pair_id),
  );

  return tasks.find((t) => !done.has(t.pair_id)) ?? null;
}

export function getAnnotationProgress(annotatorId: string): {
  total: number;
  completed: number;
  skipped: number;
} {
  const tasks = loadTasks();
  const annotations = loadAnnotations().filter((a) => a.annotator_id === annotatorId);

  return {
    total: tasks.length,
    completed: annotations.filter((a) => !a.flags.skipped).length,
    skipped: annotations.filter((a) => a.flags.skipped).length,
  };
}
