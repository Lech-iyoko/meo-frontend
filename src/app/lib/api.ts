import { Source } from './types';

export interface ChatResponse {
    answer: string;
    session_id: string;
    retrieved_sources: Source[];
}

export async function postChatMessage(query: string, sessionId: string | null): Promise<ChatResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_MEO_API_URL;
    if (!apiUrl) {
        throw new Error("API URL is not configured in .env.local");
    }

    const effectiveSessionId = sessionId || crypto.randomUUID();

    const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: query,
            session_id: effectiveSessionId,
        }),
    });

    if (!response.ok) {
        // --- THIS IS THE FIX ---
        // We type the error as 'unknown' and then check its properties safely.
        const errorData: unknown = await response.json();
        const errorMessage = (
            typeof errorData === 'object' && 
            errorData !== null && 
            'detail' in errorData && 
            typeof (errorData as { detail: unknown }).detail === 'string'
        ) ? (errorData as { detail: string }).detail : 'Failed to fetch chat response';
        
        throw new Error(errorMessage);
    }
    return await response.json();
}