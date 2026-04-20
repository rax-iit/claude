import { NextRequest, NextResponse } from 'next/server';
import { AnnotationSchema, validateAnnotation } from '@/lib/schema';
import { appendAnnotation } from '@/lib/storage';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = AnnotationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const annotation = parsed.data;
  const errors = validateAnnotation(annotation);
  if (errors.length > 0) {
    return NextResponse.json({ error: 'Business validation failed', details: errors }, { status: 422 });
  }

  await appendAnnotation(annotation);

  return NextResponse.json({ ok: true, annotation_id: annotation.annotation_id });
}
