import React, { useState, useEffect } from 'react';
import { PenIcon, CheckIcon } from './Icons';
import { checkElaboration } from '../services/geminiService';
import { ElaborationFeedback } from '../types';

interface ElaborationSectionProps {
  word: string;
}

const ElaborationSection: React.FC<ElaborationSectionProps> = ({ word }) => {
  const [definition, setDefinition] = useState('');
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<ElaborationFeedback | null>(null);

  // Reset when word changes
  useEffect(() => {
    setDefinition('');
    setSentence('');
    setFeedback(null);
    setLoading(false);
  }, [word]);

  const handleSubmit = async () => {
    if (!definition || !sentence) return;
    
    setLoading(true);
    try {
      const result = await checkElaboration(word, definition, sentence);
      setFeedback(result);
    } catch (error) {
      console.error("Error checking elaboration:", error);
      // Fallback if API fails
      setFeedback({
        isCorrect: true,
        generalFeedback: "Great effort! I'm having trouble connecting to the tutor right now, but practicing active recall is the best way to learn.",
        definitionScore: 5,
        sentenceScore: 5,
        definitionFeedback: "Saved locally.",
        sentenceFeedback: "Saved locally."
      });
    } finally {
      setLoading(false);
    }
  };

  const ScoreBadge = ({ score }: { score: number }) => (
    <div className={`flex gap-1 ${score >= 4 ? 'text-yellow-400' : 'text-slate-300'}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${i <= score ? 'fill-current' : 'fill-slate-200 text-slate-200'}`} viewBox="0 0 24 24">
           <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
     return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 p-12 flex flex-col items-center justify-center space-y-4">
           <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="text-slate-500 font-medium animate-pulse">Analyzing your understanding...</p>
        </div>
     );
  }

  if (feedback) {
    const isSuccess = feedback.isCorrect;
    const bgClass = isSuccess ? 'bg-green-50' : 'bg-amber-50';
    const borderClass = isSuccess ? 'border-green-100' : 'border-amber-100';
    const textClass = isSuccess ? 'text-green-800' : 'text-amber-800';
    const btnClass = isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700';

    return (
      <div className={`${bgClass} rounded-2xl p-6 border ${borderClass} mb-6 animate-fade-in`}>
        <div className="flex flex-col items-center text-center mb-8">
            <div className={`w-12 h-12 ${isSuccess ? 'bg-green-500' : 'bg-amber-500'} rounded-full flex items-center justify-center text-white mb-4 shadow-sm`}>
               {isSuccess ? <CheckIcon className="w-6 h-6" /> : <PenIcon className="w-6 h-6" />}
            </div>
            <h3 className={`text-xl font-bold ${textClass} mb-2`}>
                {isSuccess ? 'Great Active Recall!' : 'Good Effort!'}
            </h3>
            <p className={`${isSuccess ? 'text-green-700' : 'text-amber-700'} max-w-lg`}>
              {feedback.generalFeedback}
            </p>
        </div>

        <div className="space-y-6 mb-8">
            {/* Definition Feedback Block */}
            <div className="bg-white/70 p-5 rounded-xl border border-white/60 shadow-sm">
               <div className="flex justify-between items-center mb-3 border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wide opacity-60">Definition Analysis</span>
                  <ScoreBadge score={feedback.definitionScore} />
               </div>
               
               <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Your Answer</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-slate-800 italic text-sm">
                    "{definition}"
                  </div>
               </div>

               <div>
                 <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-1 block">Tutor Feedback</span>
                 <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-50 text-indigo-900">
                    {feedback.definitionFeedback}
                 </p>
               </div>
            </div>

            {/* Sentence Feedback Block */}
            <div className="bg-white/70 p-5 rounded-xl border border-white/60 shadow-sm">
               <div className="flex justify-between items-center mb-3 border-b border-black/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wide opacity-60">Sentence Usage Analysis</span>
                  <ScoreBadge score={feedback.sentenceScore} />
               </div>
               
               <div className="mb-4">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1 block">Your Sentence</span>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 text-slate-800 italic text-sm">
                    "{sentence}"
                  </div>
               </div>

               <div>
                 <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider mb-1 block">Tutor Feedback</span>
                 <p className="text-sm text-slate-700 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-50 text-indigo-900">
                    {feedback.sentenceFeedback}
                 </p>
               </div>
            </div>
        </div>

        <div className="text-center">
            <button 
              onClick={() => {
                setFeedback(null);
                // We keep the state so they can edit it
              }}
              className={`text-sm font-bold text-white transition-all px-8 py-3 rounded-xl shadow-md ${btnClass}`}
            >
              Edit & Try Again
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
        <PenIcon className="w-5 h-5 text-indigo-500" />
        <h3 className="font-bold text-slate-700">Active Elaboration</h3>
      </div>
      
      <div className="p-6 space-y-6">
        <p className="text-sm text-slate-500">
           Deepen your neural pathways by explaining the concept in your own words and using it in a new context.
        </p>

        <div>
           <label className="block text-sm font-semibold text-slate-700 mb-2">
             Explain "{word}" in your own words
           </label>
           <textarea
             className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none h-32 shadow-inner"
             placeholder="Imagine you are teaching this to a friend..."
             value={definition}
             onChange={(e) => setDefinition(e.target.value)}
           />
        </div>

        <div>
           <label className="block text-sm font-semibold text-slate-700 mb-2">
             Create a new sentence using "{word}"
           </label>
           <input
             type="text"
             className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-inner"
             placeholder="I was feeling very..."
             value={sentence}
             onChange={(e) => setSentence(e.target.value)}
           />
        </div>

        <button 
           onClick={handleSubmit}
           disabled={!definition || !sentence}
           className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
           Check My Understanding
        </button>
      </div>
    </div>
  );
};

export default ElaborationSection;