#!/bin/bash

# Exit on error
set -e

# Check for domain argument
if [ -z "$1" ]; then
    echo "Please provide your domain name as an argument"
    echo "Example: ./init-letsencrypt.sh example.com"
    exit 1
fi

DOMAIN=$1
EMAIL="admin@$DOMAIN"  # Change this to your email

# Create necessary directories
mkdir -p certbot/conf certbot/www

# Stop any running nginx containers
docker-compose -f docker-compose.prod.yml stop nginx

# Get SSL certificate
docker run -it --rm \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN \
    -d www.$DOMAIN \
    --force-renewal

# Start nginx
docker-compose -f docker-compose.prod.yml up -d nginx

echo "SSL certificate for $DOMAIN has been created successfully!"
echo "Your site is now being served over HTTPS at https://$DOMAIN"
