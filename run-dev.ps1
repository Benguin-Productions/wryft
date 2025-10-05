# Run-Dev.ps1 - Development setup script for Wryft.xyz
# This script will set up and run both frontend and backend in development mode

# Set environment variables
$env:NODE_ENV = "development"
$env:VITE_API_URL = "http://localhost:3001"

# Function to check if a command exists
function Command-Exists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}

# Check for Node.js and npm
if (-not (Command-Exists "node" -or Command-Exists "node.exe")) {
    Write-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check for pnpm (preferred) or use npm
$packageManager = if (Command-Exists "pnpm") { "pnpm" } else { "npm" }
Write-Host "Using package manager: $packageManager"

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
& $packageManager install

# Install backend dependencies
Write-Host "Installing backend dependencies..."
Set-Location server
& $packageManager install
Set-Location ..

# Set up Prisma database
Write-Host "Setting up database..."
Set-Location server
& npx prisma generate
& npx prisma migrate dev --name init
Set-Location ..

# Start both frontend and backend
Write-Host "Starting development servers..."

# Start backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; $packageManager run dev"

# Start frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "$packageManager run dev"

Write-Host ""
Write-Host "========================================"
Write-Host "Development servers are starting..."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:3001"
Write-Host "========================================"
Write-Host ""
Write-Host "Press any key to stop all servers..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
