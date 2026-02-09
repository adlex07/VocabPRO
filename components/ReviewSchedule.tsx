import React from 'react';
import { ClockIcon } from './Icons';
import { WordData } from '../types';
import { getFSRSStage, getRetrievability, isFSRSDue } from '../services/fsrsService';

interface ReviewScheduleProps {
  data?: Partial<WordData>;
}

const ReviewSchedule: React.FC<ReviewScheduleProps> = ({ data }) => {
  if (!data?.fsrs) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
         <div className="flex items-center gap-2 mb-4 text-slate-800">
            <ClockIcon className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-lg">FSRS Memory Engine</h3>
         </div>
         <p className="text-slate-500 text-sm">
           Take a quiz to start the FSRS memory tracking engine for this word.
         </p>
      </div>
    );
  }

  const fsrs = data.fsrs;
  const currentStage = getFSRSStage(fsrs);
  const retrievability = getRetrievability(fsrs);
  const isDue = isFSRSDue(fsrs);

  const getReviewText = () => {
    const diff = fsrs.due - Date.now();

    if (diff <= 0) return "Due Now";

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return `in ${minutes} min`;
  };

  // Stage progression for progress bar
  const stages = ['Learning', 'Young', 'Familiar', 'Mature', 'Mastered'];
  const stageIndex = (() => {
    if (fsrs.stability <= 0.01) return 0;
    if (fsrs.stability <= 7) return 1;
    if (fsrs.stability <= 30) return 2;
    if (fsrs.stability <= 90) return 3;
    return 4;
  })();

  // Retrievability color
  const rColor = retrievability >= 80 ? 'text-green-600' : retrievability >= 50 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
       <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-slate-800">
             <ClockIcon className="w-5 h-5 text-indigo-500" />
             <h3 className="font-semibold text-lg">Memory Strength</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
             isDue
             ? 'bg-orange-100 text-orange-700 animate-pulse'
             : 'bg-green-100 text-green-700'
          }`}>
             Review {getReviewText()}
          </div>
       </div>

       {/* Stage progress bar */}
       <div className="relative mb-8">
          <div className="absolute top-1/2 left-0 w-full h-2 bg-slate-100 -translate-y-1/2 rounded-full"></div>
          <div
             className="absolute top-1/2 left-0 h-2 bg-indigo-500 -translate-y-1/2 rounded-full transition-all duration-1000"
             style={{ width: `${(stageIndex / 4) * 100}%` }}
          ></div>
          <div className="relative flex justify-between">
             {stages.slice(1).map((stage, idx) => (
                <div key={idx} className={`w-4 h-4 rounded-full border-2 transition-colors ${
                   idx < stageIndex
                     ? 'bg-indigo-500 border-indigo-500'
                     : 'bg-white border-slate-300'
                }`}></div>
             ))}
          </div>
       </div>

       {/* Metrics grid */}
       <div className="grid grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-lg">
             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Interval</div>
             <div className="text-xl font-bold text-slate-700">
               {Math.round(fsrs.scheduledDays)} <span className="text-xs font-normal">days</span>
             </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Reviews</div>
             <div className="text-xl font-bold text-slate-700">{fsrs.reps}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Difficulty</div>
             <div className="text-xl font-bold text-slate-700">{fsrs.difficulty.toFixed(1)}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
             <div className="text-xs text-slate-400 uppercase font-bold mb-1">Stage</div>
             <div className="text-sm font-bold text-indigo-600 mt-1">{currentStage}</div>
          </div>
       </div>

       {/* Stability & Retrievability */}
       <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Memory Stability</span>
            <span className="text-lg font-bold text-indigo-600">
              {fsrs.stability.toFixed(1)} days
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (fsrs.stability / 365) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700">Recall Probability</span>
            <span className={`text-lg font-bold ${rColor}`}>
              {retrievability}%
            </span>
          </div>
          {fsrs.lapses > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              Lapses: {fsrs.lapses}
            </div>
          )}
       </div>
    </div>
  );
};

export default ReviewSchedule;
