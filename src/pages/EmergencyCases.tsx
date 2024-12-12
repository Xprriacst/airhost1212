import React, { useState } from 'react';
import { Plus, AlertTriangle, Car, Anchor, Package, HelpCircle, Thermometer } from 'lucide-react';
import type { EmergencyCase } from '../types';

const EmergencyCases: React.FC = () => {
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([
    {
      id: '1',
      name: 'Urgences',
      description: 'Quand un voyageur vous envoie un message concernant une urgence',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      isActive: true,
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Voyageur mécontent',
      description: 'Quand un voyageur exprime son mécontentement',
      icon: AlertTriangle,
      iconColor: 'text-orange-500',
      isActive: true,
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Impossible d\'accéder au logement',
      description: 'Quand les voyageurs ne peuvent pas accéder au logement',
      icon: Car,
      iconColor: 'text-blue-500',
      isActive: true,
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    },
    {
      id: '4',
      name: 'Appareil en panne',
      description: 'Quand un voyageur signale qu\'un appareil ne fonctionne pas',
      icon: Anchor,
      iconColor: 'text-purple-500',
      isActive: true,
      severity: 'medium',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    },
    {
      id: '5',
      name: 'Problème de stock',
      description: 'Il manque des draps, des serviettes ou autres consommables',
      icon: Package,
      iconColor: 'text-yellow-500',
      isActive: true,
      severity: 'medium',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    },
    {
      id: '6',
      name: 'Réponse inconnue',
      description: 'Si HostAI ne sait pas quoi répondre au voyageur',
      icon: HelpCircle,
      iconColor: 'text-gray-500',
      isActive: true,
      severity: 'low',
      autoDisablePilot: true,
      notifyHost: false,
      createdAt: new Date()
    },
    {
      id: '7',
      name: 'Chauffage',
      description: 'Demande de réglage du chauffage',
      icon: Thermometer,
      iconColor: 'text-red-400',
      isActive: true,
      severity: 'medium',
      autoDisablePilot: true,
      notifyHost: true,
      createdAt: new Date()
    }
  ]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tags de conversation</h1>
          <p className="text-gray-600 mt-1">
            Tagger les messages des voyageurs pour remonter à votre équipe
          </p>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau tag
        </button>
      </div>

      <div className="grid gap-4">
        {emergencyCases.map((emergencyCase) => {
          const IconComponent = emergencyCase.icon;
          return (
            <div
              key={emergencyCase.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg bg-gray-50 ${emergencyCase.iconColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{emergencyCase.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{emergencyCase.description}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Plus d'options</span>
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmergencyCases;