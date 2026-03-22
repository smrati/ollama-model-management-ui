import { useState } from 'react';
import { pullModel } from '../services/api';

export function PullModelModal({ isOpen, onClose, ollamaUrl, onSuccess }) {
  const [modelName, setModelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handlePull = async () => {
    if (!modelName.trim()) {
      setError('Please enter a model name');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ status: 'Starting download...' });

    try {
      await pullModel(ollamaUrl, modelName.trim(), (data) => {
        setProgress(data);
      });
      setProgress({ status: 'success' });
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setModelName('');
        setProgress(null);
      }, 1000);
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const getProgressText = () => {
    if (!progress) return '';
    
    if (progress.status === 'success') {
      return '✓ Model downloaded successfully!';
    }
    
    if (progress.status === 'pulling manifest') {
      return 'Fetching model information...';
    }
    
    if (progress.status?.includes('pulling')) {
      const completed = progress.completed || 0;
      const total = progress.total || 0;
      if (total > 0) {
        const percent = Math.round((completed / total) * 100);
        const completedMB = Math.round(completed / 1024 / 1024);
        const totalMB = Math.round(total / 1024 / 1024);
        return `Downloading: ${percent}% (${completedMB}MB / ${totalMB}MB)`;
      }
      return 'Downloading...';
    }
    
    if (progress.status === 'verifying sha256 digest') {
      return 'Verifying download...';
    }
    
    if (progress.status === 'writing manifest') {
      return 'Writing manifest...';
    }
    
    return progress.status || 'Processing...';
  };

  const getProgressPercent = () => {
    if (!progress || !progress.total) return 0;
    return Math.round(((progress.completed || 0) / progress.total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={!loading ? onClose : undefined}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pull Model</h3>
            {!loading && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g., llama3.2, mistral, codellama"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the model name from <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ollama Library</a>
              </p>
            </div>

            {progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{getProgressText()}</span>
                  {progress.total > 0 && (
                    <span className="text-gray-500">{getProgressPercent()}%</span>
                  )}
                </div>
                {progress.total > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        progress.status === 'success' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${getProgressPercent()}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePull}
                disabled={loading || !modelName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? 'Pulling...' : 'Pull Model'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}