// src/lib/api.ts
import { Source } from './types';

export interface ChatResponse {
    answer: string;
    session_id: string;
    retrieved_sources: Source[];
}

export async function postChatMessage(query: string, sessionId: string | null): Promise<ChatResponse> {
    // The endpoint is now a simple, same-origin path to our new API route
    const endpoint = '/api/chat';

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, session_id: sessionId }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch chat response');
    }
    return await response.json();
}