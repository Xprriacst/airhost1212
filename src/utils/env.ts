/**
 * Safely retrieves environment variables
 */
export const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value && process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
  return value || '';
};

/**
 * Checks if all required environment variables are present
 */
export const validateRequiredEnvVars = (requiredVars: string[]): boolean => {
  let isValid = true;
  
  for (const varName of requiredVars) {
    if (!getEnvVar(varName)) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      isValid = false;
    }
  }
  
  return isValid;
};