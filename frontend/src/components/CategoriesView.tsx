import { useEffect, useMemo, useState } from 'react';
import { GetCategoryStats } from '../../wailsjs/go/main/App';
import {
  CategoriesIcon,
  LockIcon,
  ImageIcon,
  VideoIcon,
  AudioIcon,
  DocumentIcon,
  CodeIcon,
  ShieldIcon,
  KeyIcon,
  CertificateIcon,
  ArchiveIcon,
  FolderIcon,
} from './Icons';

type CategoryIcon = (props: { className?: string; size?: number }) => JSX.Element;

type CategoryConfig = {
  id: string;
  label: string;
  description: string;
  icon: CategoryIcon;
  accent: string;
  border: string;
  text: string;
  bar: string;
};

const NEUTRAL_STYLE: Pick<CategoryConfig, 'accent' | 'border' | 'text' | 'bar'> = {
  accent: 'from-gray-500/20 via-gray-400/10 to-transparent',
  border: 'border-gray-500/30',
  text: 'text-gray-700 dark:text-gray-200',
  bar: 'bg-gray-700 dark:bg-gray-400',
};

const BUILT_IN_CATEGORIES: CategoryConfig[] = [
  {
    id: 'passwords',
    label: 'Passwords',
    description: 'Credentials, vault entries, and secret pairs',
    icon: LockIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'images',
    label: 'Images',
    description: 'Screenshots, scans, and camera rolls',
    icon: ImageIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'videos',
    label: 'Videos',
    description: 'Clips, meetings, and recordings',
    icon: VideoIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Voice notes, songs, and podcasts',
    icon: AudioIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'PDFs, contracts, and written reports',
    icon: DocumentIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Source files, scripts, and snippets',
    icon: CodeIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'apis',
    label: 'API Keys',
    description: 'Tokens, configs, and environment files',
    icon: ShieldIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'keys',
    label: 'SSH Keys',
    description: 'Private keys and secure shells',
    icon: KeyIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'TLS bundles and trust stores',
    icon: CertificateIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'archives',
    label: 'Archives',
    description: 'Compressed backups and bundles',
    icon: ArchiveIcon,
    ...NEUTRAL_STYLE,
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Everything that defies labels',
    icon: FolderIcon,
    ...NEUTRAL_STYLE,
  },
];

type CategoryCard = CategoryConfig & { count: number };

const ensureTitle = (value: string) =>
  value
    .split(/[\s_\-]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export default function CategoriesView() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await GetCategoryStats();
        if (!active) return;
        setStats(data || {});
        setError('');
      } catch (err: any) {
        if (!active) return;
        setError(err?.toString?.() || 'Failed to load categories');
        setStats({});
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const cards = useMemo(() => {
    const known = BUILT_IN_CATEGORIES.map<CategoryCard>((item) => ({
      ...item,
      count: stats[item.id] ?? 0,
    }));
    const extras = Object.keys(stats)
      .filter((key) => !BUILT_IN_CATEGORIES.find((item) => item.id === key))
      .map<CategoryCard>((key) => ({
        id: key,
        label: ensureTitle(key),
        description: 'Vault entries grouped by custom metadata',
        icon: FolderIcon,
        ...NEUTRAL_STYLE,
        count: stats[key] ?? 0,
      }));
    return [...known, ...extras];
  }, [stats]);

  const totalFiles = useMemo(
    () => cards.reduce((sum, card) => sum + card.count, 0),
    [cards],
  );

  const activeCategories = useMemo(
    () => cards.filter((card) => card.count > 0),
    [cards],
  );

  const topCategory = useMemo(() => {
    if (activeCategories.length === 0) {
      return undefined;
    }
    return activeCategories.reduce((best, current) =>
      current.count > best.count ? current : best,
    );
  }, [activeCategories]);

  const TopIcon = topCategory?.icon;

  return (
    <div className="h-full flex flex-col bg-neuro-bg-light dark:bg-neuro-bg-dark">
      <header className="p-8 bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h2 className="text-5xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-2 tracking-tight">
              Categories
            </h2>
            <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-lg">
              See how your encrypted files are distributed across the vault
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl border border-gray-200/60 dark:border-gray-800 px-5 py-3 bg-white/70 dark:bg-gray-900/50">
            <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-200/70 text-gray-700 dark:bg-gray-800/60 dark:text-gray-100">
              <CategoriesIcon size={28} />
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Active categories
              </div>
              <div className="text-base font-bold text-gray-900 dark:text-white">
                {activeCategories.length} / {cards.length}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 scroll-region p-8 space-y-8">
        {error && (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Files indexed
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalFiles}
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              All encrypted entries tracked by Micrypt
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Populated categories
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeCategories.length}
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Categories currently holding encrypted files
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200/70 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Most active
            </div>
            {topCategory ? (
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-gray-900/70 ${topCategory.text}`}>
                  {TopIcon ? <TopIcon size={22} /> : null}
                </span>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white leading-snug">
                    {topCategory.label}
                  </div>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {topCategory.count} {topCategory.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Add files to see category insights here
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gray-200/60 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40 h-44"
              />
            ))}
          </div>
        ) : totalFiles === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-6 max-w-lg">
              <div className="mx-auto h-28 w-28 rounded-full bg-white/70 dark:bg-gray-900/60 border border-gray-200/50 dark:border-gray-800 flex items-center justify-center shadow-neuro-light dark:shadow-neuro-dark">
                <CategoriesIcon size={48} className="text-gray-500 dark:text-gray-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  No files yet
                </h3>
                <p className="text-base font-medium text-gray-500 dark:text-gray-400">
                  Once you add files to the vault, they will appear here grouped by type.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              const progress =
                totalFiles === 0 ? 0 : Math.min(100, Math.round((card.count / totalFiles) * 100));
              const inactive = card.count === 0;
              return (
                <div
                  key={card.id}
                  className={`group relative overflow-hidden rounded-3xl border ${card.border} bg-white/75 dark:bg-gray-900/60 backdrop-blur-sm shadow-neuro-light dark:shadow-neuro-dark transition-all duration-200 ${inactive ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-neuro-light-lg dark:hover:shadow-neuro-dark-lg'}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                  />
                  <div className="relative px-6 py-6 space-y-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          {card.label}
                        </div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {card.description}
                        </div>
                      </div>
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-gray-900/70 ${card.text}`}
                      >
                        <Icon size={24} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                          {card.count}
                        </span>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {card.count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200/60 dark:bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${card.bar}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {progress}% of vault
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
