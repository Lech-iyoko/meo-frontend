// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, session_id } = body;

    // The real backend URL is now a server-side secret
    const backendApiUrl = process.env.MEO_API_URL;

    if (!backendApiUrl) {
      throw new Error("Backend API URL is not configured on the server.");
    }

    // The Next.js server makes the call to the real backend
    const backendResponse = await fetch(`${backendApiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ detail: errorData.detail || 'Backend API error' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ detail: 'Internal Server Error' }, { status: 500 });
  }
}