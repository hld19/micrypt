import { useState, useEffect } from 'react';
import { AddFiles, ListFiles, ExtractFile, DeleteFile } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';
import { PlusIcon, SearchIcon, DownloadIcon, TrashIcon, AlertIcon, DocumentIcon } from './Icons';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

export default function FilesView() {
  const [files, setFiles] = useState<main.FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await ListFiles();
      setFiles(fileList || []);
      setError('');
    } catch (err: any) {
      setError(err.toString() || 'Failed to load files');
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFiles = async () => {
    try {
      await AddFiles();
      await loadFiles();
    } catch (err: any) {
      if (!err.toString().includes('cancelled')) {
        setError(err.toString() || 'Failed to add files');
      }
    }
  };

  const handleExtractFile = async (encryptedName: string) => {
    try {
      await ExtractFile(encryptedName);
    } catch (err: any) {
      if (!err.toString().includes('cancelled')) {
        setError(err.toString() || 'Failed to extract file');
      }
    }
  };

  const handleDeleteFile = async (encryptedName: string, originalName: string) => {
    if (!confirm(`Are you sure you want to delete "${originalName}"?`)) {
      return;
    }

    try {
      await DeleteFile(encryptedName);
      await loadFiles();
    } catch (err: any) {
      setError(err.toString() || 'Failed to delete file');
    }
  };

  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-neuro-bg-light dark:bg-neuro-bg-dark">
      {/* Header */}
      <header className="p-8 bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
              Files
            </h2>
            <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-lg">Manage your encrypted files</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddFiles}
              className="neuro-card px-7 py-3.5 rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark flex items-center gap-3 font-bold"
            >
              <PlusIcon size={22} />
              <span>Add Files</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-neuro-text-muted-light dark:text-neuro-text-muted-dark" size={20} />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-5 py-3.5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-inset dark:shadow-neuro-dark-inset text-neuro-text-primary-light dark:text-neuro-text-primary-dark placeholder-neuro-text-muted-light dark:placeholder-neuro-text-muted-dark focus:shadow-neuro-light-inset dark:focus:shadow-neuro-dark-inset transition-all font-medium"
          />
        </div>

        {error && (
          <div className="mt-5 px-6 py-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset border-l-4 border-red-500">
            <p className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
              <AlertIcon size={20} className="text-red-600 dark:text-red-400" />
              {error}
            </p>
          </div>
        )}
      </header>

      {/* Files Grid */}
      <div className="flex-1 scroll-region p-8">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-5">
              <div className="w-20 h-20 rounded-full bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center mx-auto">
                <div className="w-12 h-12 border-4 border-gray-300 dark:border-gray-700 border-t-gray-500 rounded-full"></div>
              </div>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold text-lg">Loading files...</p>
            </div>
          </div>
        ) : filteredFiles.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-6 max-w-md">
              <button
                type="button"
                onClick={handleAddFiles}
                className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-200/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-200 shadow-md shadow-gray-400/30 transition hover:bg-gray-300/80 dark:hover:bg-gray-700/70 focus:outline-none focus:ring-2 focus:ring-gray-400/60"
              >
                <PlusIcon size={32} />
              </button>
              <div>
                <h3 className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3">No files yet</h3>
                <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-lg">Add your first encrypted file to get started with Micrypt</p>
              </div>
              <button
                onClick={handleAddFiles}
                className="neuro-card hover:neuro-card px-8 py-3.5 rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold flex items-center gap-2 mx-auto"
              >
                <PlusIcon size={20} />
                Add Your First File
              </button>
            </div>
          </div>
        ) : (
          /* Files Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFiles.map((file) => (
              <div
                key={file.encryptedName}
                className="group bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-6 shadow-neuro-light dark:shadow-neuro-dark hover:shadow-neuro-light-hover dark:hover:shadow-neuro-dark-hover transition-all duration-300"
              >
                <div className="flex items-center gap-5 mb-5">
                  <div className="w-20 h-20 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center flex-shrink-0 group-hover:shadow-neuro-light-hover dark:group-hover:shadow-neuro-dark-hover transition-all">
                    <DocumentIcon size={48} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-2 truncate">
                      {file.originalName}
                    </h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-4 py-1.5 rounded-neuro-sm bg-gray-700 text-white text-xs font-bold capitalize shadow-lg">
                        {file.category}
                      </span>
                      <span className="text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold mb-5 px-1">
                  <span>Encrypted {formatTimeAgo(file.encryptedAt)}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExtractFile(file.encryptedName)}
                    className="flex-1 neuro-card px-5 py-3 rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold flex items-center justify-center gap-2"
                    title="Extract"
                  >
                    <DownloadIcon size={20} />
                    Extract
                  </button>
                  <button
                    onClick={() => handleDeleteFile(file.encryptedName, file.originalName)}
                    className="neuro-card px-5 py-3 rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold"
                    title="Delete"
                  >
                    <TrashIcon size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
