import React, { useState } from 'react';
import { WordData } from '../types';
import { EyeIcon, PaletteIcon, ChevronDownIcon } from './Icons';

interface VisualLearningProps {
  data: WordData;
  settings: { showVisuals: boolean };
}

const VisualLearning: React.FC<VisualLearningProps> = ({ data, settings }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Safe access to deepLearning and visual
  const visual = data.deepLearning?.visual;

  if (!visual || !settings.showVisuals) return null;

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm bg-white mb-6">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-fuchsia-500 bg-opacity-10 hover:bg-opacity-20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-fuchsia-500 bg-opacity-20 text-fuchsia-700">
            <EyeIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 heading-font">Visual Memory & Loci</h3>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="p-5 animate-fade-in border-t border-slate-100 space-y-5">
           
           <div className="bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
              <h4 className="text-xs font-bold text-fuchsia-600 uppercase mb-2 flex items-center gap-2 heading-font">
                 <PaletteIcon className="w-3 h-3" /> Visualization Scene
              </h4>
              <p className="text-lg text-slate-800 font-medium leading-relaxed italic">
                 "{visual.imageDescription}"
              </p>
           </div>

           <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 p-3 rounded-lg">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-1 heading-font">Spatial Cue</h4>
                 <p className="text-slate-700 text-sm">{visual.spatialCue}</p>
              </div>
              <div className="bg-white border border-slate-200 p-3 rounded-lg">
                 <h4 className="text-xs font-bold text-slate-400 uppercase mb-1 heading-font">Color Association</h4>
                 <p className="text-slate-700 text-sm">{visual.colorAssociation}</p>
              </div>
           </div>

           <div className="bg-slate-800 text-slate-200 p-4 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                 <EyeIcon className="w-16 h-16" />
              </div>
              <h4 className="text-xs font-bold text-fuchsia-300 uppercase mb-2 heading-font">Method of Loci Placement</h4>
              <p className="font-medium relative z-10">
                 {visual.lociContext}
              </p>
           </div>

        </div>
      )}
    </div>
  );
};

export default VisualLearning;
