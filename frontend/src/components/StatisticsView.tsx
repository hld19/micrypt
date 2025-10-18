import { useState, useEffect } from 'react';
import { GetVaultStats, GetCategoryStats } from '../../wailsjs/go/main/App';
import { FilesIcon, StatisticsIcon, CategoriesIcon, LockIcon, BriefcaseIcon, ShieldIcon } from './Icons';

interface VaultStats {
  totalFiles: number;
  totalSize: number;
  vaultPath: string;
  isUnlocked: boolean;
}

export default function StatisticsView() {
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [categories, setCategories] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [vaultStats, categoryStats] = await Promise.all([
        GetVaultStats(),
        GetCategoryStats().catch(() => ({}))
      ]);
      setStats(vaultStats);
      setCategories(categoryStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const totalCategories = Object.keys(categories).length;
  const totalSize = stats?.totalSize || 0;

  return (
    <div className="h-full flex flex-col bg-neuro-bg-light dark:bg-neuro-bg-dark scroll-region">
      {/* Header */}
      <header className="p-8 bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm sticky top-0 z-10">
        <div>
          <h2 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2 tracking-tight">
            Statistics
          </h2>
          <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-lg">Your vault insights and activity</p>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-6 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-start justify-between mb-5">
              <div className="text-sm text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold uppercase tracking-wide">Total Files</div>
              <div className="w-14 h-14 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <FilesIcon size={28} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
            </div>
            <div className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3">
              {loading ? '...' : stats?.totalFiles || 0}
            </div>
            <div className="text-xs text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">
              Encrypted files
            </div>
          </div>

          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-6 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-start justify-between mb-5">
              <div className="text-sm text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold uppercase tracking-wide">Total Size</div>
              <div className="w-14 h-14 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <StatisticsIcon size={28} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
            </div>
            <div className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3">
              {loading ? '...' : formatBytes(totalSize)}
            </div>
            <div className="text-xs text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">
              Storage used
            </div>
          </div>

          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-6 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-start justify-between mb-5">
              <div className="text-sm text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold uppercase tracking-wide">Categories</div>
              <div className="w-14 h-14 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <CategoriesIcon size={28} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
            </div>
            <div className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3">
              {loading ? '...' : totalCategories}
            </div>
            <div className="text-xs text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">
              File types
            </div>
          </div>

          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-6 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-start justify-between mb-5">
              <div className="text-sm text-neuro-text-muted-light dark:text-neuro-text-muted-dark font-bold uppercase tracking-wide">Vault Status</div>
              <div className="w-14 h-14 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <LockIcon size={28} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-3">
              {loading ? '...' : 'Unlocked'}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="text-xs text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">
                Active
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-8 shadow-neuro-light dark:shadow-neuro-dark">
          <h3 className="text-3xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-6 tracking-tight">Files by Category</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-neuro-text-muted-light dark:border-neuro-text-muted-dark border-t-green-500 rounded-full mx-auto"></div>
                <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold">Loading category data...</p>
              </div>
            </div>
          ) : totalCategories === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <CategoriesIcon size={64} className="text-neuro-text-muted-light dark:text-neuro-text-muted-dark mx-auto" />
                <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold">
                  Category breakdown will appear here once files are added
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(categories).map(([category, count]) => (
                <div
                  key={category}
                  className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark"
                >
                  <div className="text-3xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-2">
                    {count}
                  </div>
                  <div className="text-sm text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold capitalize">
                    {category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <ShieldIcon size={32} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
              <h4 className="text-2xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">Encryption</h4>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset">
                <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">its the one u choose.</span>
                <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold"></span>
              </div>
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset">
                <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">Key Derivation</span>
                <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold">Argon2id</span>
              </div>
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                <span className="font-bold">Status</span>
                <span className="font-bold flex items-center gap-2">
                  <div className=""></div>
                  :p
                </span>
              </div>
            </div>
          </div>

          <div className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
                <BriefcaseIcon size={32} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              </div>
              <h4 className="text-2xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">Vault Info</h4>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset">
                <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">Location</span>
                <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold truncate ml-2" title={stats?.vaultPath}>
                  {stats?.vaultPath ? '...' + stats.vaultPath.slice(-20) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-inset">
                <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">Backup</span>
                <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold">Available</span>
              </div>
              <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                <span className="font-bold">Status</span>
                <span className="font-bold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg"></div>
                  good state
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
