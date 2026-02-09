// Audio/TTS Service using Web Speech API

export interface AudioSettings {
  speed: number; // 0.5 to 2.0
  voice?: string; // voice name
  autoPlay: boolean;
}

export const getDefaultAudioSettings = (): AudioSettings => ({
  speed: 1.0,
  voice: undefined,
  autoPlay: false,
});

// Get available voices
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (!window.speechSynthesis) {
    return [];
  }
  return window.speechSynthesis.getVoices();
};

// Speak text using Web Speech API
export const speak = (text: string, settings: AudioSettings = getDefaultAudioSettings()): void => {
  if (!window.speechSynthesis) {
    console.warn('Speech synthesis not supported');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = settings.speed;

  // Set voice if specified
  if (settings.voice) {
    const voices = getAvailableVoices();
    const selectedVoice = voices.find(v => v.name === settings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
};

// Stop any ongoing speech
export const stopSpeaking = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

// Check if speech synthesis is supported
export const isSpeechSupported = (): boolean => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};
