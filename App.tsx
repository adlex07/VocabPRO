import React, { useState, useEffect, useRef } from 'react';
import { WordData, UserSettings } from './types';
import { 
  fetchWordStage1, 
  fetchWordStage2, 
  fetchWordStage3, 
  getQuickDefinition,
  APIError,
  TimeoutError,
  NetworkError,
  ValidationError
} from './services/geminiService';
import { saveWordToHistory } from './services/storageService';
import { migrateFromLocalStorage } from './services/db';
import Dashboard from './components/dashboard/Dashboard';
import WordDisplay from './components/WordDisplay';
import ReviewSchedule from './components/ReviewSchedule';
import StudyTab from './components/StudyTab';
import ContextualImageSearch from './components/ContextualImageSearch';
import QuickDefinition from './components/QuickDefinition';
import ConnectionStatus from './components/ConnectionStatus';
import { SearchIcon, GraduationCapIcon, SettingsIcon, BookOpenIcon, XIcon, LayoutGridIcon } from './components/Icons';

type Tab = 'search' | 'study' | 'dashboard';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  
  // Changed wordData to Partial to support progressive stages
  const [wordData, setWordData] = useState<Partial<WordData> | null>(null);
  
  // Loading Stage: 0=idle, 1=core, 2=context, 3=deep, 4=complete
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<UserSettings>({
    showMnemonics: true,
    autoAudio: false,
    lookupHistory: [],
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize DB
  useEffect(() => {
    migrateFromLocalStorage();
  }, []);

  // Quick Definition State
  const [quickDef, setQuickDef] = useState<{
    word: string;
    definition: string | null;
    position: { top: number; left: number };
    loading: boolean;
  } | null>(null);

  // Keyboard Shortcuts for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
        setQuickDef(null);
        setShowSettings(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (isSearchModalOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  // Close Quick Def on scroll or click elsewhere
  useEffect(() => {
    const handleClickOutside = () => setQuickDef(null);
    const handleScroll = () => setQuickDef(null);

    if (quickDef) {
       document.addEventListener('click', handleClickOutside);
       document.addEventListener('scroll', handleScroll, true);
    }
    return () => {
       document.removeEventListener('click', handleClickOutside);
       document.removeEventListener('scroll', handleScroll, true);
    };
  }, [quickDef]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const targetWord = overrideQuery || query;
    if (!targetWord.trim()) return;

    setError(null);
    setWordData({ word: targetWord, mastery: 0 }); // Instant feedback
    setLoadingStage(1);
    setActiveTab('search'); 
    setQuery(targetWord);
    setQuickDef(null);
    setIsSearchModalOpen(false); // Close modal if open

    let stage1Data: Partial<WordData> | null = null;
    let stage2Data: Partial<WordData> | null = null;

    try {
      // Stage 1: Core Essentials
      stage1Data = await fetchWordStage1(targetWord);
      setWordData(prev => ({ ...prev, ...stage1Data }));
      setLoadingStage(2);

      // Add to lookup history for highlighting
      setSettings(prev => ({
        ...prev,
        lookupHistory: [...new Set([...prev.lookupHistory, targetWord])]
      }));

      // Stage 2: Context
      stage2Data = await fetchWordStage2(targetWord);
      setWordData(prev => ({ ...prev, ...stage2Data }));
      setLoadingStage(3);

      // Stage 3: Deep Learning
      const stage3 = await fetchWordStage3(targetWord);
      
      const completeData = {
        word: targetWord,
        mastery: 0,
        ...stage1Data,
        ...stage2Data,
        ...stage3
      } as WordData;

      setWordData(completeData);
      saveWordToHistory(completeData).catch(console.error);

      setLoadingStage(4);

    } catch (err) {
      console.error('API Error:', err);
      
      // Determine error message based on error type and stage
      let msg = "An error occurred while loading the word.";
      let shouldSavePartial = false;

      if (err instanceof TimeoutError) {
        msg = "The request timed out. Please check your internet connection and try again.";
      } else if (err instanceof NetworkError) {
        msg = "Network error. Please check your internet connection and try again.";
      } else if (err instanceof ValidationError) {
        msg = "Received an invalid response. Please try again.";
      } else if (err instanceof APIError) {
        if (err.code === 'HTTP_429') {
          msg = "Rate limit exceeded. Please wait a moment and try again.";
        } else if (err.code && /^HTTP_5\d+$/.test(err.code)) {
          msg = "The API service is temporarily unavailable. Please try again later.";
        } else {
          msg = err.message || "An API error occurred. Please try again.";
        }
      } else {
        // Generic error
        msg = "I couldn't find that word. Please check the spelling and try again.";
      }

      // If we successfully got stage 1 or stage 2 data, save it
      if (loadingStage >= 2 && stage1Data) {
        shouldSavePartial = true;
        msg += " Some basic information was loaded successfully.";
        
        const partialData = {
          word: targetWord,
          mastery: 0,
          ...stage1Data,
          ...(stage2Data || {})
        } as WordData;
        
        setWordData(partialData);
        saveWordToHistory(partialData).catch(console.error);
        setLoadingStage(4); // Mark as complete to stop loading spinner
      } else {
        // Complete failure
        setError(msg);
        setWordData(null);
        setLoadingStage(0);
      }

      // Show error message if partial data wasn't saved
      if (!shouldSavePartial) {
        setError(msg);
      }
    }
  };

  const handleWordClick = async (word: string, rect: DOMRect) => {
     setQuickDef({
       word,
       definition: null,
       position: { top: rect.bottom + window.scrollY, left: rect.left + window.scrollX },
       loading: true
     });

     try {
       const res = await getQuickDefinition(word);
       setQuickDef(prev => prev && prev.word === word ? { ...prev, definition: res.definition, loading: false } : prev);
     } catch (e) {
       console.error('Quick definition error:', e);
       // Show error state instead of just closing
       setQuickDef(prev => {
         if (prev && prev.word === word) {
           return {
             ...prev,
             definition: "Unable to load definition. Please try again.",
             loading: false
           };
         }
         return prev;
       });
       
       // Auto-close after showing error message
       setTimeout(() => setQuickDef(null), 3000);
     }
  };

  const handleWordDoubleClick = (word: string) => {
    handleSearch(undefined, word);
  };

  const handleViewSavedWord = (savedWord: WordData) => {
    // View saved word without API call
    setWordData(savedWord);
    setLoadingStage(4); // Mark as fully loaded since it's from database
    setActiveTab('search');
    setQuery(savedWord.word);
    setError(null);
    setQuickDef(null);
  };

  const toggleSetting = (key: keyof UserSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const triggerSearchModal = () => {
    setQuery('');
    setIsSearchModalOpen(true);
  };

  return (
    <div className="min-h-screen text-slate-100 pb-20 selection:bg-orange-500 selection:text-white">
      {/* Visual Overlays */}
      <ContextualImageSearch />
      
      {/* Connection Status Monitor */}
      <ConnectionStatus 
        isLoading={loadingStage > 0 && loadingStage < 4}
        error={error}
        stage={loadingStage}
      />
      
      {quickDef && (
        <QuickDefinition 
          word={quickDef.word}
          definition={quickDef.definition}
          loading={quickDef.loading}
          position={quickDef.position}
          onClose={() => setQuickDef(null)}
          onFullSearch={() => handleSearch(undefined, quickDef.word)}
        />
      )}

      {/* Global Search Modal Overlay */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsSearchModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-2xl bg-[#0F0F13] border border-white/10 rounded-2xl shadow-2xl shadow-orange-500/20 overflow-hidden animate-fade-in-up ring-1 ring-white/5">
             <div className="p-4 border-b border-white/5 flex items-center gap-4">
                <SearchIcon className="w-6 h-6 text-orange-500 shrink-0" />
                <form 
                  className="flex-1 flex items-center gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim()) handleSearch();
                  }}
                >
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a word..."
                    className="w-full text-xl text-white placeholder:text-slate-500 bg-transparent outline-none font-medium h-12"
                  />
                  {query.trim() && (
                    <button
                      type="submit"
                      className="hidden md:block px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-orange-900/20"
                    >
                      Search
                    </button>
                  )}
                </form>
                <div className="w-px h-8 bg-white/10 mx-1 hidden md:block"></div>
                <button 
                  onClick={() => setIsSearchModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
             </div>
             <div className="bg-[#0A0A0C] p-3 text-xs text-slate-500 flex justify-between px-6 border-t border-white/5">
                <div className="flex gap-4">
                    <span>Press <kbd className="font-sans bg-white/10 px-1.5 py-0.5 rounded text-slate-300 mx-1 border border-white/5">Enter</kbd> to search</span>
                </div>
                <span className="hidden md:inline">Press <kbd className="font-sans bg-white/10 px-1.5 py-0.5 rounded text-slate-300 mx-1 border border-white/5">Esc</kbd> to close</span>
             </div>
          </div>
        </div>
      )}

      {/* Header - Updated for Dark Theme */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-[#050202]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('search')}>
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-lg shadow-lg shadow-orange-500/20">
               <GraduationCapIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white hidden md:block">DeepVocab</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop Nav */}
            <nav className="hidden md:flex gap-1 md:gap-2">
              <button 
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'search' 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Search
              </button>
              <button 
                onClick={() => setActiveTab('study')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'study' 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Library
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'dashboard' 
                    ? 'bg-white/10 text-white shadow-inner' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </button>
            </nav>

            {/* Quick Search Trigger (Visible when word is loaded) */}
            {wordData && (
              <button
                onClick={triggerSearchModal}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-all text-sm group"
              >
                <SearchIcon className="w-4 h-4 group-hover:text-white" />
                <span className="hidden md:inline">Quick Search</span>
                <span className="hidden md:inline text-xs bg-white/10 px-1.5 py-0.5 rounded ml-2 border border-white/5">⌘K</span>
              </button>
            )}
            
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              
              {showSettings && (
                <div className="absolute right-0 top-12 w-64 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-5 z-50 animate-fade-in">
                  <h3 className="font-bold text-white mb-4 border-b border-slate-700 pb-2">Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Mnemonics</span>
                        <input 
                          type="checkbox" 
                          checked={settings.showMnemonics} 
                          onChange={() => toggleSetting('showMnemonics')}
                          className="accent-orange-500" 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#050202]/95 border-t border-white/10 backdrop-blur-lg z-50 flex justify-around p-3">
          <button 
            onClick={() => {
              if (activeTab === 'search') {
                triggerSearchModal();
              } else {
                setActiveTab('search');
              }
            }}
            className={`flex flex-col items-center transition-colors ${activeTab === 'search' ? 'text-orange-500' : 'text-slate-500'}`}
          >
            <SearchIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Search</span>
          </button>
          <button 
            onClick={() => setActiveTab('study')}
            className={`flex flex-col items-center transition-colors ${activeTab === 'study' ? 'text-orange-500' : 'text-slate-500'}`}
          >
            <BookOpenIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Library</span>
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center transition-colors ${activeTab === 'dashboard' ? 'text-orange-500' : 'text-slate-500'}`}
          >
            <LayoutGridIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Dash</span>
          </button>
      </div>

      <main className="max-w-3xl mx-auto px-4 pt-12 relative z-10">
        {activeTab === 'search' ? (
          <>
            <div className={`text-center transition-all duration-500 ${wordData ? 'mb-12' : 'mb-32 mt-20'}`}>
              {!wordData && loadingStage === 0 && (
                <div className="mb-8 space-y-4">
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-xl">
                    Master words, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">don't just memorize.</span>
                  </h1>
                  <p className="text-lg text-slate-300 max-w-xl mx-auto font-light">
                    Your personal vocabulary tutor powered by learning science. 
                    Search to add words to your Study Library.
                  </p>
                </div>
              )}

              {/* Only show the large hero search if NOT reading a word. If reading, use the header/modal search. */}
              {!wordData && (
                <form onSubmit={(e) => handleSearch(e)} className="relative max-w-xl mx-auto group">
                  <div className={`absolute inset-0 bg-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${loadingStage > 0 ? 'animate-pulse' : ''}`}></div>
                  <div className="relative flex items-center bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 overflow-hidden p-2">
                    <SearchIcon className="ml-4 w-6 h-6 text-slate-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="What word do you want to master?"
                      className="w-full px-4 py-3 text-lg outline-none placeholder:text-slate-400 text-slate-900 bg-transparent"
                      autoFocus={!wordData}
                    />
                    <button 
                      type="submit" 
                      disabled={loadingStage > 0 || !query}
                      className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loadingStage > 0 ? (
                        loadingStage === 1 ? 'Analyzing...' : 'Building...'
                      ) : 'Learn'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Stage 1 Loading Skeleton if wordData is null but loadingStage > 0 */}
            {loadingStage > 0 && !wordData && (
              <div className="max-w-2xl mx-auto space-y-6 animate-pulse">
                <div className="h-48 bg-white/10 rounded-2xl w-full border border-white/5"></div>
                <div className="h-24 bg-white/10 rounded-2xl w-full border border-white/5"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-200 p-4 rounded-xl border border-red-500/20 text-center mb-8 backdrop-blur-sm">
                {error}
              </div>
            )}

            {wordData && (
              <div className="animate-fade-in-up space-y-8">
                <WordDisplay 
                  data={wordData} 
                  settings={settings} 
                  loadingStage={loadingStage}
                  onWordClick={handleWordClick}
                  onWordDoubleClick={handleWordDoubleClick}
                />
                
                {loadingStage >= 2 && <ReviewSchedule data={wordData} />}
                
                <div className="text-center pt-12 pb-8">
                    <button 
                      onClick={triggerSearchModal}
                      className="text-slate-400 hover:text-white font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <SearchIcon className="w-4 h-4" /> Search another word
                    </button>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'study' ? (
          <StudyTab />
        ) : (
          <Dashboard onViewWord={handleViewSavedWord} />
        )}
      </main>
    </div>
  );
};

export default App;