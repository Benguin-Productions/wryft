#!/bin/bash
# Run-Dev.sh - Development setup script for Wryft.xyz (Ubuntu/Linux version)
# This script will set up and run both frontend and backend in development mode

# Set environment variables
export NODE_ENV=development
export VITE_API_URL="http://localhost:3001"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js and npm
if ! command_exists node || ! command_exists npm; then
    echo "Node.js and npm are required but not installed."
    echo "Please install Node.js and npm first."
    echo "You can use nvm (Node Version Manager) to install them:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash"
    echo "  nvm install --lts"
    exit 1
fi

# Check for pnpm (preferred) or use npm
if command_exists pnpm; then
    PACKAGE_MANAGER="pnpm"
else
    PACKAGE_MANAGER="npm"
fi
echo "Using package manager: $PACKAGE_MANAGER"

# Install frontend dependencies
echo "Installing frontend dependencies..."
$PACKAGE_MANAGER install

# Install backend dependencies
echo "Installing backend dependencies..."
cd server
$PACKAGE_MANAGER install
cd ..

# Set up Prisma database
echo "Setting up database..."
cd server
npx prisma generate
npx prisma migrate dev --name init
cd ..

# Start both frontend and backend
echo "Starting development servers..."

# Start backend in the background
echo "Starting backend server..."
cd server
$PACKAGE_MANAGER run dev &
BACKEND_PID=$!
cd ..

# Start frontend in the foreground
echo "Starting frontend server..."
$PACKAGE_MANAGER run dev
FRONTEND_PID=$!

# Function to clean up on script exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

echo ""
echo "========================================"
echo "Development servers are running..."
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "========================================"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
