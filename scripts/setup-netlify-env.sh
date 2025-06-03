#!/bin/bash

# Script to set up environment variables in Netlify
# This script helps ensure all required environment variables are set

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
RESET="\033[0m"

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}Netlify CLI is not installed.${RESET}"
    echo -e "Please install it with: ${BOLD}npm install -g netlify-cli${RESET}"
    exit 1
fi

# Check if user is logged in to Netlify
if ! netlify status &> /dev/null; then
    echo -e "${YELLOW}You are not logged in to Netlify.${RESET}"
    echo -e "Please login with: ${BOLD}netlify login${RESET}"
    exit 1
fi

# Get site ID from netlify.toml if available
SITE_ID=""
if [ -f "netlify.toml" ]; then
    SITE_ID=$(grep -o 'site_id = "[^"]*"' netlify.toml | cut -d'"' -f2)
fi

# If site ID not found, ask user to select site
if [ -z "$SITE_ID" ]; then
    echo -e "${BLUE}Please select your Netlify site:${RESET}"
    netlify sites:list
    echo -e "${YELLOW}Enter the site ID from the list above:${RESET}"
    read SITE_ID
fi

echo -e "${BLUE}Setting up environment variables for site ID: ${BOLD}$SITE_ID${RESET}"

# Function to set an environment variable in Netlify
set_env_var() {
    local name=$1
    local value=$2
    local is_sensitive=${3:-false}
    
    # Check if variable already exists
    if netlify env:get $name --scope production > /dev/null 2>&1; then
        echo -e "${YELLOW}Environment variable ${BOLD}$name${RESET}${YELLOW} already exists.${RESET}"
        echo -e "Do you want to update it? (y/n)"
        read update
        if [ "$update" != "y" ]; then
            echo -e "${BLUE}Skipping ${BOLD}$name${RESET}"
            return
        fi
    fi
    
    # Set the variable
    if [ "$is_sensitive" = true ]; then
        echo -e "${GREEN}Setting sensitive environment variable ${BOLD}$name${RESET}"
        netlify env:set $name "$value" --scope production
    else
        echo -e "${GREEN}Setting environment variable ${BOLD}$name${RESET}"
        netlify env:set $name "$value" --scope production
    fi
}

# Set up Stripe variables
echo -e "\n${BLUE}${BOLD}Setting up Stripe environment variables${RESET}\n"

# Stripe Publishable Key
echo -e "${YELLOW}Enter your Stripe Publishable Key (starts with pk_):${RESET}"
read STRIPE_PUBLISHABLE_KEY

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${RED}Stripe Publishable Key is required.${RESET}"
    exit 1
fi

set_env_var "VITE_STRIPE_PUBLISHABLE_KEY" "$STRIPE_PUBLISHABLE_KEY" false

# Stripe Secret Key
echo -e "${YELLOW}Enter your Stripe Secret Key (starts with sk_):${RESET}"
read -s STRIPE_SECRET_KEY
echo ""

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}Stripe Secret Key is required.${RESET}"
    exit 1
fi

set_env_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" true

# Stripe Webhook Secret
echo -e "${YELLOW}Enter your Stripe Webhook Secret (starts with whsec_):${RESET}"
read -s STRIPE_WEBHOOK_SECRET
echo ""

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}No Stripe Webhook Secret provided. Skipping.${RESET}"
else
    set_env_var "STRIPE_WEBHOOK_SECRET" "$STRIPE_WEBHOOK_SECRET" true
fi

# Set mock mode to false
echo -e "\n${BLUE}${BOLD}Setting VITE_ENABLE_MOCK_MODE to false${RESET}\n"
set_env_var "VITE_ENABLE_MOCK_MODE" "false" false

# Set the application URL
echo -e "\n${BLUE}${BOLD}Setting VITE_APP_URL to the production URL${RESET}\n"
set_env_var "VITE_APP_URL" "https://lucky-jaydus.netlify.app" false

echo -e "\n${GREEN}${BOLD}Environment variables have been set up successfully!${RESET}"
echo -e "${BLUE}You can verify them in the Netlify dashboard under Site settings > Environment variables.${RESET}"

# Trigger a new deployment
echo -e "\n${YELLOW}Do you want to trigger a new deployment? (y/n)${RESET}"
read trigger_deploy

if [ "$trigger_deploy" = "y" ]; then
    echo -e "${BLUE}Triggering a new deployment...${RESET}"
    netlify deploy --prod
    echo -e "${GREEN}Deployment triggered successfully!${RESET}"
fi

echo -e "\n${GREEN}${BOLD}Setup complete!${RESET}"