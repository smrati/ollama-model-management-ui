const API_BASE = '/api';

export async function fetchModels(ollamaUrl) {
  const response = await fetch(`${API_BASE}/models?url=${encodeURIComponent(ollamaUrl)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch models');
  }
  return response.json();
}

export async function testConnection(ollamaUrl) {
  const response = await fetch(`${API_BASE}/test-connection?url=${encodeURIComponent(ollamaUrl)}`);
  return response.json();
}

export async function fetchVersion(ollamaUrl) {
  const response = await fetch(`${API_BASE}/version?url=${encodeURIComponent(ollamaUrl)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch version');
  }
  return response.json();
}

export async function fetchRunningModels(ollamaUrl) {
  const response = await fetch(`${API_BASE}/running?url=${encodeURIComponent(ollamaUrl)}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch running models');
  }
  return response.json();
}

export async function pullModel(ollamaUrl, modelName, onProgress) {
  const response = await fetch(`${API_BASE}/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      url: ollamaUrl, 
      model: modelName, 
      stream: true 
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to pull model');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (onProgress) {
          onProgress(data);
        }
      } catch (e) {
        // Skip malformed JSON lines
      }
    }
  }

  return { success: true };
}

export async function deleteModel(ollamaUrl, modelName) {
  const response = await fetch(`${API_BASE}/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      url: ollamaUrl, 
      model: modelName 
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete model');
  }

  return response.json();
}

export async function createModel(ollamaUrl, config, onProgress) {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      url: ollamaUrl, 
      model: config.name,
      from: config.from,
      system: config.system,
      template: config.template,
      license: config.license,
      parameters: config.parameters,
      stream: true 
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create model');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        if (onProgress) {
          onProgress(data);
        }
      } catch (e) {
        // Skip malformed JSON lines
      }
    }
  }

  return { success: true };
}
