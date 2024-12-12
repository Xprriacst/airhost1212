import React from 'react';
import { Check, Edit2, RefreshCw } from 'lucide-react';

interface ResponseSuggestionProps {
  text: string;
  onAccept: (text: string) => void;
  onEdit: (text: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ResponseSuggestion: React.FC<ResponseSuggestionProps> = ({
  text,
  onAccept,
  onEdit,
  onRefresh,
  isLoading = false,
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 m-4 space-y-3 border border-blue-200 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h4 className="text-sm font-medium text-blue-800">AI Suggestion</h4>
          </div>
          <p className="text-sm text-gray-800 bg-white p-3 rounded-lg border border-blue-200">{text}</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onEdit(text)}
          className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 transition-colors"
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Edit
        </button>
        <button
          onClick={() => onAccept(text)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Check className="w-4 h-4 mr-2" />
          Send
        </button>
      </div>
    </div>
  );
};

export default ResponseSuggestion;