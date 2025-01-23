import React from 'react';
import { AlertTriangle, Clock, Package, Wrench, X } from 'lucide-react';

interface EmergencyAlertProps {
  tag: string;
  onClose: () => void;
}

const EmergencyAlert: React.FC<EmergencyAlertProps> = ({ tag, onClose }) => {
  const getEmergencyInfo = () => {
    switch (tag) {
      case 'urgence':
        return {
          title: 'Urgence détectée',
          description: 'Le voyageur signale une urgence',
          color: 'red',
          icon: AlertTriangle
        };
      case 'client_mecontent':
        return {
          title: 'Voyageur mécontent',
          description: 'Le voyageur exprime son mécontentement',
          color: 'orange',
          icon: AlertTriangle
        };
      case 'probleme_technique':
        return {
          title: 'Problème technique',
          description: 'Un appareil ne fonctionne pas correctement',
          color: 'purple',
          icon: Wrench
        };
      case 'probleme_stock':
        return {
          title: 'Problème de stock',
          description: 'Il manque des consommables',
          color: 'gray',
          icon: Package
        };
      case 'reponse_inconnue':
        return {
          title: 'Réponse requise',
          description: 'Une réponse rapide est nécessaire',
          color: 'blue',
          icon: Clock
        };
      default:
        return null;
    }
  };

  const info = getEmergencyInfo();
  if (!info) return null;

  const IconComponent = info.icon;

  return (
    <div className={`bg-white border-l-4 border-${info.color}-500 p-4 mb-4 relative`}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start pr-8">
        <div className={`p-2 text-${info.color}-600`}>
          <IconComponent className="w-5 h-5" />
        </div>
        <div className="ml-3">
          <h3 className="text-gray-800 font-medium">{info.title}</h3>
          <p className="text-gray-600 mt-1">{info.description}</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyAlert;
