import { useState } from 'react';
import { testConnection } from '../services/api';

export function Settings({ isOpen, onClose, currentUrl, urlHistory = [], onSave }) {
  const [url, setUrl] = useState(currentUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(url);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(url);
    onClose();
  };

  const handleClose = () => {
    setUrl(currentUrl);
    setTestResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ollama Server URL
          </label>
          <input
            type="text"
            list="url-history"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="http://localhost:11434"
          />
          <datalist id="url-history">
            {urlHistory.map((h, i) => (
              <option key={i} value={h} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-gray-500">
            Double-click or start typing to see previously used URLs
          </p>
        </div>


        {testResult && (
          <div
            className={`mb-4 p-3 rounded-md ${
              testResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {testResult.success ? (
              <div>
                <span className="font-medium">✓ Connected!</span>
                <span className="ml-2">Ollama version: {testResult.version}</span>
              </div>
            ) : (
              <div>
                <span className="font-medium">✗ Connection failed</span>
                <span className="ml-2">{testResult.error || testResult.message}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleTest}
            disabled={testing || !url}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!url}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}