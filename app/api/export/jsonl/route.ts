import { NextResponse } from 'next/server';
import { loadAnnotations } from '@/lib/storage';
import { annotationsToJsonl } from '@/lib/export';

export async function GET() {
  const annotations = loadAnnotations();
  const body = annotationsToJsonl(annotations);

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Content-Disposition': `attachment; filename="results-${Date.now()}.jsonl"`,
    },
  });
}
