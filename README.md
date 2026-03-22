# Ollama Model Management UI

A web-based dashboard to manage your local Ollama models.

## Features

- 📋 List all local Ollama models
- 🔧 Configurable Ollama server URL
- 📊 View model details (size, quantization, parameters, family)
- 🔌 Test connection to Ollama server

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express

## Prerequisites

- Node.js 18+ 
- Ollama running locally or on a remote server

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd ollama-model-management-ui

# Install all dependencies
npm run install:all
```

Or install manually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment

Copy the example environment file:
```bash
cp .env.template .env
```

Edit `.env` with your settings:
```env
# Server Configuration
PORT=3001

# Ollama Server URL
OLLAMA_BASE_URL=http://localhost:11434

# Client Port (for development)
VITE_PORT=5173
```

### 3. Development

Start both server and client:

```bash
# Terminal 1 - Start the backend server
cd server && npm start

# Terminal 2 - Start the frontend dev server
cd client && npm run dev
```

The application will be available at `http://localhost:5173`

### 4. Open in Browser

Navigate to `http://localhost:5173` to see the Ollama Model Manager.

## Port Configuration

You can control the ports by setting these environment variables in your `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `VITE_PORT` | Frontend dev server port | `5173` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |

Example: To run the frontend on port 3000, set `VITE_PORT=3000` in your `.env` file.

## Production Deployment

### Option 1: Simple Production Build

1. **Build the client:**
   ```bash
   cd client
   npm run build
   ```

2. **Serve with Express:**
   
   Update `server/index.js` to serve static files:
   ```javascript
   import express from 'express';
   import path from 'path';
   import { fileURLToPath } from 'url';
   
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   
   const app = express();
   
   // API routes
   app.get('/api/models', ...);
   
   // Serve static files from client/dist
   app.use(express.static(path.join(__dirname, '../client/dist')));
   
   // SPA fallback
   app.get('*', (req, res) => {
     res.sendFile(path.join(__dirname, '../client/dist/index.html'));
   });
   ```

3. **Start the server:**
   ```bash
   cd server
   npm start
   ```

### Option 2: Docker Deployment

Create a `Dockerfile` in the project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm run install:all

COPY . .
RUN cd client && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
COPY server/package*.json ./server/
COPY server/index.js ./server/
COPY --from=builder /app/client/dist ./client/dist

WORKDIR /app/server
RUN npm install --production

ENV PORT=3001
ENV OLLAMA_BASE_URL=http://host.docker.internal:11434

EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t ollama-ui .
docker run -p 3001:3001 ollama-ui
```

### Option 3: Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  ollama-ui:
    build: .
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Run with:
```bash
docker-compose up -d
```

### Option 4: Reverse Proxy (nginx)

1. Build the client: `cd client && npm run build`
2. Start the server: `cd server && npm start`
3. Configure nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/ollama-ui/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

## UI Configuration

Click the ⚙️ settings icon in the top-right corner to configure the Ollama server URL. The setting is saved in your browser's localStorage.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/models` | List all local models |
| `GET /api/test-connection` | Test connection to Ollama |
| `GET /api/version` | Get Ollama version |

All endpoints accept a `?url=` query parameter to specify a custom Ollama server URL.

## Development

```bash
# Start server in development mode (with auto-reload)
cd server && npm run dev

# Start client development server
cd client && npm run dev
```

## License

MIT