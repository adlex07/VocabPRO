import React, { useState, useEffect } from 'react';
import { WordData, QuizMode } from '../types';
import { BrainIcon, CheckIcon, TargetIcon, LightningIcon, LightbulbIcon } from './Icons';
import { updateWordMastery, updateWordFSRS, updateQuizHistory } from '../services/storageService';
import { calculateFSRS, Rating } from '../services/fsrsService';
import {
  selectQuizMode,
  buildRecognitionOptions,
  buildDefinitionOptions,
  validateContextAnswer,
  getQuizRating,
  recordAttempt,
  DistractorOption,
  QUIZ_MODES
} from '../services/quizEngine';
import { createEmptyQuizPerformance } from '../services/db';

interface QuizSectionProps {
  data: WordData;
}

const QuizSection: React.FC<QuizSectionProps> = ({ data }) => {
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [autoMode, setAutoMode] = useState(true);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [input, setInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [recognitionOptions, setRecognitionOptions] = useState<DistractorOption[]>([]);
  const [definitionOptions, setDefinitionOptions] = useState<{ text: string; isCorrect: boolean }[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const quizHistory = data.quizHistory || createEmptyQuizPerformance();
  const difficulty = quizHistory.currentDifficulty;

  // Auto-select mode on mount and data change
  useEffect(() => {
    if (autoMode) {
      const selectedMode = selectQuizMode(data);
      setMode(selectedMode);
    }
  }, [data, autoMode]);

  // Reset state when mode or data changes
  useEffect(() => {
    resetState();
    if (mode === 'recognition') {
      loadRecognitionOptions();
    }
  }, [data, mode]);

  const resetState = () => {
    setFeedback('idle');
    setInput('');
    setSelectedOption(null);
    setShowHint(false);
  };

  const loadRecognitionOptions = async () => {
    setLoadingOptions(true);
    setOptionsError(null);
    try {
      const options = await buildRecognitionOptions(data, difficulty);
      if (options.length < 2) {
        // Not enough options, fallback to definition-based if available
        const defOptions = buildDefinitionOptions(data, difficulty);
        if (defOptions && defOptions.length > 0) {
          setDefinitionOptions(defOptions);
          setRecognitionOptions([]); // Clear recognition options to trigger definition mode
        } else {
          setOptionsError('Not enough words in library yet for this quiz mode.');
        }
      } else {
        setRecognitionOptions(options);
      }
    } catch (err) {
      console.error('Error loading recognition options:', err);
      // Fallback to definition-based quiz if available
      const defOptions = buildDefinitionOptions(data, difficulty);
      if (defOptions && defOptions.length > 0) {
        setDefinitionOptions(defOptions);
        setRecognitionOptions([]);
      } else {
        setOptionsError('Unable to load quiz. Try a different mode.');
      }
    } finally {
      setLoadingOptions(false);
    }
  };

  const processSRS = async (isCorrect: boolean) => {
    if (!mode) return;

    // Use adaptive rating from quiz engine
    const ratingValue = getQuizRating(mode, isCorrect, difficulty);
    const newFSRS = calculateFSRS(data.fsrs, ratingValue);
    await updateWordFSRS(data.word, newFSRS);

    // Update quiz history with attempt
    const updatedHistory = recordAttempt(quizHistory, mode, isCorrect);
    await updateQuizHistory(data.word, updatedHistory);

    // Also update generic mastery bar
    const masteryDelta = isCorrect ? (mode === 'recall' ? 20 : mode === 'error' ? 15 : 10) : -10;
    await updateWordMastery(data.word, masteryDelta);

    // Auto-advance to next mode on success if in auto mode
    if (isCorrect && autoMode) {
      setTimeout(() => {
        const nextMode = selectQuizMode({ ...data, quizHistory: updatedHistory });
        setMode(nextMode);
      }, 2000);
    }
  };

  const handleSuccess = () => {
    setFeedback('correct');
    processSRS(true);
  };

  const handleFailure = () => {
    setFeedback('incorrect');
    processSRS(false);
  };

  // Safe access to quiz
  const quiz = data.quiz;
  if (!quiz || !mode) return null;

  const getModeInfo = () => QUIZ_MODES.find(m => m.id === mode);

  const renderModeSelector = () => (
    <div className="space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setAutoMode(!autoMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            autoMode 
              ? 'bg-fuchsia-600 text-white' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <LightningIcon className="w-3 h-3" />
          {autoMode ? 'Auto Mode' : 'Manual Mode'}
        </button>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Difficulty:</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(level => (
              <div
                key={level}
                className={`w-2 h-4 rounded-sm ${
                  level <= difficulty ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {!autoMode && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {QUIZ_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${
                mode === m.id 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {autoMode && getModeInfo() && (
        <div className="bg-gradient-to-r from-indigo-50 to-fuchsia-50 border border-indigo-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                {getModeInfo()?.cognitiveLevel}
              </div>
              <div className="text-sm font-bold text-slate-700">{getModeInfo()?.label}</div>
            </div>
            <div className="text-xs text-slate-500 max-w-xs italic">
              {getModeInfo()?.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRecognition = () => {
    if (loadingOptions) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-slate-400 text-sm">Loading quiz options...</div>
        </div>
      );
    }

    if (optionsError) {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <div className="text-amber-800 font-medium mb-2">{optionsError}</div>
          <div className="text-sm text-amber-600">Try adding more words to your library, or switch to Manual Mode and select a different quiz type.</div>
        </div>
      );
    }

    // Fallback to definition-based quiz if we couldn't load recognition options
    if (recognitionOptions.length === 0 && definitionOptions.length > 0) {
      return renderDefinitionBased();
    }

    if (recognitionOptions.length === 0) {
      return <div className="p-4 text-slate-400 text-center">No quiz options available.</div>;
    }
    
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">
            Which word means:
          </p>
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mx-auto max-w-2xl">
            <h3 className="text-2xl font-bold text-indigo-900">{data.simpleDefinition}</h3>
          </div>
          
          {data.deepLearning && (
             <div className="flex justify-center mt-2">
               <button 
                 onClick={() => setShowHint(!showHint)}
                 className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full transition-colors"
               >
                 <LightbulbIcon className="w-3 h-3" />
                 {showHint ? 'Hide Hint' : 'Need a Hint?'}
               </button>
             </div>
          )}
          
          {showHint && data.deepLearning && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 mx-auto max-w-md bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800 text-left shadow-sm">
              <span className="font-bold block mb-1">Mnemonic / Hint:</span>
              {data.deepLearning.mnemonic || data.deepLearning.analogy || "No specific hint available."}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recognitionOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (feedback !== 'idle') return;
                setSelectedOption(idx);
                if (opt.isCorrect) handleSuccess();
                else handleFailure();
              }}
              className={`p-5 text-left rounded-xl border-2 transition-all relative group ${
                selectedOption === idx
                  ? opt.isCorrect 
                    ? 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200' 
                    : 'border-red-500 bg-red-50 text-red-900 shadow-md ring-2 ring-red-200'
                  : 'border-slate-200 hover:border-indigo-400 hover:shadow-lg bg-white text-slate-700 hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold text-2xl ${selectedOption === idx ? '' : 'group-hover:text-indigo-900'}`}>
                  {opt.word}
                </span>
                
                {selectedOption === idx && (
                  <div>
                    {opt.isCorrect ? (
                      <CheckIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">✕</div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedOption === idx && !opt.isCorrect && (
                <div className="text-xs text-red-700 mt-2 font-medium">
                  {opt.definition}
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedOption !== null && recognitionOptions[selectedOption]?.isCorrect && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-sm text-green-800">
              <span className="font-bold">✓ Correct!</span>{' '}
              <span className="italic">{data.word}</span> = {data.simpleDefinition}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRecall = () => (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-center">
        <p className="text-slate-600 italic text-lg mb-2">"{quiz.recallQuestion}"</p>
        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">What word comes to mind?</p>
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && feedback === 'idle') {
              if (input.toLowerCase().trim() === data.word.toLowerCase()) handleSuccess();
              else handleFailure();
            }
          }}
          placeholder="Type the word..."
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
          disabled={feedback === 'correct'}
          autoFocus
        />
        <button 
           onClick={() => {
             if (input.toLowerCase().trim() === data.word.toLowerCase()) handleSuccess();
             else handleFailure();
           }}
           disabled={feedback === 'correct'}
           className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check
        </button>
      </div>
      {feedback === 'incorrect' && (
        <div className="text-center text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
           <div className="font-bold mb-1">Keep trying!</div>
           <div className="text-sm">Hint: It starts with "{data.word[0]}"... ({data.word.length} letters)</div>
        </div>
      )}
      {feedback === 'correct' && (
        <div className="text-center text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg">
           <div className="font-bold mb-1">✓ Excellent recall!</div>
           <div className="text-sm">You produced "{data.word}" from memory</div>
        </div>
      )}
    </div>
  );
  const renderDefinitionBased = () => {
    if (!data.quiz?.multipleChoiceOptions) {
      return <div className="p-4 text-slate-400 text-center">No quiz data available yet.</div>;
    }

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500 font-semibold">Select the Best Definition</p>
          <h3 className="text-3xl font-extrabold text-slate-900">{data.word}</h3>
        </div>

        <div className="grid gap-3">
          {data.quiz.multipleChoiceOptions.map((opt, idx) => {
            const cleanText = opt.text.replace(/^["']|["',]+$/g, '').trim();
            
            return (
              <button
                key={idx}
                onClick={() => {
                  if (feedback !== 'idle') return;
                  setSelectedOption(idx);
                  if (opt.isCorrect) handleSuccess();
                  else handleFailure();
                }}
                className={`p-5 text-left rounded-xl border-2 transition-all relative group ${
                  selectedOption === idx
                    ? opt.isCorrect 
                      ? 'border-green-500 bg-green-50 text-green-900 shadow-md ring-2 ring-green-200' 
                      : 'border-red-500 bg-red-50 text-red-900 shadow-md ring-2 ring-red-200'
                    : 'border-slate-200 hover:border-indigo-400 hover:shadow-lg bg-white text-slate-700 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-start gap-3">
                   <div className={`mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-mono text-xs ${
                      selectedOption === idx 
                        ? opt.isCorrect ? 'border-green-500 bg-green-200 text-green-800' : 'border-red-500 bg-red-200 text-red-800'
                        : 'border-slate-300 text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-500'
                   }`}>
                      {String.fromCharCode(65 + idx)}
                   </div>
                   <span className={`font-medium text-lg leading-relaxed ${
                     selectedOption === idx ? '' : 'group-hover:text-indigo-900'
                   }`}>
                      {cleanText}
                   </span>
                </div>
                
                {selectedOption === idx && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {opt.isCorrect ? (
                      <CheckIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">✕</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  const renderContext = () => (
    <div className="space-y-4">
       <p className="text-lg text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
         {quiz.fillInBlankQuestion}
       </p>
       <div className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && feedback === 'idle') {
              if (validateContextAnswer(input, quiz.fillInBlankAnswer)) handleSuccess();
              else handleFailure();
            }
          }}
          placeholder="Type the word..."
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
          disabled={feedback === 'correct'}
        />
        <button 
           onClick={() => {
             if (validateContextAnswer(input, quiz.fillInBlankAnswer)) handleSuccess();
             else handleFailure();
           }}
           disabled={feedback === 'correct'}
           className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check
        </button>
      </div>
      {feedback === 'incorrect' && (
        <div className="text-center text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
           <div className="font-bold mb-1">Not quite!</div>
           <div className="text-sm">Hint: It starts with "{quiz.fillInBlankAnswer[0]}"...</div>
        </div>
      )}
      {feedback === 'correct' && (
        <div className="text-center text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg font-bold">
           ✓ Perfect! The answer was: {quiz.fillInBlankAnswer}
        </div>
      )}
    </div>
  );

  const renderErrorSpotting = () => {
    if (!quiz.errorSpotting) return <div className="p-4 text-slate-400">Not available for this word yet.</div>;

    return (
      <div className="space-y-4">
        <p className="text-sm font-bold text-slate-500 uppercase">Select the sentence that uses the word INCORRECTLY:</p>
        <div className="grid gap-3">
          {quiz.errorSpotting.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (feedback !== 'idle') return;
                setSelectedOption(idx);
                if (!item.isCorrect) handleSuccess(); // Success if they find the WRONG one
                else handleFailure();
              }}
              className={`p-4 text-left rounded-xl border-2 transition-all ${
                selectedOption === idx
                  ? !item.isCorrect 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-red-500 bg-red-50'
                  : 'border-slate-100 hover:border-indigo-200 bg-white'
              }`}
            >
              <div className="text-slate-800">{item.sentence}</div>
              {selectedOption === idx && (
                 <div className={`text-sm mt-2 font-medium ${!item.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {item.explanation}
                 </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
           <BrainIcon className="w-6 h-6 text-fuchsia-400" />
           <h2 className="text-xl font-bold">Adaptive Quiz</h2>
        </div>
        <div className="flex items-center gap-3">
          {quizHistory.consecutiveCorrect > 0 && (
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full font-bold">
              🔥 {quizHistory.consecutiveCorrect} streak
            </span>
          )}
          {feedback === 'correct' && (
            <span className="text-green-400 font-bold animate-pulse">Memory Strengthened ✓</span>
          )}
        </div>
      </div>

      <div className="p-6">
        {renderModeSelector()}
        
        <div className="min-h-[250px] flex flex-col justify-center">
          {mode === 'recognition' && renderRecognition()}
          {mode === 'recall' && renderRecall()}
          {mode === 'context' && renderContext()}
          {mode === 'error' && renderErrorSpotting()}
        </div>

        {feedback === 'correct' && (
           <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-800 font-bold">Spaced repetition updated</div>
                  <div className="text-xs text-green-600 mt-1">
                    Next review: {data.fsrs ? new Date(data.fsrs.due).toLocaleDateString() : 'Soon'}
                  </div>
                </div>
                {autoMode && (
                  <div className="text-xs text-green-700 italic">
                    Next challenge incoming...
                  </div>
                )}
              </div>
           </div>
        )}

        {feedback === 'incorrect' && (
           <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-orange-800 text-sm">
                <span className="font-bold">Don't worry!</span> Mistakes strengthen learning. 
                {quizHistory.consecutiveIncorrect >= 2 && (
                  <span> We'll adjust the difficulty to help you succeed.</span>
                )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default QuizSection;