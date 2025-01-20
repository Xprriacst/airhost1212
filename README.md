# Airhost - Application de gestion de locations

## 🚀 Roadmap et Statut des Tâches

### 📱 Interface Mobile
- [x] Copier-coller dans la barre de texte mobile
- [x] Comportement normal du clavier lors de l'envoi d'un message
- [ ] Clavier fixe après l'envoi d'un message
- [ ] En-tête fixe après ouverture du clavier
- [ ] Scroll dans la page des settings de l'appartement
- [ ] Optimisation de l'en-tête mobile (rétrécissement du bouton auto pilot)
- [ ] Affichage correct du chat sandbox
- [ ] Désarrondir la barre de texte avec le texte long

### 💬 Gestion des Conversations
- [x] Actualisation automatique des conversations
- [x] Bulle notification au niveau de la conversation
- [ ] Affichage des "..." pour les messages trop longs
- [ ] Menu principal : liste des conversations par défaut
- [ ] Design style WhatsApp avec statut client (actuel/ancien/futur)
- [ ] Affichage chronologique comme WhatsApp
- [ ] Bouton Send fonctionnel dans la pop-up
- [ ] Modification des messages après envoi
- [ ] Retour à la ligne sans envoi de message

### 🤖 Auto Pilot et IA
- [x] Logique d'emergency cases implémentée
- [ ] Mode Auto Pilot fonctionnel avec réponses automatiques
- [ ] Message de désactivation de l'auto pilot
- [ ] Désactivation gérée par l'IA
- [ ] Mots-clés de désactivation identifiés
- [ ] Gestion du contexte OpenAI
- [ ] Délai entre deux réponses automatiques
- [ ] Jauge de précision de l'IA
- [ ] Configuration des prompts et base de données via IHM
- [ ] Arrêt de l'IA après intervention humaine
- [ ] Configuration des cas d'urgence
- [ ] Bouton on/off IA par conversation

### 📊 Intégration et Automatisation
- [x] Routage conversations avec téléphone
- [ ] Création de ligne Airtable pour chaque réservation
- [ ] Option "passer make" ou "api intégré"
- [ ] Webhook pour l'envoi des messages
- [ ] Intégration WhatsApp
- [ ] Messages par SMS

### 🐛 Bugs à Résoudre
- [ ] Réception partielle des notifications
- [ ] Messages longs non reçus/envoyés
- [ ] Dates invalides
- [ ] Test de cohérence entre IA de test et de production

### 📱 Application
- [ ] Notifications push
- [ ] Notifications d'urgence
- [ ] Notifications au niveau de l'app
- [ ] Bulles de conversation
- [ ] Téléchargement de l'application

### 🔄 Post-Séjour
- [ ] Résumé automatique des discussions
- [ ] Message de satisfaction
- [ ] Demande d'avis et notation

### 📊 Analytics
- [ ] Camemberts pour statistiques messages automatisés
- [ ] Jauge de remplissage des infos logement

### 👥 Gestion Utilisateurs
- [ ] Comptes utilisateurs sans Google
- [ ] Envoi de fichiers (images/vidéos)
- [ ] Catégorie Question/Réponse dans AI knowledge

## 🔧 Informations de Déploiement

### Netlify
- **URL du site** : https://whimsical-beignet-91329f.netlify.app
- **ID du site** : ffb49ecb-76d4-46a2-bbe2-d7622e8dfeef
- **Clé d'API** : nfp_nPoYHg7YbGWgYduYjmrvvbuG4mmb2L3Ca885 (expire le 27/01/2025)

### Commandes utiles pour vérifier le déploiement
```bash
# Vérifier le statut du dernier déploiement
curl -H "Authorization: Bearer $NETLIFY_TOKEN" \
  https://api.netlify.com/api/v1/sites/ffb49ecb-76d4-46a2-bbe2-d7622e8dfeef/deploys?per_page=1

# Liste des déploiements
curl -H "Authorization: Bearer $NETLIFY_TOKEN" \
  https://api.netlify.com/api/v1/sites/ffb49ecb-76d4-46a2-bbe2-d7622e8dfeef/deploys
```

Note : La clé d'API Netlify expire dans 7 jours (le 27/01/2025). Pensez à la renouveler avant cette date.

## 🔍 Cas d'Urgence Identifiés
- Client mécontent
- Problème technique
- Manque de quelque chose
- IA ne sait pas répondre