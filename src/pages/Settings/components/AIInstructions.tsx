import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Property, AIInstruction } from '../../../types';
import { propertyService } from '../../../services';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useProperties } from '../../../hooks/useProperties';

interface AIInstructionsProps {
  property: Property;
}

const INSTRUCTION_TYPES = [
  { value: 'tone', label: 'Ton et Style' },
  { value: 'knowledge', label: 'Connaissances' },
  { value: 'rules', label: 'Règles' }
] as const;

const AIInstructions: React.FC<AIInstructionsProps> = ({ property }) => {
  const { user } = useCurrentUser();
  const { refetch } = useProperties();
  const [instructions, setInstructions] = useState<AIInstruction[]>([]);

  // Mettre à jour les instructions quand la propriété change
  useEffect(() => {
    try {
      if (!property.aiInstructions) {
        setInstructions([]);
        return;
      }
      if (Array.isArray(property.aiInstructions)) {
        console.log('[DEBUG] Mise à jour des instructions depuis la propriété:', property.aiInstructions);
        setInstructions(property.aiInstructions);
        return;
      }
      setInstructions([]);
    } catch (e) {
      console.warn('Failed to parse AI Instructions:', e);
      setInstructions([]);
    }
  }, [property.aiInstructions]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddInstruction = () => {
    const newInstruction: AIInstruction = {
      id: Date.now().toString(),
      propertyId: property.id,
      type: 'tone',
      content: '',
      isActive: true,
      priority: instructions.length + 1
    };
    setInstructions(prev => [...prev, newInstruction]);
  };

  const handleRemoveInstruction = (id: string) => {
    setInstructions(prev => prev.filter(instruction => instruction.id !== id));
  };

  const handleUpdateInstruction = (id: string, updates: Partial<AIInstruction>) => {
    setInstructions(prev => prev.map(instruction =>
      instruction.id === id ? { ...instruction, ...updates } : instruction
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await propertyService.updateProperty(user.id, property.id, {
        aiInstructions: instructions
      });
      setSuccess('Instructions IA mises à jour avec succès');
      // Recharger les propriétés pour mettre à jour l'interface
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour des instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Instructions pour l'IA</h3>
      </div>

      <div className="space-y-4">
        {instructions.map((instruction) => (
          <div key={instruction.id} className="border rounded-lg p-4">
            <div className="flex justify-between mb-4">
              <select
                value={instruction.type}
                onChange={(e) => handleUpdateInstruction(instruction.id, {
                  type: e.target.value as AIInstruction['type']
                })}
                className="rounded-md border-gray-300"
              >
                {INSTRUCTION_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRemoveInstruction(instruction.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={instruction.content}
              onChange={(e) => handleUpdateInstruction(instruction.id, {
                content: e.target.value
              })}
              rows={15}
              className="w-full rounded-md border-gray-300 pl-3"
              placeholder="Entrez les instructions pour l'IA..."
            />
            <div className="mt-2 flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={instruction.isActive}
                  onChange={(e) => handleUpdateInstruction(instruction.id, {
                    isActive: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-900">Actif</span>
              </label>
            </div>
          </div>
        ))}

        {instructions.length === 0 && (
          <div className="text-center py-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucune instruction IA. Ajoutez-en une pour commencer.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Enregistrer les instructions'}
        </button>
      </div>
    </form>
  );
};

export default AIInstructions;