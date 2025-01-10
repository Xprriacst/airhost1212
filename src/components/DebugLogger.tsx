import React from 'react';

interface LogEntry {
  message: string;
  timestamp: Date;
  type: 'info' | 'error' | 'warning';
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  addListener(callback: (logs: LogEntry[]) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (logs: LogEntry[]) => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  log(message: string, type: LogEntry['type'] = 'info') {
    const entry: LogEntry = {
      message,
      timestamp: new Date(),
      type
    };
    this.logs.push(entry);
    if (this.logs.length > 100) {
      this.logs.shift(); // Keep only last 100 logs
    }
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback([...this.logs]));
  }

  clear() {
    this.logs = [];
    this.notifyListeners();
  }
}

export const logger = Logger.getInstance();

const DebugLogger: React.FC = () => {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleLogs = (newLogs: LogEntry[]) => {
      setLogs([...newLogs]);
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    };

    logger.addListener(handleLogs);
    return () => logger.removeListener(handleLogs);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden z-50">
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="font-semibold">Debug Logs</h3>
        <div className="space-x-2">
          <button
            onClick={() => logger.clear()}
            className="px-2 py-1 text-sm bg-red-600 rounded hover:bg-red-700"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-2 h-[calc(100%-40px)] overflow-y-auto font-mono text-sm"
      >
        {logs.map((log, index) => (
          <div
            key={index}
            className={`mb-1 ${
              log.type === 'error'
                ? 'text-red-400'
                : log.type === 'warning'
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            <span className="opacity-50 mr-2">
              {log.timestamp.toLocaleTimeString()}
            </span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugLogger;
