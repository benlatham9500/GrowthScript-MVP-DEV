interface ChatRequest {
  client_id: string;
  chat_id: string;
  user_id: string;
  user_input: string;
}

interface StreamingChatResponse {
  onData: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

export const streamChatResponse = async (
  request: ChatRequest,
  callbacks: StreamingChatResponse
) => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://growthscript-agent-2yuy.onrender.com';
    console.log('Calling backend at:', `${backendUrl}/chat`);
    console.log('Request payload:', JSON.stringify(request));

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timed out after 180 seconds');
      controller.abort();
    }, 180000); // 3 minutes

    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = `HTTP ${response.status}: ${errorText}`;
        }
      } catch (e) {
        console.warn('Could not read error response body:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const fullResponse = data.response || '';

    console.log("full response:", fullResponse);

    // Simulate streaming by splitting the response into chunks
    const chunkSize = 20; // characters per chunk
    const chunkDelay = 100; // ms between chunks

    let idx = 0;
    function sendChunk() {
      if (idx < fullResponse.length) {
        const chunk = fullResponse.slice(idx, idx + chunkSize);
        callbacks.onData(chunk);
        idx += chunkSize;
        setTimeout(sendChunk, chunkDelay);
      } else {
        callbacks.onComplete();
      }
    }
    sendChunk();

  } catch (error) {
    console.error('Streaming error:', error);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onError(new Error('Request timed out after 3 minutes. Please try again.'));
        return;
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        callbacks.onError(new Error('Unable to connect to GrowthScript Brain service. Please check your connection and try again.'));
        return;
      }
    }

    callbacks.onError(error instanceof Error ? error : new Error('Unknown error occurred'));
  }
};
