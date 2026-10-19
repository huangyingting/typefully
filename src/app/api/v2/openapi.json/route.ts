import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'openapi-v2.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json(
      {
        openapi: '3.1.0',
        info: {
          title: 'Typefully Public API',
          version: '2.0.0',
        },
      },
      { status: 200 }
    );
  }
}
