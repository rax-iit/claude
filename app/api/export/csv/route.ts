import { NextResponse } from 'next/server';
import { loadAnnotations } from '@/lib/storage';
import { annotationsToCsv } from '@/lib/export';

export async function GET() {
  const annotations = loadAnnotations();
  const body = annotationsToCsv(annotations);

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="results-${Date.now()}.csv"`,
    },
  });
}
