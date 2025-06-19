
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
      console.log('Request timed out after 120 seconds');
      controller.abort();
    }, 120000); // 2 minutes

    const response = await fetch(`${backendUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

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

    if (!response.body) {
      throw new Error('No response body received from server');
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining buffer content
          if (buffer.trim()) {
            processChunk(buffer, callbacks);
          }
          console.log('Stream completed successfully');
          callbacks.onComplete();
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('Raw chunk received:', chunk);
        
        buffer += chunk;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            processChunk(line.trim(), callbacks);
          }
        }
      }
    } catch (readerError) {
      console.error('Error reading stream:', readerError);
      throw new Error('Failed to read streaming response from server.');
    } finally {
      reader.releaseLock();
    }

  } catch (error) {
    console.error('Streaming error:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onError(new Error('Request timed out after 2 minutes. Please try again.'));
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

// Helper function to process individual chunks
function processChunk(chunk: string, callbacks: StreamingChatResponse) {
  try {
    console.log('Processing chunk:', chunk);
    
    // Handle Server-Sent Events format
    if (chunk.startsWith('data: ')) {
      const data = chunk.slice(6).trim();
      
      if (data === '[DONE]') {
        console.log('Received stream completion signal');
        return;
      }
      
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const content = parsed.response || parsed.content || parsed.text || parsed;
          
          if (typeof content === 'string' && content.trim()) {
            console.log('Sending content to UI:', content);
            callbacks.onData(content);
          }
        } catch (parseError) {
          // If not JSON, treat as plain text
          console.log('Plain text chunk (data):', data);
          if (data.trim()) {
            callbacks.onData(data);
          }
        }
      }
    } else if (chunk.trim() && !chunk.startsWith(':')) {
      // Handle plain text chunks or direct JSON (not comments)
      try {
        const parsed = JSON.parse(chunk);
        const content = parsed.response || parsed.content || parsed.text || parsed;
        
        if (typeof content === 'string' && content.trim()) {
          console.log('Sending JSON content to UI:', content);
          callbacks.onData(content);
        }
      } catch (parseError) {
        // Treat as plain text
        console.log('Plain text chunk:', chunk);
        if (chunk.trim()) {
          callbacks.onData(chunk);
        }
      }
    }
  } catch (error) {
    console.error('Error processing chunk:', error);
    // Continue processing instead of failing
  }
}
