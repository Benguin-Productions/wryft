# Deploy-Prod.ps1 - Production deployment script for wryft.xyz
# This script will build and prepare the application for production

# Set environment variables for production
$env:NODE_ENV = "production"
$env:VITE_API_URL = "https://api.wryft.xyz"  # Update with your actual API domain

# Check for Node.js and npm
if (-not (Command-Exists "node" -or Command-Exists "node.exe")) {
    Write-Error "Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
}

# Check for pnpm (preferred) or use npm
$packageManager = if (Command-Exists "pnpm") { "pnpm" } else { "npm" }
Write-Host "Using package manager: $packageManager"

# Build frontend
Write-Host "Building frontend..."
& $packageManager run build

# Build backend
Write-Host "Building backend..."
Set-Location server
& $packageManager run build
Set-Location ..

# Set up production environment
Write-Host "Setting up production environment..."

# Create .env.production if it doesn't exist
if (-not (Test-Path ".env.production")) {
    @"
    # Production Environment Variables
    NODE_ENV=production
    PORT=3000
    JWT_SECRET=your-secret-key-here
    DATABASE_URL="file:./dev.db"
    "@ | Out-File -FilePath ".env.production" -Encoding utf8
    Write-Host "Created .env.production - Please update with your production values"
}

Write-Host ""
Write-Host "========================================"
Write-Host "Production build complete!"
Write-Host ""
Write-Host "To run in production:"
Write-Host "1. Set up a reverse proxy (Nginx/Apache) for wryft.xyz"
Write-Host "2. Configure SSL certificates"
Write-Host "3. Set up PM2/Process Manager for Node.js"
Write-Host "4. Set up a database backup strategy"
Write-Host ""
Write-Host "Example PM2 startup command:"
Write-Host "  pm2 start server/dist/index.js --name 'wryft-backend'"
Write-Host "  pm2 serve frontend/dist 3000 --spa --name 'wryft-frontend'"
Write-Host "========================================"

# Function to check if a command exists
function Command-Exists {
    param($command)
    $exists = $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
    return $exists
}
