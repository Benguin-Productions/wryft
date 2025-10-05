#!/bin/bash
# Deploy-Prod.sh - Production deployment script for wryft.xyz (Ubuntu/Linux version)

# Set environment variables for production
export NODE_ENV=production
export VITE_API_URL="https://api.wryft.xyz"  # Update with your actual API domain

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

# Install PM2 if not installed
if ! command_exists pm2; then
    echo "Installing PM2..."
    sudo npm install -g pm2
fi

# Build frontend
echo "Building frontend..."
$PACKAGE_MANAGER install
$PACKAGE_MANAGER run build

# Build backend
echo "Building backend..."
cd server
$PACKAGE_MANAGER install
$PACKAGE_MANAGER run build
cd ..

# Set up production environment
echo "Setting up production environment..."

# Create .env.production if it doesn't exist
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOL
# Production Environment Variables
NODE_ENV=production
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
DATABASE_URL="file:./prod.db"
EOL
    echo "Created .env.production - Please review and update with your production values"
fi

# Set up Nginx configuration
if [ ! -f "/etc/nginx/sites-available/wryft.xyz" ]; then
    echo "Setting up Nginx configuration..."
    sudo bash -c 'cat > /etc/nginx/sites-available/wryft.xyz << EOL
server {
    server_name wryft.xyz www.wryft.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL'
    
    # Enable the site
    sudo ln -s /etc/nginx/sites-available/wryft.xyz /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
fi

# Install Certbot for SSL if not installed
if ! command_exists certbot; then
    echo "Installing Certbot for SSL..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Get SSL certificate
if [ ! -f "/etc/letsencrypt/live/wryft.xyz/fullchain.pem" ]; then
    echo "Getting SSL certificate..."
    sudo certbot --nginx -d wryft.xyz -d www.wryft.xyz --non-interactive --agree-tos -m your-email@example.com
    sudo systemctl restart nginx
fi

# Start services with PM2
echo "Starting services with PM2..."

# Start backend
cd server
pm2 start dist/index.js --name "wryft-backend"
cd ..

# Start frontend
pm2 serve dist 3000 --spa --name "wryft-frontend"

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot
pm2 startup

# Instructions
echo ""
echo "========================================"
echo "Deployment complete!"
echo ""
echo "Your application is now running on:"
echo "- Frontend: https://wryft.xyz"
echo "- Backend:  https://wryft.xyz/api"
echo ""
echo "To manage your services:"
echo "- View logs:         pm2 logs"
echo "- Monitor processes: pm2 monit"
echo "- List processes:    pm2 list"
echo ""
echo "To set up automatic certificate renewal:"
echo "  sudo certbot renew --dry-run"
echo ""
echo "To update your application in the future:"
echo "1. Pull the latest changes"
echo "2. Run: $PACKAGE_MANAGER run build"
echo "3. Run: pm2 restart all"
echo "========================================"
echo ""
