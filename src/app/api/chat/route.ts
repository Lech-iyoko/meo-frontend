// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendResponse = await fetch('http://3.94.83.253/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      let errorDetail = 'Backend API error';
      try {
        const errorData = await backendResponse.json();
        errorDetail = errorData.detail || errorDetail;
      } catch {
        const fallbackText = await backendResponse.text();
        errorDetail = fallbackText || errorDetail;
      }

      return NextResponse.json({ detail: errorDetail }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
