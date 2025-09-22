import { Source } from './types';

export interface ChatResponse {
    response: string; // <-- This was changed from "answer"
    session_id: string;
    retrieved_sources: Source[];
}

export async function postChatMessage(query: string, sessionId: string): Promise<ChatResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_MEO_API_URL;
    if (!apiUrl) {
        throw new Error("API URL is not configured in .env.local. Please check your configuration.");
    }

    // The endpoint should point to /api/chat, which is your proxy
    const endpoint = `/api/chat`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The body correctly sends "query" and "session_id"
        body: JSON.stringify({
            query: query,
            session_id: sessionId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch chat response from backend');
    }

    return await response.json();
}

