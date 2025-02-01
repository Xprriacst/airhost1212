#!/bin/bash

# Configuration des variables d'environnement pour WhatsApp Business API
echo "Configuration des variables d'environnement WhatsApp Business API..."

# Netlify CLI pour définir les variables d'environnement
netlify env:set WHATSAPP_APP_ID "votre_app_id"
netlify env:set WHATSAPP_APP_SECRET "votre_app_secret"
netlify env:set WHATSAPP_VERIFY_TOKEN "votre_token_verification"
netlify env:set WHATSAPP_API_VERSION "v18.0"

# Variables pour le développement local (.env)
cat > .env << EOL
WHATSAPP_APP_ID=votre_app_id
WHATSAPP_APP_SECRET=votre_app_secret
WHATSAPP_VERIFY_TOKEN=votre_token_verification
WHATSAPP_API_VERSION=v18.0
EOL

echo "Configuration terminée !"
echo "N'oubliez pas de :"
echo "1. Remplacer les valeurs par défaut par vos véritables credentials"
echo "2. Configurer le webhook dans Meta Business Manager"
echo "3. Ajouter ces variables dans vos paramètres Netlify"
