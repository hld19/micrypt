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
        ? 'bg-[#e6e6e6] text-gray-900 border-[#cfcfcf] shadow-sm shadow-black/10 dark:bg-[#1a1a1a] dark:text-gray-100 dark:border-[#2b2b2b]'
        : 'bg-white/85 dark:bg-[#141414]/70 border-[#d6d6d6] dark:border-[#2b2b2b] text-gray-600 dark:text-gray-300 hover:border-[#a3a3a3] hover:text-gray-900 dark:hover:text-gray-100 hover:bg-[#f2f2f2] dark:hover:bg-[#1d1d1d]'}
    `}
  >
    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 ${isActive ? 'bg-[#d9d9d9] dark:bg-[#2a2a2a]' : 'bg-[#efefef] dark:bg-[#1f1f1f] group-hover:bg-[#e0e0e0] dark:group-hover:bg-[#2a2a2a]'}`}>
      {icon}
    </span>
    <span className="text-sm font-semibold tracking-wide truncate">{label}</span>
  </button>
);

export default function Sidebar({ currentView, onViewChange, isVaultUnlocked }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-72 h-full flex-col bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur border-r border-[#d4d4d4] dark:border-[#1f1f1f] px-6 py-8">
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5e5e5] text-[#1f1f1f] shadow-md shadow-black/10 dark:bg-[#1a1a1a] dark:text-gray-100 dark:shadow-black/50">
          <CatIcon size={22} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">micrypt</h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Offline vault</p>
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
      <div className="mt-10 space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="rounded-2xl border border-[#d9d9d9] dark:border-[#1f1f1f] bg-white/85 dark:bg-[#141414]/70 px-4 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Vault status</p>
          <p className={`text-xs font-medium ${isVaultUnlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-600 dark:text-gray-400'}`}>
            {isVaultUnlocked ? 'Unlocked' : 'Locked'}
          </p>
        </div>
        <p>&copy; {new Date().getFullYear()} micrypt</p>
      </div>
    </aside>
  );
}
