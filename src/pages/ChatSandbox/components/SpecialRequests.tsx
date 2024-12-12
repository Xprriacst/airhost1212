import React from 'react';

interface SpecialRequestsProps {
  requests: string[];
  onChange: (requests: string[]) => void;
}

const SpecialRequests: React.FC<SpecialRequestsProps> = ({ requests, onChange }) => {
  const handleAddRequest = () => {
    const request = prompt('Entrez une demande spéciale:');
    if (request) {
      onChange([...requests, request]);
    }
  };

  const handleRemoveRequest = (index: number) => {
    onChange(requests.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1">
      <label className="block text-sm text-gray-700 mb-1">Demandes spéciales</label>
      <div className="flex flex-wrap gap-2">
        {requests.map((request, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
          >
            {request}
            <button
              onClick={() => handleRemoveRequest(index)}
              className="hover:text-blue-900"
            >
              ×
            </button>
          </span>
        ))}
        <button
          onClick={handleAddRequest}
          className="px-2 py-1 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50"
        >
          + Ajouter
        </button>
      </div>
    </div>
  );
};

export default SpecialRequests;