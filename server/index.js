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

// Pull/Download a model
app.post('/api/pull', async (req, res) => {
  try {
    const ollamaUrl = req.body.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const { model, stream = true } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const response = await fetch(`${ollamaUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream })
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } catch (streamError) {
        console.error('Stream error:', streamError);
        res.end();
      }
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error pulling model:', error.message);
    res.status(500).json({ 
      error: 'Failed to pull model',
      message: error.message 
    });
  }
});

// Delete a model
app.delete('/api/delete', async (req, res) => {
  try {
    const ollamaUrl = req.body.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const response = await fetch(`${ollamaUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ollama responded with status ${response.status}`);
    }

    res.json({ success: true, message: `Model ${model} deleted successfully` });
  } catch (error) {
    console.error('Error deleting model:', error.message);
    res.status(500).json({ 
      error: 'Failed to delete model',
      message: error.message 
    });
  }
});

// Create a new model
app.post('/api/create', async (req, res) => {
  try {
    const ollamaUrl = req.body.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const { model, from, system, template, license, parameters, stream = true } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const createPayload = { model, stream };
    if (from) createPayload.from = from;
    if (system) createPayload.system = system;
    if (template) createPayload.template = template;
    if (license) createPayload.license = license;
    if (parameters) createPayload.parameters = parameters;

    const response = await fetch(`${ollamaUrl}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    });

    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        res.end();
      } catch (streamError) {
        console.error('Stream error:', streamError);
        res.end();
      }
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('Error creating model:', error.message);
    res.status(500).json({ 
      error: 'Failed to create model',
      message: error.message 
    });
  }
});

// List running models
app.get('/api/running', async (req, res) => {
  try {
    const ollamaUrl = req.query.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/ps`);
    
    if (!response.ok) {
      throw new Error(`Ollama responded with status ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching running models:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch running models',
      message: error.message 
    });
  }
});

// Show model information
app.post('/api/show', async (req, res) => {
  try {
    const ollamaUrl = req.body.url || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const { model } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }

    const response = await fetch(`${ollamaUrl}/api/show`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Ollama responded with status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching model info:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch model information',
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