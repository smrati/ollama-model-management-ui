#!/bin/bash

# Configuration
SERVER_DIR="./server"
CLIENT_DIR="./client"

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "Starting Ollama Model Manager..."

# Start backend server
echo "Starting backend server..."
(cd "$SERVER_DIR" && npm start) &

# Start frontend development server
echo "Starting frontend dev server..."
(cd "$CLIENT_DIR" && npm run dev) &

echo ""
echo "Ollama Model Manager is starting!"
echo "- Backend: http://localhost:3001"
echo "- Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

# Wait for background processes
wait
