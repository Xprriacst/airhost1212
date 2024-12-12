const MOCK_RESPONSES = [
  "Bien sûr, je peux vous aider avec ça ! Le code WiFi est affiché sur le routeur dans le salon.",
  "Le check-out est à 11h. N'oubliez pas de laisser les clés sur la table de la cuisine.",
  "Je suis désolé pour ce désagrément. Je vais envoyer quelqu'un pour régler ce problème dès que possible.",
  "Bienvenue ! Vous trouverez toutes les informations nécessaires dans le guide d'accueil sur la table basse.",
  "Il y a plusieurs excellents restaurants à proximité. Je vous recommande particulièrement le bistrot au coin de la rue."
];

export const getMockResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
  return MOCK_RESPONSES[randomIndex];
};