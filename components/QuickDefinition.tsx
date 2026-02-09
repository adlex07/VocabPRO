import React from 'react';
import { SearchIcon } from './Icons';

interface QuickDefinitionProps {
  word: string;
  definition: string | null;
  loading: boolean;
  position: { top: number; left: number };
  onClose: () => void;
  onFullSearch: () => void;
}

const QuickDefinition: React.FC<QuickDefinitionProps> = ({ 
  word, 
  definition, 
  loading, 
  position, 
  onClose,
  onFullSearch
}) => {
  
  // Close on click outside is handled by parent or a backdrop, 
  // but we can add a simple X button or just rely on global click listener

  return (
    <div 
      className="fixed z-50 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 animate-fade-in origin-top"
      style={{ 
        top: position.top + 24, // Position below the word
        left: Math.min(window.innerWidth - 270, Math.max(10, position.left - 128)) // Clamp to screen
      }}
    >
      <div className="flex justify-between items-start mb-2">
         <h4 className="font-bold text-white capitalize">{word}</h4>
         <button 
           onClick={onFullSearch}
           className="text-xs flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
         >
           <SearchIcon className="w-3 h-3" />
           Deep Dive
         </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-75"></div>
           <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></div>
        </div>
      ) : (
        <p className="text-sm text-slate-300 leading-snug">
           {definition}
        </p>
      )}

      <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-t border-l border-slate-700 rotate-45"></div>
    </div>
  );
};

export default QuickDefinition;
