# AirHost Notification Server

Service de notifications push pour l'application AirHost.

## Configuration requise

- Node.js >= 18.0.0
- npm

## Variables d'environnement

```
VAPID_PUBLIC_KEY=votre_clé_publique
VAPID_PRIVATE_KEY=votre_clé_privée
NODE_ENV=production
```

## Installation

```bash
npm install
```

## Démarrage

```bash
npm start
```

## Développement

```bash
npm run dev
```

## Endpoints

- POST /subscribe : S'abonner aux notifications
- POST /send-notification : Envoyer une notification
- GET /health : Vérifier l'état du serveur
