import React, { useState } from 'react';
import { Button } from './ui/button';

interface DebugPanelProps {
  onTestSubscription: () => void;
  onTestConnection: () => void;
  onClearLogs: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  onTestSubscription,
  onTestConnection,
  onClearLogs
}) => {
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm"
        >
          🐛 Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-lg border p-4 w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Debug Panel</h3>
        <Button
          onClick={() => setIsVisible(false)}
          variant="ghost"
          size="sm"
        >
          ✕
        </Button>
      </div>
      
      <div className="space-y-2">
        <Button
          onClick={onTestConnection}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Test DB Connection
        </Button>
        
        <Button
          onClick={onTestSubscription}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Test Subscription Add
        </Button>
        
        <Button
          onClick={onClearLogs}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Clear Console
        </Button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>Check browser console for logs</p>
      </div>
    </div>
  );
};

export default DebugPanel;