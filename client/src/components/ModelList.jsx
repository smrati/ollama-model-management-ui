import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { fetchModels, deleteModel } from '../services/api';
import { ConfirmDialog } from './ConfirmDialog';
import { ModelDetailModal } from './ModelDetailModal';

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

// Copyable cell component
function CopyableCell({ value, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (value && value !== '-') {
      const success = await copyToClipboard(String(value), () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  };

  return (
    <td 
      className={`px-6 py-4 whitespace-nowrap text-sm ${className} cursor-pointer group relative`}
      onClick={handleCopy}
      title={value && value !== '-' ? `Click to copy: ${value}` : undefined}
    >
      <span className="flex items-center gap-1">
        {value}
        {value && value !== '-' && (
          <span className={`transition-all ${copied ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`}>
            {copied ? (
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </span>
        )}
      </span>
    </td>
  );
}

// Model name cell with detail view on click
function ModelNameCell({ value, className = '', onViewDetails }) {
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

  const handleClick = () => {
    onViewDetails(value);
  };

  return (
    <td className="px-6 py-4 whitespace-nowrap text-sm group">
      <div className="flex items-center gap-2">
        <button
          onClick={handleClick}
          className={`${className} hover:text-blue-600 hover:underline transition-colors`}
          title="Click to view model details"
        >
          {value}
        </button>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity p-0.5"
          title="Copy model name"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </td>
  );
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

export const ModelList = forwardRef(({ ollamaUrl, onConnectionError }, ref) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, model: null });
  const [deleting, setDeleting] = useState(false);
  const [detailModal, setDetailModal] = useState({ isOpen: false, modelName: null });

  useImperativeHandle(ref, () => ({
    refresh: loadModels,
    getModels: () => models
  }));

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortedModels = useMemo(() => {
    if (!sortConfig.key) return models;

    return [...models].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'size':
          aValue = a.size || 0;
          bValue = b.size || 0;
          break;
        case 'parameters':
          aValue = a.details?.parameter_size || '';
          bValue = b.details?.parameter_size || '';
          break;
        case 'quantization':
          aValue = a.details?.quantization_level || '';
          bValue = b.details?.quantization_level || '';
          break;
        case 'family':
          aValue = a.details?.family || '';
          bValue = b.details?.family || '';
          break;
        case 'modified':
          aValue = a.modified_at ? new Date(a.modified_at).getTime() : 0;
          bValue = b.modified_at ? new Date(b.modified_at).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [models, sortConfig]);

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  useEffect(() => {
    loadModels();
  }, [ollamaUrl]);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchModels(ollamaUrl);
      setModels(data.models || []);
    } catch (err) {
      setError(err.message);
      onConnectionError?.(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteConfirm.model) return;
    
    setDeleting(true);
    try {
      await deleteModel(ollamaUrl, deleteConfirm.model.name);
      await loadModels();
    } catch (err) {
      setError(`Failed to delete model: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteConfirm({ isOpen: false, model: null });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium mb-2">Failed to load models</p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={loadModels}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600 mb-2">No models found</p>
        <p className="text-gray-500 text-sm">
          Pull a model using the button above or use <code className="bg-gray-200 px-1 rounded">ollama pull {"<model-name>"}</code>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name
                  <SortIndicator columnKey="name" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center">
                  Size
                  <SortIndicator columnKey="size" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('parameters')}
              >
                <div className="flex items-center">
                  Parameters
                  <SortIndicator columnKey="parameters" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('quantization')}
              >
                <div className="flex items-center">
                  Quantization
                  <SortIndicator columnKey="quantization" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('family')}
              >
                <div className="flex items-center">
                  Family
                  <SortIndicator columnKey="family" />
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('modified')}
              >
                <div className="flex items-center">
                  Modified
                  <SortIndicator columnKey="modified" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getSortedModels.map((model) => (
              <tr key={model.name} className="hover:bg-gray-50">
                <ModelNameCell 
                  value={model.name} 
                  className="font-medium text-gray-900" 
                  onViewDetails={(name) => setDetailModal({ isOpen: true, modelName: name })}
                />
                <CopyableCell value={formatBytes(model.size)} className="text-gray-600" />
                <CopyableCell value={model.details?.parameter_size || '-'} className="text-gray-600" />
                <CopyableCell value={model.details?.quantization_level || '-'} className="text-gray-600" />
                <CopyableCell value={model.details?.family || '-'} className="text-gray-600" />
                <CopyableCell value={formatDate(model.modified_at)} className="text-gray-500" />
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => setDeleteConfirm({ isOpen: true, model })}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Delete model"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, model: null })}
        onConfirm={handleDeleteModel}
        title="Delete Model"
        message={`Are you sure you want to delete "${deleteConfirm.model?.name}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        danger={true}
      />

      <ModelDetailModal
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ isOpen: false, modelName: null })}
        ollamaUrl={ollamaUrl}
        modelName={detailModal.modelName}
      />
    </>
  );
});
