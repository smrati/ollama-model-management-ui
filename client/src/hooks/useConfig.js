import { useState, useEffect } from 'react';

const CONFIG_KEY = 'ollama_config';
const URL_HISTORY_KEY = 'ollama_url_history';
const DEFAULT_URL = 'http://localhost:11434';
const MAX_HISTORY = 10;

export function useConfig() {
  const [ollamaUrl, setOllamaUrl] = useState(DEFAULT_URL);
  const [urlHistory, setUrlHistory] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config and history from localStorage on mount
  useEffect(() => {
    let currentUrl = DEFAULT_URL;
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        currentUrl = config.ollamaUrl || DEFAULT_URL;
        setOllamaUrl(currentUrl);
      } catch (e) {
        console.error('Failed to parse saved config:', e);
      }
    }

    const savedHistory = localStorage.getItem(URL_HISTORY_KEY);
    let history = [];
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
        if (!Array.isArray(history)) history = [];
      } catch (e) {
        console.error('Failed to parse saved history:', e);
      }
    }

    // Ensure currentUrl is in the history
    if (!history.includes(currentUrl)) {
      history = [currentUrl, ...history];
    }
    // Also include default URL if not there
    if (!history.includes(DEFAULT_URL) && currentUrl !== DEFAULT_URL) {
      history.push(DEFAULT_URL);
    }

    setUrlHistory(history.slice(0, MAX_HISTORY));
    setIsLoaded(true);
  }, []);


  // Save config to localStorage and update history
  const saveConfig = (url) => {
    // Save current URL config
    const config = { ollamaUrl: url };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    setOllamaUrl(url);

    // Update history: remove if exists, add to front, limit to MAX_HISTORY
    setUrlHistory(prevHistory => {
      const newHistory = [
        url,
        ...(prevHistory || []).filter(h => h !== url)
      ].slice(0, MAX_HISTORY);
      
      localStorage.setItem(URL_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return {
    ollamaUrl,
    urlHistory,
    saveConfig,
    isLoaded,
  };
}