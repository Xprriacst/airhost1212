"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConfigValid = exports.env = void 0;
var zod_1 = require("zod");
// Validation avec zod pour garantir que les variables sont présentes
var envSchema = zod_1.z.object({
    airtable: zod_1.z.object({
        apiKey: zod_1.z.string().min(1, 'Airtable API key is required'),
        baseId: zod_1.z.string().min(1, 'Airtable Base ID is required'),
    }),
    openai: zod_1.z.object({
        apiKey: zod_1.z.string().min(1, 'OpenAI API key is required'),
        model: zod_1.z.string().optional(),
    }),
    whatsapp: zod_1.z.object({
        appId: zod_1.z.string().min(1, 'WhatsApp App ID is required'),
        accessToken: zod_1.z.string().min(1, 'WhatsApp Access Token is required'),
        verifyToken: zod_1.z.string().min(1, 'WhatsApp Verify Token is required'),
        apiVersion: zod_1.z.string().min(1, 'WhatsApp API Version is required'),
    }),
});
// Fonction pour récupérer les variables d'environnement
var getEnvVar = function (key) {
    try {
        // Contexte Vite
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key] || '';
        }
    }
    catch (_a) {
        // Ignorer si import.meta.env n'est pas disponible
    }
    // Contexte Node.js (Netlify Functions)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || '';
    }
    return '';
};
// Variables d'environnement
exports.env = {
    airtable: {
        apiKey: getEnvVar('AIRTABLE_API_KEY'),
        baseId: getEnvVar('AIRTABLE_BASE_ID'),
    },
    openai: {
        apiKey: getEnvVar('VITE_OPENAI_API_KEY'),
        model: 'gpt-4',
    },
    whatsapp: {
        appId: getEnvVar('WHATSAPP_APP_ID'),
        accessToken: getEnvVar('WHATSAPP_ACCESS_TOKEN'),
        verifyToken: getEnvVar('WHATSAPP_VERIFY_TOKEN'),
        apiVersion: getEnvVar('WHATSAPP_API_VERSION'),
    },
};
// Validation des variables d'environnement
var validateEnv = function () {
    try {
        envSchema.parse(exports.env);
        console.log('Environment variables are valid.');
        return true;
    }
    catch (error) {
        console.error('Environment validation failed:', error);
        return false;
    }
};
exports.isConfigValid = validateEnv();
