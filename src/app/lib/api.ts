// API configuration for your FastAPI backend
const API_BASE_URL = process.env.NEXT_PUBLIC_MEO_API_URL || '';

interface ChatMessage {
  message: string;
  session_id: string;
}

interface ChatResponse {
  response: string;
  status: string;
}

export async function postChatMessage(
  message: string, 
  sessionId?: string
): Promise<ChatResponse> {
  try {
    const effectiveSessionId = sessionId || crypto.randomUUID();
    
    // FIXED: Use correct endpoint path
    const endpoint = `${API_BASE_URL}/api/chat`;
    
    console.log('Making API call to:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        sessionId: effectiveSessionId
      }),
    });

    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Health check function for debugging
export async function checkHealth(): Promise<any> {
  try {
    const endpoint = `${API_BASE_URL}/health`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}