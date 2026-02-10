import React, { useState, useEffect } from 'react';
import { WordData } from '../types';
import { getWordHistory } from '../services/storageService';
import QuizSection from './QuizSection';
import ReviewSchedule from './ReviewSchedule';
import { BookOpenIcon, SearchIcon, ChevronDownIcon, ClockIcon, CheckIcon } from './Icons';
import { isFSRSDue, getFSRSStage, getRetrievability } from '../services/fsrsService';

interface WordCardProps {
  wordData: WordData;
  isDueItem?: boolean;
  onClick: (data: WordData) => void;
}

const WordCard: React.FC<WordCardProps> = ({ wordData, isDueItem, onClick }) => (
  <button
    onClick={() => onClick(wordData)}
    className={`group p-6 rounded-2xl border transition-all text-left flex flex-col items-start relative overflow-hidden w-full ${
      isDueItem 
        ? 'bg-gradient-to-br from-orange-500/15 to-red-500/10 border-orange-500/50 hover:border-orange-500/70 hover:shadow-xl hover:shadow-orange-500/20' 
        : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-xl shadow-sm hover:scale-[1.02]'
    }`}
  >
    <div className="flex justify-between w-full mb-2">
      <h3 className={`text-xl font-bold transition-colors heading-font ${
        isDueItem ? 'text-white' : 'text-slate-800 group-hover:text-orange-600'
      }`}>
        {wordData.word}
      </h3>
      <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${
         isDueItem ? 'bg-black/30 text-orange-200 border border-orange-500/30' : 'bg-slate-100 text-slate-600 border border-slate-200'
      }`}>
        {wordData.partOfSpeech}
      </span>
    </div>
    <p className={`text-sm line-clamp-2 mb-4 flex-grow leading-relaxed ${
      isDueItem ? 'text-orange-100' : 'text-slate-600'
    }`}>
      {wordData.simpleDefinition}
    </p>
    
    {isDueItem ? (
       <div className="w-full pt-4 border-t border-white/10 flex items-center gap-2 text-sm font-bold text-orange-400">
          <ClockIcon className="w-4 h-4" /> Review Now
       </div>
    ) : (
       <div className="w-full pt-4 border-t border-slate-100 flex justify-between items-center text-sm font-semibold text-orange-600 group-hover:text-orange-700">
         <span>{wordData.fsrs ? getFSRSStage(wordData.fsrs) : 'New'}</span>
         <span>
           {wordData.fsrs?.scheduledDays
             ? `${Math.round(wordData.fsrs.scheduledDays)}d interval`
             : ''}
         </span>
       </div>
    )}
  </button>
);

const StudyTab: React.FC = () => {
  const [history, setHistory] = useState<WordData[]>([]);
  const [selectedWord, setSelectedWord] = useState<WordData | null>(null);

  useEffect(() => {
    // Refresh history every time tab is mounted
    getWordHistory().then(setHistory);
  }, [selectedWord]); // Refresh when coming back from a word view too

  const dueWords = history.filter(w => isFSRSDue(w.fsrs));
  const upcomingWords = history.filter(w => !isFSRSDue(w.fsrs));

  if (selectedWord) {
    return (
      <div className="animate-fade-in-up">
        <button 
          onClick={() => setSelectedWord(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-medium transition-colors"
        >
          <ChevronDownIcon className="w-4 h-4 rotate-90" />
          Back to Library
        </button>
        
        <div className="mb-6 flex justify-between items-end">
           <div>
             <h2 className="text-3xl font-bold text-white drop-shadow-md">{selectedWord.word}</h2>
             <p className="text-slate-300">{selectedWord.simpleDefinition}</p>
           </div>
           <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Status</div>
              <div className={`text-sm font-bold ${isFSRSDue(selectedWord.fsrs) ? 'text-orange-500' : 'text-green-500'}`}>
                 {isFSRSDue(selectedWord.fsrs) ? 'Due Now' : 'Upcoming'}
              </div>
              {selectedWord.fsrs && (
                <div className="text-xs text-slate-500 mt-1">
                  Recall: {getRetrievability(selectedWord.fsrs)}%
                </div>
              )}
           </div>
        </div>

        <QuizSection data={selectedWord} />
        <ReviewSchedule data={selectedWord} />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20 px-4 animate-fade-in">
        <div className="bg-white/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10 shadow-xl">
          <BookOpenIcon className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Your library is empty</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Words you look up will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white drop-shadow-sm">Memory Library</h2>
        <span className="bg-white/10 border border-white/20 text-slate-200 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-md">
          {history.length} Words
        </span>
      </div>

      {dueWords.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
             <h3 className="text-lg font-bold text-orange-100 uppercase tracking-wider">Due for Review ({dueWords.length})</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
             {dueWords.map((w, idx) => <WordCard key={idx} wordData={w} isDueItem={true} onClick={setSelectedWord} />)}
          </div>
        </div>
      )}

      {upcomingWords.length > 0 && (
        <div>
           <h3 className="text-lg font-bold text-slate-400 uppercase tracking-wider mb-4">Upcoming</h3>
           <div className="grid gap-4 md:grid-cols-2">
              {upcomingWords.map((w, idx) => <WordCard key={idx} wordData={w} onClick={setSelectedWord} />)}
           </div>
        </div>
      )}
    </div>
  );
};

export default StudyTab;
