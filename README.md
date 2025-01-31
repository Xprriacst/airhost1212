# Airhost - Application de gestion de locations

## 🚀 Roadmap et Statut des Tâches



### 💬 Gestion des Conversations
- [x] Actualisation automatique des conversations
- [x] Bulle notification au niveau de la conversation
- [x] Affichage de la liste de conversation par utiliateur
- [REG] Affichage du nombre de messages non lus - regression depuis implementation de la gestion multi-comptes
- [REG] Les messages d'un même guest créent de nouvelles conversations au lieu d'être ajoutés aux conversations existantes
- [REG] À l'ouverture d'une conversation, la vue ne défile plus automatiquement vers le dernier message
- [ ] Affichage des "..." pour les messages trop longs
- [ ] Menu principal : liste des conversations par défaut
- [ ] Design style WhatsApp avec statut client (actuel/ancien/futur)
- [ ] Affichage chronologique comme WhatsApp
- [ ] Bouton Send fonctionnel dans la pop-up
- [ ] Modification des messages après envoi
- [ ] Retour à la ligne sans envoi de message

### 🤖 Auto Pilot et IA
- [x] Génération de réponse IA partiellement implémentée
- [x] Gestion des instructions AI au format string et JSON
- [REG] Logique d'emergency cases implémentée - regression de puis implementation de la gestion multi-comptes
- [REG] Mode Auto Pilot fonctionnel avec réponses automatiques - regression de puis implementation de la gestion multi-comptes
- [REG] Message de désactivation de l'auto pilot - regression de puis implementation de la gestion multi-comptes
- [REG] Persistance de l'activation/désactivation de l'Auto Pilot
- [REG] Activation/Désactivation manuelle du mode Auto Pilot- regression depuis implementation de la gestion multi-comptes
- [REG] génération automatique de messages - regression depuis implementation de la gestion multi-comptes
- [ ] Désactivation gérée par l'IA 
- [ ] Mots-clés de désactivation identifiés
- [ ] Gestion du contexte OpenAI
- [ ] Délai entre deux réponses automatiques
- [ ] Jauge de précision de l'IA
- [ ] Configuration des prompts et base de données via IHM
- [ ] Arrêt de l'IA après intervention humaine
- [ ] Configuration des cas d'urgence
- [ ] Bouton on/off IA par conversation

### Propriétés 
- [REG] Affichage des propriété - l'affichage n'est plus aussi beau que dans la 1.5.4

### Settings
- [REG] Scroll fonctionnel dans la fenetre de setting d'un appartement - regression depuis implementation de la gestion multi-comptes
- [REG] Possibilité des renseigner du AI knoledges - regression depuis implementation de la gestion multi-comptes

### Emergency cases
- [x] Affichage des cas 
- [ ] Scroll dans la page

### 📱 Interface Mobile
- [x] Copier-coller dans la barre de texte mobile
- [ ] Comportement normal du clavier lors de l'envoi d'un message - non : le clavier se ferme après envoie de message
- [ ] Clavier fixe après l'envoi d'un message
- [ ] En-tête fixe après ouverture du clavier
- [ ] Scroll dans la page des settings de l'appartement
- [ ] Optimisation de l'en-tête mobile (rétrécissement du bouton auto pilot)
- [ ] Affichage correct du chat sandbox
- [ ] Désarrondir la barre de texte avec le texte long


### Chat sandbox
- [REF] Selection d'une propriété - regression depuis implementation de la gestion multi-comptes
- [ ] Affichage de la chat sandbox
- [ ] Scroll fonctionnel
- [REG] Réponses de l'IA - regression depuis implementation de la gestion multi-comptes
- [REG] Les réponses de l'IA sont bien basée sur le contexte de l'appartement sélectionné - regression depuis implementation de la gestion multi-comptes

### 📊 Intégration et Automatisation
- [x] Routage conversations avec téléphone
- [x] Création de ligne Airtable pour chaque réservation
- [x] Option "passer make" ou "api intégré" - on est repassé sur make
- [x] Webhook pour l'envoi des messages
- [x] Intégration WhatsApp
- [ ] Messages par SMS

### 🐛 Bugs à Résoudre
- [ ] Réception partielle des notifications
- [ ] Messages longs non reçus/envoyés
- [ ] Dates invalides
- [ ] Test de cohérence entre IA de test et de production

### 📱 Application
- [ ] Notifications push - en cours
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
- [x] Comptes utilisateurs sans Google
- [ ] Bouton pour se deconnecter de son compte (logout)
- [ ] Envoi de fichiers (images/vidéos)
- [ ] Catégorie Question/Réponse dans AI knowledge

## 📊 État du Projet (24/01/2025)



********************

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

## 🔍 Cas d'Urgence Identifiés
- Client mécontent
- Problème technique
- Manque de quelque chose
- IA ne sait pas répondre

## 📝 Notes techniques
- La gestion des comptes utilisateurs a été intégrée récemment
- Les services ont été modifiés pour utiliser Airtable
- L'authentification impacte l'accès aux propriétés et aux messages
- La version 1.5.4 est la dernière version stable connue

## 🔧 Informations Techniques

### Plan d'action technique
1. **Phase d'analyse**
   - Examiner le code de la v1.5.4 pour chaque fonctionnalité
   - Identifier les différences avec l'implémentation multi-compte
   - Documenter les points de conflit

2. **Phase de développement**
   - Écrire des tests pour chaque fonctionnalité
   - Adapter le code v1.5.4 au modèle multi-compte
   - Valider les corrections avec les tests

3. **Phase de déploiement**
   - Déployer les corrections par ordre de priorité
   - Valider en environnement de production
   - Documenter les changements