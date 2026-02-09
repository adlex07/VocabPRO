import React, { useState, useEffect } from 'react';
import { ImageIcon, YoutubeIcon } from './Icons';

const ContextualImageSearch: React.FC = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      
      // Basic checks
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setPosition(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length > 40) { // Limit length to avoid showing for large block selections
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if visible
      if (rect.width === 0 && rect.height === 0) return;

      setSelectedText(text);
      
      // Calculate position (centered above selection)
      // We use fixed positioning to avoid dealing with scroll offsets recursively
      setPosition({
        top: rect.top - 56, 
        left: rect.left + (rect.width / 2)
      });
    };

    const hideTooltip = (e: MouseEvent) => {
        // If clicking inside the tooltip, don't hide
        const target = e.target as HTMLElement;
        if (target.closest('#image-lookup-tooltip')) return;
        
        // Hide on any other click
        setPosition(null);
    };

    // Listen for mouseup to detect end of selection
    document.addEventListener('mouseup', handleSelection);
    // Listen for keyup (shift+arrow selection)
    document.addEventListener('keyup', handleSelection);
    // Hide when clicking elsewhere
    document.addEventListener('mousedown', hideTooltip);
    // Hide on scroll to prevent detached floating
    document.addEventListener('scroll', () => setPosition(null), true);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', hideTooltip);
      document.removeEventListener('scroll', () => setPosition(null), true);
    };
  }, []);

  const handleImageSearch = () => {
    if (!selectedText) return;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(selectedText)}`;
    window.open(url, '_blank');
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleYoutubeSearch = () => {
    if (!selectedText) return;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(selectedText)}`;
    window.open(url, '_blank');
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!position) return null;

  return (
    <div 
      id="image-lookup-tooltip"
      className="fixed z-50 animate-fade-in"
      style={{ top: position.top, left: position.left, transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 text-white p-1 rounded-lg shadow-2xl">
        <button
          onClick={handleImageSearch}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-700 transition-all text-sm font-semibold whitespace-nowrap"
          title="Search Images"
        >
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span>Images</span>
        </button>
        
        <div className="w-px h-5 bg-slate-700 mx-1"></div>
        
        <button
          onClick={handleYoutubeSearch}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-700 transition-all text-sm font-semibold whitespace-nowrap"
          title="Search YouTube"
        >
          <YoutubeIcon className="w-4 h-4 text-red-500" />
          <span>Video</span>
        </button>
      </div>
      
      {/* Triangle pointer */}
      <div className="absolute left-1/2 bottom-[-6px] -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-slate-700 rotate-45 -z-10 rounded-sm"></div>
    </div>
  );
};

export default ContextualImageSearch;
