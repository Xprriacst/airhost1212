# Fonctionnalités et Régressions

## v1.5.7-int6 (31 janvier 2025)

### Nouvelles Fonctionnalités
- ✅ Génération de réponse IA partiellement implémentée
  - Gestion des instructions AI au format string et JSON
  - Intégration avec l'API OpenAI
  - Génération de réponses contextuelles basées sur l'historique des messages

### Régressions
- 🐛 Les messages reçus d'un même guest ne s'affichent plus dans la même conversation
  - Les nouveaux messages créent de nouvelles conversations au lieu d'être ajoutés aux conversations existantes
  - Impact sur la continuité des échanges avec les guests

- 🐛 Problème d'affichage du scroll dans la vue conversation
  - À l'ouverture d'une conversation, la vue ne défile plus automatiquement vers le dernier message
  - Impacte l'expérience utilisateur car il faut scroller manuellement pour voir les messages récents

### Prochaines Étapes
1. Corriger le regroupement des messages par guest
2. Restaurer le défilement automatique vers le dernier message
3. Améliorer la gestion des erreurs dans la génération de réponses IA
