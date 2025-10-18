import { FilesIcon, CategoriesIcon, StatisticsIcon, SettingsIcon, CatIcon } from './Icons';

type View = 'files' | 'categories' | 'statistics' | 'settings';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isVaultUnlocked: boolean;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const NavItem = ({ icon, label, isActive, onClick, disabled }: NavItemProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all duration-200
      ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      ${isActive
        ? 'bg-slate-200 text-slate-900 border-slate-300 shadow-sm shadow-slate-400/40 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
        : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400/70 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'}
    `}
  >
    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 ${isActive ? 'bg-slate-300/60 dark:bg-slate-700/80' : 'bg-slate-100/70 dark:bg-slate-800/60 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-700/70'}`}>
      {icon}
    </span>
    <span className="text-sm font-semibold tracking-wide truncate">{label}</span>
  </button>
);

export default function Sidebar({ currentView, onViewChange, isVaultUnlocked }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-72 h-full flex-col bg-slate-50/70 dark:bg-slate-950/45 backdrop-blur border-r border-slate-200/50 dark:border-slate-800 px-6 py-8">
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 shadow-md shadow-slate-400/30 dark:bg-slate-800 dark:text-slate-100 dark:shadow-black/40">
          <CatIcon size={22} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">Micryptlol</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Offline vault</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem
          icon={<FilesIcon size={20} />}
          label="Files"
          isActive={currentView === 'files'}
          onClick={() => onViewChange('files')}
          disabled={!isVaultUnlocked}
        />
        <NavItem
          icon={<CategoriesIcon size={20} />}
          label="Categories"
          isActive={currentView === 'categories'}
          onClick={() => onViewChange('categories')}
          disabled={!isVaultUnlocked}
        />
        <NavItem
          icon={<StatisticsIcon size={20} />}
          label="Statistics"
          isActive={currentView === 'statistics'}
          onClick={() => onViewChange('statistics')}
          disabled={!isVaultUnlocked}
        />
        <NavItem
          icon={<SettingsIcon size={20} />}
          label="Settings"
          isActive={currentView === 'settings'}
          onClick={() => onViewChange('settings')}
          disabled={!isVaultUnlocked}
        />
      </nav>
      <div className="mt-10 space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/45 px-4 py-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Vault status</p>
          <p className={`text-xs font-medium ${isVaultUnlocked ? 'text-white-600 dark:text-white-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {isVaultUnlocked ? 'Unlocked' : 'Locked'}
          </p>
        </div>
        <p>&copy; {new Date().getFullYear()} micryptlol</p>
      </div>
    </aside>
  );
}
