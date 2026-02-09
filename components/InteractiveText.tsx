import React from 'react';
import { UserSettings } from '../types';

interface InteractiveTextProps {
  text: string;
  settings: UserSettings;
  onWordClick: (word: string, rect: DOMRect) => void;
  onWordDoubleClick: (word: string) => void;
  className?: string;
}

const InteractiveText: React.FC<InteractiveTextProps> = ({ 
  text, 
  settings, 
  onWordClick, 
  onWordDoubleClick,
  className = "" 
}) => {
  // Tokenize text into words and punctuation, preserving whitespace
  const tokens = text.split(/(\s+|[.,!?;:"'()])/).filter(t => t.length > 0);

  // Default highlight style for known words (Orange theme)
  const highlightClass = 'bg-orange-100 text-orange-900 border-b border-orange-200';

  return (
    <div className={className}>
      {tokens.map((token, index) => {
        // Simple check if it's a word (contains letters)
        const isWord = /[a-zA-Z]/.test(token);
        
        // Check if word has been looked up (case insensitive)
        const cleanWord = token.replace(/[^a-zA-Z]/g, '').toLowerCase();
        const isKnown = isWord && settings.lookupHistory.some(w => w.toLowerCase() === cleanWord);

        if (!isWord) {
          return <span key={index}>{token}</span>;
        }

        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onWordClick(cleanWord, e.currentTarget.getBoundingClientRect());
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onWordDoubleClick(cleanWord);
            }}
            className={`cursor-pointer rounded-sm transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600
              ${isKnown ? `font-semibold ${highlightClass}` : ''}
            `}
          >
            {token}
          </span>
        );
      })}
    </div>
  );
};

export default InteractiveText;
