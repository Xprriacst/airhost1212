// Hook pour accéder aux variables d'environnement
export const useEnv = () => {
  return {
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    REACT_APP_AIRTABLE_API_KEY: process.env.REACT_APP_AIRTABLE_API_KEY,
    REACT_APP_AIRTABLE_BASE_ID: process.env.REACT_APP_AIRTABLE_BASE_ID
  };
};
