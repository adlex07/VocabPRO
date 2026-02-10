import React, { useState } from 'react';
import { UserSettings, LLMProvider } from '../types';
import { XIcon } from './Icons';

interface SettingsProps {
  settings: UserSettings;
  onSettingsChange: (settings: UserSettings) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange, onClose }) => {
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempGeminiKey, setTempGeminiKey] = useState(settings.geminiApiKey || '');
  const [tempCerebrasKey, setTempCerebrasKey] = useState(settings.cerebrasApiKey || '');

  const handleProviderChange = (provider: LLMProvider) => {
    onSettingsChange({ ...settings, llmProvider: provider });
  };

  const handleSaveApiKeys = () => {
    onSettingsChange({
      ...settings,
      geminiApiKey: tempGeminiKey,
      cerebrasApiKey: tempCerebrasKey
    });
    setShowApiKeyInput(false);
  };

  const toggleSetting = (key: keyof UserSettings) => {
    onSettingsChange({ ...settings, [key]: !settings[key] });
  };

  const currentProvider = settings.llmProvider || 'gemini';
  const hasRequiredApiKey = 
    (currentProvider === 'gemini' && (settings.geminiApiKey || process.env.GEMINI_API_KEY)) ||
    (currentProvider === 'cerebras' && settings.cerebrasApiKey);

  return (
    <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl overflow-hidden z-50 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">Settings</h3>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <XIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* LLM Provider Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">LLM Provider</h4>
          
          <div className="space-y-2">
            {/* Gemini Option */}
            <label className="flex items-center p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors border border-slate-700 hover:border-orange-500/50">
              <input
                type="radio"
                name="llmProvider"
                value="gemini"
                checked={currentProvider === 'gemini'}
                onChange={() => handleProviderChange('gemini')}
                className="accent-orange-500 w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Google Gemini</span>
                  {currentProvider === 'gemini' && settings.geminiApiKey && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Configured</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Google's advanced AI model</p>
              </div>
            </label>

            {/* Cerebras Option */}
            <label className="flex items-center p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors border border-slate-700 hover:border-orange-500/50">
              <input
                type="radio"
                name="llmProvider"
                value="cerebras"
                checked={currentProvider === 'cerebras'}
                onChange={() => handleProviderChange('cerebras')}
                className="accent-orange-500 w-4 h-4"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Cerebras Inference</span>
                  {currentProvider === 'cerebras' && settings.cerebrasApiKey && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Configured</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">Fast inference with Llama models</p>
              </div>
            </label>
          </div>

          {/* API Key Configuration */}
          {!showApiKeyInput ? (
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="w-full mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-sm rounded-lg transition-colors border border-slate-700"
            >
              Configure API Keys
            </button>
          ) : (
            <div className="mt-3 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempGeminiKey}
                  onChange={(e) => setTempGeminiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Cerebras API Key
                </label>
                <input
                  type="password"
                  value={tempCerebrasKey}
                  onChange={(e) => setTempCerebrasKey(e.target.value)}
                  placeholder="Enter your Cerebras API key"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKeys}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Save Keys
                </button>
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Warning if no API key */}
          {!hasRequiredApiKey && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ API key required for {currentProvider === 'gemini' ? 'Gemini' : 'Cerebras'}
              </p>
            </div>
          )}
        </div>

        {/* Display Preferences */}
        <div className="space-y-3 pt-4 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Display</h4>
          
          <label className="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors group">
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Show Mnemonics</span>
            <input 
              type="checkbox" 
              checked={settings.showMnemonics} 
              onChange={() => toggleSetting('showMnemonics')}
              className="accent-orange-500 w-4 h-4" 
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors group">
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Auto Audio</span>
            <input 
              type="checkbox" 
              checked={settings.autoAudio} 
              onChange={() => toggleSetting('autoAudio')}
              className="accent-orange-500 w-4 h-4" 
            />
          </label>

          {settings.showVisuals !== undefined && (
            <label className="flex items-center justify-between p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-750 transition-colors group">
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Show Visuals</span>
              <input 
                type="checkbox" 
                checked={settings.showVisuals} 
                onChange={() => toggleSetting('showVisuals')}
                className="accent-orange-500 w-4 h-4" 
              />
            </label>
          )}
        </div>

        {/* About Section */}
        <div className="pt-4 border-t border-slate-700 text-xs text-slate-500">
          <p className="mb-2">DeepVocab v1.0</p>
          <p>Powered by {currentProvider === 'gemini' ? 'Google Gemini' : 'Cerebras Inference'}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
