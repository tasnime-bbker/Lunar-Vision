const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function sendChatMessage({ message, agentType, chatHistory, uploadedFiles }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      agent_type: agentType || null,
      chat_history: chatHistory,
      uploaded_files: uploadedFiles || []
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return response.json();
}

export async function analyzeEcommerceFiles({ prompt, uploadedFiles }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/ecommerce/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt || '',
      uploaded_files: uploadedFiles || []
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchSampleDataset() {
  const response = await fetch(`${API_BASE_URL}/api/v1/sample-dataset`);
  if (!response.ok) {
    throw new Error('Failed to fetch sample dataset');
  }
  return response.json();
}

export async function fetchDemoScenarios() {
  const response = await fetch(`${API_BASE_URL}/demo-scenarios`);
  if (!response.ok) {
    throw new Error('Failed to fetch demo scenarios');
  }
  return response.json();
}

export async function searchCompetitors(query) {
  const response = await fetch(`${API_BASE_URL}/api/v1/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search competitors');
  }
  return response.json();
}

export async function streamCompetitorAnalysis({
  competitorName,
  competitorWebsite,
  niche = 'all',
  onEvent,
  onComplete,
  onError,
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competitor_name: competitorName,
        competitor_website: competitorWebsite || null,
        niche,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Streaming request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim();
          if (jsonStr) {
            try {
              const event = JSON.parse(jsonStr);
              if (onEvent) onEvent(event);
              if (event.type === 'complete' && onComplete) {
                onComplete(event.data);
              }
            } catch (err) {
              console.warn('Could not parse SSE event:', jsonStr, err);
            }
          }
        }
      }
    }
  } catch (error) {
    if (onError) onError(error);
  }
}

