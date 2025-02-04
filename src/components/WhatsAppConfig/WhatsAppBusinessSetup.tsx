import React, { useState, useEffect } from 'react';
import { WhatsAppUserConfig } from '../../config/whatsapp';
import { userService } from '../../services/airtable/userService';

interface Props {
  userId: string;
  onConfigurationComplete?: () => void;
}

export const WhatsAppBusinessSetup: React.FC<Props> = ({ userId, onConfigurationComplete }) => {
  const [config, setConfig] = useState<Partial<WhatsAppUserConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, [userId]);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const existingConfig = await userService.getWhatsAppConfig(userId);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la configuration');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setIsLoading(true);

      await userService.updateWhatsAppConfig(userId, config as WhatsAppUserConfig);
      onConfigurationComplete?.();
    } catch (err) {
      setError('Erreur lors de la sauvegarde de la configuration');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof WhatsAppUserConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-4">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Configuration WhatsApp Business</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <h3 className="font-bold mb-2">Instructions :</h3>
        <ol className="list-decimal ml-4 space-y-2">
          <li>Créez une application dans Meta Business Manager</li>
          <li>Configurez l'API WhatsApp Business dans votre application</li>
          <li>Ajoutez et vérifiez votre numéro de téléphone WhatsApp Business</li>
          <li>Générez un token d'accès permanent</li>
          <li>Remplissez les informations ci-dessous</li>
        </ol>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Nom d'affichage WhatsApp
            <input
              type="text"
              value={config.displayName || ''}
              onChange={e => handleChange('displayName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: Villa Bella - Service Client"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number ID
            <input
              type="text"
              value={config.phoneNumberId || ''}
              onChange={e => handleChange('phoneNumberId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: 461158110424411"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            App ID
            <input
              type="text"
              value={config.appId || ''}
              onChange={e => handleChange('appId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: 123456789"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Access Token
            <input
              type="password"
              value={config.accessToken || ''}
              onChange={e => handleChange('accessToken', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Business ID
            <input
              type="text"
              value={config.businessId || ''}
              onChange={e => handleChange('businessId', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ex: 987654321"
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Verify Token
            <input
              type="text"
              value={config.verifyToken || ''}
              onChange={e => handleChange('verifyToken', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Token de vérification personnalisé"
              required
            />
          </label>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Enregistrement...' : 'Enregistrer la configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};
