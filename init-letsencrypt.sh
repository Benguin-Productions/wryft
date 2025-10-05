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

echo "Using webroot challenge. Ensure nginx is RUNNING and serving /.well-known/acme-challenge/ from /var/www/certbot on port 80."

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

echo "SSL certificate for $DOMAIN has been created successfully!"
echo "Your site is now being served over HTTPS at https://$DOMAIN"
