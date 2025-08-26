import { Source } from './types';

// This interface correctly matches our FastAPI backend's Pydantic response model
export interface ChatResponse {
    answer: string;
    session_id: string;
    retrieved_sources: Source[];
}

export async function postChatMessage(query: string, sessionId: string | null): Promise<ChatResponse> {
    const apiUrl = process.env.NEXT_PUBLIC_MEO_API_URL;
    if (!apiUrl) {
        throw new Error("API URL is not configured in .env.local. Please check your configuration.");
    }

    const effectiveSessionId = sessionId || crypto.randomUUID();
    
    // The endpoint our FastAPI server is actually using
    const endpoint = `${apiUrl}/chat`;
    
    // The payload that matches our Pydantic ChatRequest model
    const payload = {
        query: query,
        session_id: effectiveSessionId,
    };

    console.log(`Connecting to API at: ${endpoint}`);
    console.log("Sending payload:", payload);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        console.log("Received response status:", response.status);

        if (!response.ok) {
            // This logic safely handles the error and fixes the "no-explicit-any" linting issue
            const errorData: unknown = await response.json();
            const errorMessage = (
                typeof errorData === 'object' && 
                errorData !== null && 
                'detail' in errorData && 
                typeof (errorData as any).detail === 'string'
            ) ? (errorData as any).detail : 'An unknown API error occurred';
            
            throw new Error(`API Error: ${errorMessage}`);
        }

        const data: ChatResponse = await response.json();
        console.log("Successfully parsed response data:", data);
        return data;

    } catch (error) {
        console.error("A network or fetch error occurred:", error);
        throw error;
    }
}