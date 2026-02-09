import React, { useState, useEffect, useRef } from 'react';
import { speak, isSpeechSupported } from '../services/audioService';
import { UserSettings } from '../types';

interface SpeakerButtonProps {
  text: string;
  settings: UserSettings;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SpeakerButton: React.FC<SpeakerButtonProps> = ({ text, settings, className = '', size = 'md' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isSpeechSupported()) {
    return null;
  }

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const audioSettings = settings.audioSettings || { speed: 1.0, autoPlay: false };
    
    try {
      speak(text, audioSettings);
      
      // Reset playing state after speech ends
      // Since Web Speech API doesn't provide reliable end event, use timeout based on text length
      const estimatedDuration = (text.length / 15) * 1000 / audioSettings.speed; // rough estimate
      timeoutRef.current = setTimeout(() => {
        setIsPlaying(false);
      }, estimatedDuration);
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  };

  const sizeClasses = {
    sm: 'w-4 h-4 p-0.5',
    md: 'w-5 h-5 p-1',
    lg: 'w-6 h-6 p-1.5'
  };

  return (
    <button
      onClick={handleSpeak}
      className={`inline-flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors ${sizeClasses[size]} ${className}`}
      title="Listen to pronunciation"
      aria-label="Play audio"
    >
      {isPlaying ? (
        <svg className="w-full h-full text-orange-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-full h-full text-slate-600 hover:text-orange-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

export default SpeakerButton;
