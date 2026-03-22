import { useState } from 'react';
import { createModel } from '../services/api';

// Common Ollama parameters with descriptions
const COMMON_PARAMETERS = [
  { key: 'num_ctx', description: 'Context window size (default: 2048)' },
  { key: 'temperature', description: 'Randomness (0.0-2.0, default: 1.0)' },
  { key: 'top_p', description: 'Nucleus sampling (0.0-1.0)' },
  { key: 'top_k', description: 'Top-k sampling (default: 40)' },
  { key: 'repeat_penalty', description: 'Repeat penalty (default: 1.1)' },
  { key: 'seed', description: 'Random seed (-1 for random)' },
  { key: 'num_predict', description: 'Max tokens to predict (-1 = infinite)' },
  { key: 'stop', description: 'Stop sequences (JSON array)' },
];

export function CreateModelModal({ isOpen, onClose, ollamaUrl, models, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    from: '',
    system: '',
    template: '',
    license: ''
  });
  const [parameters, setParameters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addParameter = (key = '', value = '') => {
    setParameters(prev => [...prev, { key, value, id: Date.now() + Math.random() }]);
  };

  const updateParameter = (id, field, value) => {
    setParameters(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removeParameter = (id) => {
    setParameters(prev => prev.filter(p => p.id !== id));
  };

  const addCommonParameter = (key) => {
    // Check if parameter already exists
    if (parameters.some(p => p.key === key)) {
      return;
    }
    addParameter(key, '');
  };

  const parseValue = (value) => {
    // Try to parse as number or JSON
    if (value === '') return '';
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    const num = Number(value);
    if (!isNaN(num)) return num;
    
    // Try to parse as JSON array (for stop sequences)
    try {
      const parsed = JSON.parse(value);
      return parsed;
    } catch {
      return value;
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Please enter a model name');
      return;
    }

    if (!formData.from) {
      setError('Please select a base model');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ status: 'Creating model...' });

    // Build parameters object
    const modelParams = {};
    parameters.forEach(p => {
      if (p.key.trim()) {
        modelParams[p.key.trim()] = parseValue(p.value);
      }
    });

    try {
      await createModel(ollamaUrl, {
        name: formData.name.trim(),
        from: formData.from,
        system: formData.system || undefined,
        template: formData.template || undefined,
        license: formData.license || undefined,
        parameters: Object.keys(modelParams).length > 0 ? modelParams : undefined
      }, (data) => {
        setProgress(data);
      });
      setProgress({ status: 'success' });
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setFormData({ name: '', from: '', system: '', template: '', license: '' });
        setParameters([]);
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
      return '✓ Model created successfully!';
    }
    
    return progress.status || 'Processing...';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={!loading ? onClose : undefined}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create Custom Model</h3>
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
            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Model Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., my-custom-llama"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Base Model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Model <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.from}
                onChange={(e) => handleChange('from', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Select a base model...</option>
                {models?.map(model => (
                  <option key={model.name} value={model.name}>{model.name}</option>
                ))}
              </select>
            </div>

            {/* Parameters Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parameters
              </label>
              
              {/* Quick Add Common Parameters */}
              <div className="mb-2 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Quick add:</span>
                {COMMON_PARAMETERS.map(param => (
                  <button
                    key={param.key}
                    type="button"
                    onClick={() => addCommonParameter(param.key)}
                    disabled={loading || parameters.some(p => p.key === param.key)}
                    className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title={param.description}
                  >
                    +{param.key}
                  </button>
                ))}
              </div>

              {/* Parameter List */}
              <div className="space-y-2">
                {parameters.map((param) => (
                  <div key={param.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={param.key}
                      onChange={(e) => updateParameter(param.id, 'key', e.target.value)}
                      placeholder="Parameter name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateParameter(param.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeParameter(param.id)}
                      disabled={loading}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Parameter Button */}
              <button
                type="button"
                onClick={() => addParameter()}
                disabled={loading}
                className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Parameter
              </button>

              <p className="text-xs text-gray-500 mt-2">
                Values are auto-converted: numbers → numeric, true/false → boolean, JSON arrays → array
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Prompt
              </label>
              <textarea
                value={formData.system}
                onChange={(e) => handleChange('system', e.target.value)}
                placeholder="e.g., You are a helpful assistant that specializes in..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Define the model's personality and behavior
              </p>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template
              </label>
              <textarea
                value={formData.template}
                onChange={(e) => handleChange('template', e.target.value)}
                placeholder="e.g., {{ .System }}\nUser: {{ .Prompt }}\nAssistant:"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Custom prompt template (leave empty for default)
              </p>
            </div>

            {/* License */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License
              </label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) => handleChange('license', e.target.value)}
                placeholder="e.g., MIT, Apache-2.0, Llama 3 Community License"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Specify the license for this model
              </p>
            </div>

            {/* Progress */}
            {progress && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-600">{getProgressText()}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !formData.name.trim() || !formData.from}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {loading ? 'Creating...' : 'Create Model'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}