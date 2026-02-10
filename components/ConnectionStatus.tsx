import React, { useState, useEffect } from 'react';

interface ConnectionStatusProps {
  isLoading: boolean;
  error: string | null;
  stage: number;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isLoading, error, stage }) => {
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    // Listen for retry messages from console
    const originalConsoleLog = console.log;
    console.log = function (...args) {
      const message = args.join(' ');
      if (message.includes('Retrying...')) {
        setRetryMessage(message);
        setTimeout(() => setRetryMessage(null), 3000);
      }
      originalConsoleLog.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  if (!isLoading && !error && !retryMessage) {
    return null;
  }

  const getStageMessage = () => {
    switch (stage) {
      case 1:
        return 'Loading core definition...';
      case 2:
        return 'Loading examples and context...';
      case 3:
        return 'Loading deep learning content...';
      case 4:
        return 'Complete!';
      default:
        return 'Preparing...';
    }
  };

  const getStageProgress = () => {
    switch (stage) {
      case 1:
        return 33;
      case 2:
        return 66;
      case 3:
      case 4:
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 right-6 z-50 max-w-sm">
      {/* Loading indicator */}
      {isLoading && stage > 0 && (
        <div className="bg-slate-900/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">{getStageMessage()}</p>
              {retryMessage && (
                <p className="text-xs text-orange-400 mt-1">{retryMessage}</p>
              )}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${getStageProgress()}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div className="bg-red-900/95 border border-red-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-100 font-medium">Connection Issue</p>
              <p className="text-xs text-red-200/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Retry indicator (when retrying but not showing full error) */}
      {retryMessage && !error && (
        <div className="bg-orange-900/95 border border-orange-500/30 rounded-xl p-4 shadow-2xl backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-orange-400 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-orange-100 font-medium">Reconnecting...</p>
              <p className="text-xs text-orange-200/80 mt-1">{retryMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
