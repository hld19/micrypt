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

const BUILT_IN_CATEGORIES: CategoryConfig[] = [
  {
    id: 'passwords',
    label: 'Passwords',
    description: 'Credentials, vault entries, and secret pairs',
    icon: LockIcon,
    accent: 'from-amber-500/25 via-amber-400/10 to-transparent',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    bar: 'bg-amber-500',
  },
  {
    id: 'images',
    label: 'Images',
    description: 'Screenshots, scans, and camera rolls',
    icon: ImageIcon,
    accent: 'from-rose-500/20 via-rose-400/10 to-transparent',
    border: 'border-rose-500/30',
    text: 'text-rose-500',
    bar: 'bg-rose-500',
  },
  {
    id: 'videos',
    label: 'Videos',
    description: 'Clips, meetings, and recordings',
    icon: VideoIcon,
    accent: 'from-purple-500/20 via-purple-400/10 to-transparent',
    border: 'border-purple-500/30',
    text: 'text-purple-500',
    bar: 'bg-purple-500',
  },
  {
    id: 'audio',
    label: 'Audio',
    description: 'Voice notes, songs, and podcasts',
    icon: AudioIcon,
    accent: 'from-sky-500/30 via-sky-400/10 to-transparent',
    border: 'border-sky-500/30',
    text: 'text-sky-500',
    bar: 'bg-sky-500',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'PDFs, contracts, and written reports',
    icon: DocumentIcon,
    accent: 'from-indigo-500/20 via-indigo-400/10 to-transparent',
    border: 'border-indigo-500/30',
    text: 'text-indigo-500',
    bar: 'bg-indigo-500',
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Source files, scripts, and snippets',
    icon: CodeIcon,
    accent: 'from-emerald-500/25 via-emerald-400/10 to-transparent',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    bar: 'bg-emerald-500',
  },
  {
    id: 'apis',
    label: 'API Keys',
    description: 'Tokens, configs, and environment files',
    icon: ShieldIcon,
    accent: 'from-cyan-500/25 via-cyan-400/10 to-transparent',
    border: 'border-cyan-500/30',
    text: 'text-cyan-500',
    bar: 'bg-cyan-500',
  },
  {
    id: 'keys',
    label: 'SSH Keys',
    description: 'Private keys and secure shells',
    icon: KeyIcon,
    accent: 'from-teal-500/25 via-teal-400/10 to-transparent',
    border: 'border-teal-500/30',
    text: 'text-teal-500',
    bar: 'bg-teal-500',
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'TLS bundles and trust stores',
    icon: CertificateIcon,
    accent: 'from-fuchsia-500/20 via-fuchsia-400/10 to-transparent',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-500',
    bar: 'bg-fuchsia-500',
  },
  {
    id: 'archives',
    label: 'Archives',
    description: 'Compressed backups and bundles',
    icon: ArchiveIcon,
    accent: 'from-orange-500/25 via-orange-400/10 to-transparent',
    border: 'border-orange-500/30',
    text: 'text-orange-500',
    bar: 'bg-orange-500',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'Everything that defies labels',
    icon: FolderIcon,
    accent: 'from-slate-500/20 via-slate-400/10 to-transparent',
    border: 'border-slate-500/30',
    text: 'text-slate-500',
    bar: 'bg-slate-500',
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
        accent: 'from-slate-500/20 via-slate-400/10 to-transparent',
        border: 'border-slate-500/30',
        text: 'text-slate-500',
        bar: 'bg-slate-500',
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
          <div className="flex items-center gap-3 rounded-3xl border border-slate-200/60 dark:border-slate-800 px-5 py-3 bg-white/70 dark:bg-slate-900/50">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
              <CategoriesIcon size={28} />
            </span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Active categories
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
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
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Files indexed
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalFiles}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              All encrypted entries tracked by Micrypt
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Populated categories
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {activeCategories.length}
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Categories currently holding encrypted files
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-6 py-5 shadow-neuro-light dark:shadow-neuro-dark">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Most active
            </div>
            {topCategory ? (
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/70 ${topCategory.text}`}>
                  {TopIcon ? <TopIcon size={24} /> : null}
                </span>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                    {topCategory.label}
                  </div>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    {topCategory.count} {topCategory.count === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
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
                className="rounded-3xl border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 h-44"
              />
            ))}
          </div>
        ) : totalFiles === 0 ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-6 max-w-lg">
              <div className="mx-auto h-28 w-28 rounded-full bg-white/70 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shadow-neuro-light dark:shadow-neuro-dark">
                <CategoriesIcon size={48} className="text-blue-500 dark:text-blue-300" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                  No files yet
                </h3>
                <p className="text-base font-medium text-slate-500 dark:text-slate-400">
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
                  className={`group relative overflow-hidden rounded-3xl border ${card.border} bg-white/75 dark:bg-slate-900/60 backdrop-blur-sm shadow-neuro-light dark:shadow-neuro-dark transition-all duration-200 ${inactive ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-neuro-light-lg dark:hover:shadow-neuro-dark-lg'}`}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}
                  />
                  <div className="relative px-6 py-6 space-y-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {card.label}
                        </div>
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                          {card.description}
                        </div>
                      </div>
                      <div
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-900/70 ${card.text}`}
                      >
                        <Icon size={24} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white">
                          {card.count}
                        </span>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                          {card.count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${card.bar}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
