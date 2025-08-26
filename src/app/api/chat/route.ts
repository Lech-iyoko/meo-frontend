import { NextResponse } from 'next/server';

interface ChatRequest {
  query: string;
  session_id?: string;
}

interface Sources {
  source_name: string;
  original_url?: string;
  page_number?: number;
}

interface ChatResponse {
  answer: string;
  session_id: string;
  retrieved_sources: Sources[];
}

export async function POST(request: Request) {
  let body: ChatRequest;

  try {
    body = await request.json(); // Read once and reuse
  } catch (err) {
    console.error('Failed to parse request body:', err);
    return NextResponse.json({ detail: 'Invalid JSON in request body' }, { status: 400 });
  }

  try {
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

    const data: ChatResponse = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}
