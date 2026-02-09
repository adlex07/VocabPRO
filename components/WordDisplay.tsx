import React from 'react';
import { WordData, UserSettings } from '../types';
import { BookOpenIcon, CheckIcon } from './Icons';
import DeepLearning from './DeepLearning';
import ElaborationSection from './ElaborationSection';
import ArabicAssociations from './ArabicAssociations';
import InteractiveText from './InteractiveText';
import ReviewSchedule from './ReviewSchedule';
import VisualLearning from './VisualLearning';

interface WordDisplayProps {
  data: Partial<WordData>;
  settings: UserSettings;
  loadingStage: number; // 0=idle, 1=core, 2=context, 3=deep, 4=done
  onWordClick: (word: string, rect: DOMRect) => void;
  onWordDoubleClick: (word: string) => void;
  onRelatedWordClick?: (word: string) => void;
}

const SkeletonLine = ({ className }: { className?: string }) => (
  <div className={`bg-slate-200 animate-pulse rounded ${className}`}></div>
);

const SectionLoader = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 text-slate-400 text-sm py-4 animate-pulse">
    <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-500 rounded-full animate-spin"></div>
    <span>{text}</span>
  </div>
);

const WordDisplay: React.FC<WordDisplayProps> = ({ 
  data, 
  settings, 
  loadingStage,
  onWordClick, 
  onWordDoubleClick,
  onRelatedWordClick
}) => {
  const mastery = data.mastery || 0;
  
  const interact = (text: string, className?: string) => (
    <InteractiveText
      text={text}
      settings={settings}
      onWordClick={onWordClick}
      onWordDoubleClick={onWordDoubleClick}
      className={className}
    />
  );

  // If we don't even have core data yet (but we have the word title from search input ideally, 
  // passed via props or we just use loading state)
  // In App.tsx we set data.word immediately.
  
  return (
    <div className="animate-fade-in-up">
      {/* Primary Definition Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 relative transition-all duration-300">
        {/* Mastery Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
           <div 
             className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000" 
             style={{ width: `${mastery}%` }}
           ></div>
        </div>

        {/* Header */}
        <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-baseline gap-4 justify-between">
          <div className="flex flex-col md:flex-row md:items-baseline gap-4 w-full">
             <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
               {data.word || <SkeletonLine className="w-48 h-10" />}
             </h1>
             
             {loadingStage >= 2 || data.pronunciation ? (
               <div className="flex items-center gap-3 text-slate-500 animate-fade-in">
                 <span className="font-mono text-lg bg-white px-2 py-1 rounded border border-slate-200">{data.pronunciation}</span>
                 <span className="italic font-medium text-indigo-600">{data.partOfSpeech}</span>
               </div>
             ) : (
               <div className="flex gap-3 w-full max-w-xs">
                 <SkeletonLine className="w-20 h-8" />
                 <SkeletonLine className="w-16 h-8" />
               </div>
             )}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest shrink-0">
             MASTERY: {mastery}%
          </div>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Definitions - Stage 1 */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400">Simple Definition</h3>
              {data.simpleDefinition ? (
                <div className="text-lg text-slate-800 leading-relaxed font-medium animate-fade-in">
                  {interact(data.simpleDefinition)}
                </div>
              ) : (
                <div className="space-y-2">
                   <SkeletonLine className="w-full h-6" />
                   <SkeletonLine className="w-3/4 h-6" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400">Precise Definition</h3>
               {data.preciseDefinition ? (
                <div className="text-lg text-slate-600 leading-relaxed font-serif animate-fade-in">
                  {interact(data.preciseDefinition)}
                </div>
              ) : (
                <div className="space-y-2">
                   <SkeletonLine className="w-full h-6" />
                   <SkeletonLine className="w-3/4 h-6" />
                </div>
              )}
            </div>
          </div>

          {/* Examples - Stage 2 */}
          {(loadingStage >= 2 && !data.examples) ? (
             <SectionLoader text="Loading context and examples..." />
          ) : data.examples ? (
             <div className="animate-fade-in">
                <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <BookOpenIcon className="w-4 h-4" /> Context & Usage
                  <CheckIcon className="w-3 h-3 text-green-500 ml-auto" />
                </h3>
                <ul className="space-y-3">
                  {data.examples.map((ex, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-indigo-400 font-bold select-none">{idx + 1}.</span>
                      <span>{interact(ex)}</span>
                    </li>
                  ))}
                </ul>
                
                {data.wordFamily && (
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-400 mb-3">Word Family</h3>
                    <div className="flex flex-wrap gap-2">
                      {data.wordFamily.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          ) : null}
        </div>
      </div>

      {/* Stage 3 Content */}
      {(loadingStage >= 3 && !data.deepLearning) ? (
          <div className="bg-white rounded-xl p-8 border border-slate-100 flex flex-col items-center justify-center animate-pulse">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-medium">Building deep memory connections...</p>
          </div>
      ) : data.deepLearning ? (
         <div className="animate-fade-in">
            {/* Visual Learning */}
            {data.word && <VisualLearning data={data as WordData} settings={{ showVisuals: settings.showVisuals ?? false }} />}

            {/* Arabic Associations */}
            {data.word && <ArabicAssociations data={data as WordData} />}

            {/* Deep Learning Modules */}
            {data.word && <DeepLearning data={data as WordData} onRelatedWordClick={onRelatedWordClick} />}
         </div>
      ) : null}

      {/* Spaced Repetition Schedule - moved here so it appears for looked up words too if they have history */}
      {data.word && <ReviewSchedule data={data} />}
      
      {/* Active Elaboration (Always available once core is loaded, theoretically, but let's wait for stage 2) */}
      {data.word && loadingStage >= 3 && (
        <div className="mt-8 animate-fade-in">
          <ElaborationSection word={data.word} />
        </div>
      )}
    </div>
  );
};

export default WordDisplay;