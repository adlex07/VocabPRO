import React, { useState } from 'react';
import { WordData } from '../types';
import { GlobeIcon, ChevronDownIcon } from './Icons';

interface ArabicAssociationsProps {
  data: WordData;
}

const ArabicAssociations: React.FC<ArabicAssociationsProps> = ({ data }) => {
  const [isOpen, setIsOpen] = useState(true);
  const associations = data.deepLearning?.arabicAssociations;

  if (!associations || associations.length === 0) return null;

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-purple-500 bg-opacity-10 hover:bg-opacity-20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500 bg-opacity-20 text-purple-700">
            <GlobeIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800">Arabic Associations</h3>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-5 animate-fade-in border-t border-slate-100">
           <p className="text-sm text-slate-500 mb-3">Relevant Arabic concepts to aid understanding:</p>
           <div className="flex flex-wrap gap-3">
             {associations.map((word, idx) => (
                <span key={idx} className="text-xl font-medium px-4 py-2 bg-purple-50 text-purple-800 rounded-lg border border-purple-100">
                  {word}
                </span>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default ArabicAssociations;
