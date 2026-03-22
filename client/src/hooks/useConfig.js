import { useState, useEffect } from 'react';

const CONFIG_KEY = 'ollama_config';
const DEFAULT_URL = 'http://localhost:11434';

export function useConfig() {
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_URL);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setOllamaUrl(config.ollamaUrl || DEFAULT_URL);
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save config to localStorage
  const saveConfig = (url) => {
    const config = { ollamaUrl: url };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    setOllamaUrl(url);
  };

  return {
    ollamaUrl,
    saveConfig,
    isLoaded,
  };
}