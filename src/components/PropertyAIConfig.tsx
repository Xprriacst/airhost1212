import React, { useState } from 'react';
import { Plus, Trash2, MessageSquare, Zap } from 'lucide-react';
import type { Property, AIInstruction, FAQItem } from '../types';

interface PropertyAIConfigProps {
  property: Property;
  onSave: (instructions: AIInstruction[], faq: FAQItem[]) => void;
}

const PropertyAIConfig: React.FC<PropertyAIConfigProps> = ({ property, onSave }) => {
  const [instructions, setInstructions] = useState<AIInstruction[]>(property.aiInstructions || []);
  const [faq, setFaq] = useState<FAQItem[]>(property.faq || []);
  const [activeTab, setActiveTab] = useState<'instructions' | 'faq'>('instructions');

  const addInstruction = () => {
    const newInstruction: AIInstruction = {
      id: Date.now().toString(),
      propertyId: property.id,
      type: 'tone',
      content: '',
      isActive: true,
      priority: instructions.length + 1
    };
    setInstructions([...instructions, newInstruction]);
  };

  const addFAQ = () => {
    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      propertyId: property.id,
      question: '',
      answer: '',
      category: 'general',
      isActive: true,
      useCount: 0
    };
    setFaq([...faq, newFAQ]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('instructions')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'instructions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 inline-block mr-2" />
            Instructions IA
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'faq'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline-block mr-2" />
            Questions fréquentes
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'instructions' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Instructions pour l'IA</h3>
              <button
                onClick={addInstruction}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {instructions.map((instruction, index) => (
                <div key={instruction.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <select
                      value={instruction.type}
                      onChange={(e) => {
                        const updated = [...instructions];
                        updated[index] = { ...instruction, type: e.target.value as AIInstruction['type'] };
                        setInstructions(updated);
                      }}
                      className="rounded-md border-gray-300"
                    >
                      <option value="tone">Ton</option>
                      <option value="knowledge">Connaissances</option>
                      <option value="rules">Règles</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = instructions.filter((_, i) => i !== index);
                        setInstructions(updated);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={instruction.content}
                    onChange={(e) => {
                      const updated = [...instructions];
                      updated[index] = { ...instruction, content: e.target.value };
                      setInstructions(updated);
                    }}
                    rows={3}
                    className="w-full rounded-md border-gray-300"
                    placeholder="Entrez les instructions pour l'IA..."
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Questions fréquentes</h3>
              <button
                onClick={addFAQ}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {faq.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const updated = [...faq];
                        updated[index] = { ...item, category: e.target.value as FAQItem['category'] };
                        setFaq(updated);
                      }}
                      className="rounded-md border-gray-300"
                    >
                      <option value="check-in">Check-in</option>
                      <option value="check-out">Check-out</option>
                      <option value="wifi">WiFi</option>
                      <option value="parking">Parking</option>
                      <option value="house-rules">Règles</option>
                      <option value="general">Général</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = faq.filter((_, i) => i !== index);
                        setFaq(updated);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...faq];
                        updated[index] = { ...item, question: e.target.value };
                        setFaq(updated);
                      }}
                      className="w-full rounded-md border-gray-300"
                      placeholder="Question"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...faq];
                        updated[index] = { ...item, answer: e.target.value };
                        setFaq(updated);
                      }}
                      rows={3}
                      className="w-full rounded-md border-gray-300"
                      placeholder="Réponse"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => onSave(instructions, faq)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyAIConfig;