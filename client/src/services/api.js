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