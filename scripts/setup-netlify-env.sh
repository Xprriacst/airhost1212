#!/bin/bash

# Configuration des variables d'environnement sur Netlify
netlify env:set VITE_AIRTABLE_API_KEY "patlhfIgBrQOublx1.abb4f6845a28c05bdbb50de759bff59e27ae77c1fac38009506be9e2fe2c727a"
netlify env:set VITE_AIRTABLE_BASE_ID "appOuR5fZOnAGiS3b"
netlify env:set VITE_WHATSAPP_API_VERSION "v21.0"
netlify env:set VITE_WHATSAPP_VERIFY_TOKEN "airhost_whatsapp_webhook_123"

# Note: Remplacer YOUR_APP_SECRET par le vrai secret
echo "⚠️ N'oubliez pas de configurer WHATSAPP_APP_SECRET avec le vrai secret de l'application WhatsApp"
echo "Commande : netlify env:set WHATSAPP_APP_SECRET \"your_app_secret_here\""
