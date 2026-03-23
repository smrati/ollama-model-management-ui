import { useState, useEffect } from 'react';
import { fetchRunningModels } from '../services/api';

// Copy to clipboard helper
const copyToClipboard = async (text, onCopy) => {
  try {
    await navigator.clipboard.writeText(text);
    onCopy?.(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Copyable text component
function CopyableText({ value, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (value) {
      await copyToClipboard(String(value), () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <span 
      className={`${className} cursor-pointer group inline-flex items-center gap-1`}
      onClick={handleCopy}
      title={`Click to copy: ${value}`}
    >
      {value}
      <span className={`transition-all ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}>
        {copied ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </span>
    </span>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatExpiresAt(expiresAt) {
  if (!expiresAt) return 'Unknown';
  
  const expires = new Date(expiresAt);
  const now = new Date();
  const diff = expires - now;
  
  if (diff <= 0) return 'Expired';
  
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function RunningModels({ ollamaUrl }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRunningModels = async (isInitialLoad = false) => {
    // Only show loading state on initial load, not on background refreshes
    // This prevents flickering during periodic updates
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchRunningModels(ollamaUrl);
      setModels(data.models || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRunningModels(true);  // Initial load with loading state
    // Refresh every 5 seconds to update expiry times (no loading state to prevent flicker)
    const interval = setInterval(() => loadRunningModels(false), 5000);
    return () => clearInterval(interval);
  }, [ollamaUrl]);

  if (loading && models.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-600">Failed to load running models: {error}</p>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">No Running Models</p>
            <p className="text-xs text-gray-500">Models loaded in memory will appear here</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-sm font-medium text-green-800">
              Running Models ({models.length})
            </h3>
          </div>
          <button
            onClick={loadRunningModels}
            className="text-green-600 hover:text-green-800 p-1"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {models.map((model) => (
          <div key={model.name} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <CopyableText value={model.name} className="font-medium text-gray-900" />
                  <p className="text-xs text-gray-500 truncate">
                    <CopyableText value={model.details?.parameter_size || 'Unknown size'} />
                    {' • '}
                    <CopyableText value={model.details?.quantization_level || 'Unknown quant'} />
                  </p>
                </div>
              </div>
              <div className="sm:text-right pl-12 sm:pl-0">
                <CopyableText value={formatBytes(model.size_vram || model.size)} className="text-sm text-gray-600" />
                <p className="text-xs text-gray-500">
                  Expires in {formatExpiresAt(model.expires_at)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}