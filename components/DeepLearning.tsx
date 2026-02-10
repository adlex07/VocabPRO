import React, { useState } from 'react';
import { WordData } from '../types';
import { LightbulbIcon, PuzzleIcon, NetworkIcon, ChevronDownIcon } from './Icons';

interface DeepLearningProps {
  data: WordData;
}

const ExpandableSection = ({ 
  title, 
  icon: Icon, 
  colorClass, 
  children,
  defaultOpen = false 
}: { 
  title: string; 
  icon: any; 
  colorClass: string; 
  children?: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border rounded-xl overflow-hidden transition-all duration-300 ${isOpen ? 'shadow-md' : 'shadow-sm'} bg-white mb-4`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${colorClass} bg-opacity-10 hover:bg-opacity-20 transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass} bg-opacity-20 text-current`}>
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 heading-font">{title}</h3>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-5 animate-fade-in border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
};

const DeepLearning: React.FC<DeepLearningProps> = ({ data }) => {
  const { deepLearning } = data;
  
  if (!deepLearning) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 mt-8 ml-1 heading-font">Deep Learning Modules</h2>

      {/* Conceptual Understanding - Blue Theme */}
      <ExpandableSection 
        title="Conceptual Understanding" 
        icon={PuzzleIcon} 
        colorClass="bg-blue-500 text-blue-700"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide heading-font mb-2">Why this word exists</h4>
            <p className="text-slate-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100">
              {deepLearning.conceptOrigin}
            </p>
          </div>
          
          <div>
             <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide heading-font mb-3">Distinctions</h4>
             <div className="grid md:grid-cols-2 gap-4">
                {deepLearning.comparisons?.map((comp, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="font-bold text-slate-800">{data.word}</span>
                       <span className="text-slate-400">vs</span>
                       <span className="font-bold text-slate-800">{comp.word}</span>
                    </div>
                    <p className="text-sm text-slate-600 italic">"{comp.difference}"</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Memory Hooks - Amber/Warm Theme */}
      <ExpandableSection 
        title="Memory & Mental Models" 
        icon={LightbulbIcon} 
        colorClass="bg-amber-500 text-amber-700"
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <h4 className="text-xs font-bold text-amber-600 uppercase heading-font mb-1">Analogy</h4>
               <p className="text-slate-800 font-medium">
                 {deepLearning.analogy}
               </p>
             </div>
             <div className="space-y-2">
               <h4 className="text-xs font-bold text-amber-600 uppercase heading-font mb-1">Mental Image</h4>
               <p className="text-slate-600 italic">
                 {deepLearning.mentalImage}
               </p>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <LightbulbIcon className="w-24 h-24 text-amber-500" />
             </div>
             <div className="relative z-10">
               <h4 className="text-sm font-bold text-amber-800 heading-font mb-2 flex items-center gap-2">
                 STORY HOOK
               </h4>
               <p className="text-slate-800 mb-4 font-serif leading-relaxed text-lg">
                 "{deepLearning.memoryStory}"
               </p>
               
               {deepLearning.mnemonic && (
                 <div className="mt-4 pt-4 border-t border-amber-200">
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded mr-2">MNEMONIC</span>
                    <span className="font-mono text-amber-900">{deepLearning.mnemonic}</span>
                 </div>
               )}
             </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Personal Connection</h4>
             <p className="text-slate-700">
               {deepLearning.associationPrompt}
             </p>
          </div>
        </div>
      </ExpandableSection>

      {/* Word Network - Emerald/Green Theme */}
      <ExpandableSection 
        title="Word Network" 
        icon={NetworkIcon} 
        colorClass="bg-emerald-500 text-emerald-700"
      >
        <div className="space-y-6">
           {/* Etymology */}
           <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase mb-2">Roots & Etymology</h4>
              <div className="flex flex-wrap gap-2">
                 {deepLearning.etymology?.map((part, idx) => (
                    <div key={idx} className="flex flex-col bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
                       <span className="font-bold text-emerald-800">{part.part}</span>
                       <span className="text-xs text-emerald-600">{part.meaning}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Synonyms & Antonyms */}
           <div className="grid md:grid-cols-2 gap-6">
              <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Synonyms (with nuance)</h4>
                 <ul className="space-y-2">
                    {deepLearning.synonyms?.map((syn, idx) => (
                       <li key={idx} className="text-sm">
                          <span className="font-bold text-slate-700">{syn.word}: </span>
                          <span className="text-slate-500">{syn.nuance}</span>
                       </li>
                    ))}
                 </ul>
              </div>
              <div>
                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Antonyms</h4>
                 <div className="flex flex-wrap gap-2">
                    {deepLearning.antonyms?.map((ant, idx) => (
                       <span key={idx} className="px-2 py-1 bg-red-50 text-red-700 rounded text-sm border border-red-100">
                          {ant}
                       </span>
                    ))}
                 </div>
              </div>
           </div>

           {/* Next Steps */}
           <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Related Words to Learn Next</h4>
              <div className="flex gap-3">
                 {deepLearning.relatedWords?.map((word, idx) => (
                    <button key={idx} className="text-emerald-600 font-medium hover:underline hover:text-emerald-700">
                       {word}
                    </button>
                 ))}
              </div>
           </div>
        </div>
      </ExpandableSection>
    </div>
  );
};

export default DeepLearning;
