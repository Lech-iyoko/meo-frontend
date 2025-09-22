// src/app/api/chat/route.ts
export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, session_id } = body;

    // Use the correct public environment variable
    const backendApiUrl = process.env.NEXT_PUBLIC_MEO_API_URL;

    if (!backendApiUrl) {
      console.error("NEXT_PUBLIC_MEO_API_URL environment variable is not set.");
      throw new Error("Backend API URL is not configured.");
    }
    
    console.log(`Proxying request for session ${session_id} to: ${backendApiUrl}/chat`);

    // Forward the request to your real backend on EC2
    const backendResponse = await fetch(`${backendApiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, session_id }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error("Backend returned an error:", errorData);
      return NextResponse.json({ detail: errorData.detail || 'Error from backend service' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('An unexpected error occurred in the API route:', error);
    return NextResponse.json({ detail: 'An internal server error occurred in the proxy.' }, { status: 500 });
  }
}