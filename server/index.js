import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper to get Ollama base URL from request or default
const getOllamaUrl = (req) => {
  // Check for custom URL in request body/headers, or use environment variable, or default
  return req.body?.ollamaUrl || req.headers['x-ollama-url'] || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
};

// Proxy endpoint to list models
app.get('/api/models', async (req, res) => {
  try {
    const ollamaUrl = req.query.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch models from Ollama',
      message: error.message 
    });
  }
});

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const ollamaUrl = req.query.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/version`);
    
    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }
    
    const data = await response.json();
    res.json({ 
      success: true, 
      version: data.version,
      url: ollamaUrl 
    });
  } catch (error) {
    console.error('Connection test failed:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to connect to Ollama',
      message: error.message 
    });
  }
});

// Get Ollama version
app.get('/api/version', async (req, res) => {
  try {
    const ollamaUrl = req.query.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/version`);
    
    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching version:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Ollama version',
      message: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Default Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
});