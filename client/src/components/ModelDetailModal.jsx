import { useState, useEffect } from 'react';
import { showModel } from '../services/api';

function formatBytes(bytes) {
  if (!bytes) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num) {
  if (!num) return '-';
  return num.toLocaleString();
}

function DetailRow({ label, value, copyable = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (value && copyable) {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd 
        className={`text-sm font-medium text-gray-900 text-right max-w-xs truncate ${copyable ? 'cursor-pointer hover:text-blue-600' : ''}`}
        onClick={copyable ? handleCopy : undefined}
        title={copyable && value ? 'Click to copy' : undefined}
      >
        {value || '-'}
        {copyable && copied && (
          <span className="ml-2 text-green-500 text-xs">Copied!</span>
        )}
      </dd>
    </div>
  );
}

function InfoSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-700">{title}</span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 py-2 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

export function ModelDetailModal({ isOpen, onClose, ollamaUrl, modelName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isOpen && modelName) {
      loadModelDetails();
    }
  }, [isOpen, modelName]);

  const loadModelDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await showModel(ollamaUrl, modelName);
      setModelInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Model Details</h3>
              <p className="text-sm text-gray-500">{modelName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(85vh-130px)]">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            )}

            {error && (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <p className="text-red-800 font-medium mb-2">Failed to load model details</p>
                  <p className="text-red-600 text-sm mb-4">{error}</p>
                  <button
                    onClick={loadModelDetails}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {modelInfo && !loading && (
              <div className="p-4">
                {/* Tabs */}
                <div className="flex gap-1 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'details' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('modelfile')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'modelfile' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Modelfile
                  </button>
                  <button
                    onClick={() => setActiveTab('template')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'template' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Template
                  </button>
                  <button
                    onClick={() => setActiveTab('parameters')}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                      activeTab === 'parameters' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Parameters
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                  <div className="space-y-3">
                    {/* Basic Details */}
                    <InfoSection title="Basic Information">
                      <dl>
                        <DetailRow label="Format" value={modelInfo.details?.format} copyable />
                        <DetailRow label="Family" value={modelInfo.details?.family} copyable />
                        <DetailRow label="Families" value={modelInfo.details?.families?.join(', ')} copyable />
                        <DetailRow label="Parameter Size" value={modelInfo.details?.parameter_size} copyable />
                        <DetailRow label="Quantization" value={modelInfo.details?.quantization_level} copyable />
                      </dl>
                    </InfoSection>

                    {/* Capabilities */}
                    {modelInfo.capabilities && modelInfo.capabilities.length > 0 && (
                      <InfoSection title="Capabilities">
                        <div className="flex flex-wrap gap-2 py-2">
                          {modelInfo.capabilities.map((cap) => (
                            <span 
                              key={cap} 
                              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </InfoSection>
                    )}

                    {/* Model Architecture */}
                    {modelInfo.model_info && (
                      <InfoSection title="Model Architecture" defaultOpen={false}>
                        <dl>
                          <DetailRow label="Architecture" value={modelInfo.model_info['general.architecture']} copyable />
                          <DetailRow label="Parameters" value={formatNumber(modelInfo.model_info['general.parameter_count'])} copyable />
                          <DetailRow label="Context Length" value={formatNumber(modelInfo.model_info[modelInfo.model_info['general.architecture']?.replace('general.', '') + '.context_length'] || modelInfo.model_info['llama.context_length'])} />
                          <DetailRow label="Embedding Length" value={formatNumber(modelInfo.model_info[modelInfo.model_info['general.architecture']?.replace('general.', '') + '.embedding_length'] || modelInfo.model_info['llama.embedding_length'])} />
                          <DetailRow label="Block Count" value={modelInfo.model_info[modelInfo.model_info['general.architecture']?.replace('general.', '') + '.block_count'] || modelInfo.model_info['llama.block_count']} />
                          <DetailRow label="Head Count" value={modelInfo.model_info[modelInfo.model_info['general.architecture']?.replace('general.', '') + '.attention.head_count'] || modelInfo.model_info['llama.attention.head_count']} />
                          <DetailRow label="Head Count (KV)" value={modelInfo.model_info[modelInfo.model_info['general.architecture']?.replace('general.', '') + '.attention.head_count_kv'] || modelInfo.model_info['llama.attention.head_count_kv']} />
                          <DetailRow label="Vocab Size" value={formatNumber(modelInfo.model_info['llama.vocab_size'] || modelInfo.model_info['tokenizer.ggml.tokens']?.length)} />
                        </dl>
                      </InfoSection>
                    )}
                  </div>
                )}

                {activeTab === 'modelfile' && (
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">
                      {modelInfo.modelfile || 'No modelfile available'}
                    </pre>
                  </div>
                )}

                {activeTab === 'template' && (
                  <div>
                    {modelInfo.template ? (
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">
                          {modelInfo.template}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No template available</p>
                    )}
                  </div>
                )}

                {activeTab === 'parameters' && (
                  <div>
                    {modelInfo.parameters ? (
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono">
                          {modelInfo.parameters}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">No parameters available</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}