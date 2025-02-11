import { useState } from 'react';
import { MessageSquare } from 'lucide-react';

interface WhatsAppTemplateSelectorProps {
  onSelectTemplate: (template: { id: string; language: string }) => void;
}

export function WhatsAppTemplateSelector({ onSelectTemplate }: WhatsAppTemplateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const templates = [
    { id: 'hello_world', name: 'Hello World', description: 'Template de test (en anglais)', language: 'en_US' },
    { id: 'bienvenue', name: 'Bienvenue', description: 'Message de bienvenue (en français)', language: 'fr' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full bg-green-100 hover:bg-green-200"
        aria-label="templates WhatsApp"
        title="Envoyer un template WhatsApp"
      >
        <MessageSquare className="w-5 h-5 text-green-600" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-lg shadow-lg border p-2 z-10">
          <h3 className="text-sm font-semibold mb-2 px-2">Templates WhatsApp</h3>
          <div className="space-y-1">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  console.log('🎯 Template sélectionné:', {
                    templateId: template.id,
                    templateName: template.name,
                    language: template.language
                  });
                  onSelectTemplate({ id: template.id, language: template.language });
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm"
              >
                <div className="font-medium">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
