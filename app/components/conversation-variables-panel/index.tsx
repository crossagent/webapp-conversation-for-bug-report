import React from 'react';
import Loading from '@/app/components/base/loading'; // Common loading component

// Define a more specific type for a variable item
type ConversationVariable = {
  id: string;
  name: string;
  value_type: string;
  value: any;
  description?: string;
  // created_at: number; // As per API response structure, but not used in display yet
  // updated_at: number; // As per API response structure, but not used in display yet
};

type ConversationVariablesPanelProps = {
  variables: ConversationVariable[];
  isLoading: boolean;
};

const ConversationVariablesPanel: React.FC<ConversationVariablesPanelProps> = ({ variables, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
        <Loading type='area' /> {/* Using the common Loading component */}
      </div>
    );
  }

  if (!variables || variables.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg shadow-sm h-full">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Conversation Variables</h3>
        <p>No variables available for this conversation.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm h-full overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Conversation Variables</h3>
      <ul className="space-y-3">
        {variables.map((variable) => (
          <li key={variable.id} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
            <div className="flex justify-between items-start">
              <span className="font-medium text-gray-800 break-all">{variable.name || 'N/A'}</span>
              {variable.value_type && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{variable.value_type}</span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-600 break-all">{String(variable.value)}</div>
            {variable.description && (
              <p className="text-xs text-gray-500 mt-2 italic border-t border-gray-100 pt-2">{variable.description}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationVariablesPanel;
