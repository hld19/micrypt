import { LockIcon, ShieldIcon, KeyIcon, AlertIcon, InfoIcon } from './Icons';

interface SettingsViewProps {
  isVaultUnlocked: boolean;
  vaultPath: string;
  onLock: () => void;
  lockPending: boolean;
  onCopyPath: () => void;
  onExportMnemonic: () => void;
  onDeleteVault: () => void;
  deletePending: boolean;
}

export default function SettingsView({
  isVaultUnlocked,
  vaultPath,
  onLock,
  lockPending,
  onCopyPath,
  onExportMnemonic,
  onDeleteVault,
  deletePending,
}: SettingsViewProps) {
  const hasVaultPath = Boolean(vaultPath);

  return (
    <div className="h-full flex flex-col bg-neuro-bg-light dark:bg-neuro-bg-dark scroll-region">
      <header className="p-8 bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm sticky top-0 z-10">
        <div>
          <h2 className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2 tracking-tight">Settings</h2>
          <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-lg">
            Manage vault status, security options, and recovery tools
          </p>
        </div>
      </header>

      <div className="p-8 space-y-8">
        <section className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
              <ShieldIcon size={32} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">Vault Details</h3>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-sm">
                Connection status and storage location
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark uppercase tracking-wide">
                    Status
                  </div>
                  <div className="text-lg font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
                    {isVaultUnlocked ? 'Unlocked' : 'Locked'}
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${isVaultUnlocked ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>
                  {isVaultUnlocked ? 'Active session' : 'Requires authentication'}
                </div>
              </div>
            </div>

            <div className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark uppercase tracking-wide">
                    Vault file
                  </div>
                  <div
                    className="text-sm font-semibold text-neuro-text-primary-light dark:text-neuro-text-primary-dark truncate max-w-[320px] sm:max-w-[420px]"
                    title={hasVaultPath ? vaultPath : 'No vault file selected'}
                  >
                    {hasVaultPath ? vaultPath : 'No vault file available'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onCopyPath}
                  disabled={!hasVaultPath}
                  className="neuro-card px-4 py-2 rounded-neuro text-xs font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-40"
                >
                  Copy path
                </button>
              </div>
            </div>

            <div className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm">
              <div className="flex items-center gap-3">
                <KeyIcon size={26} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
                <div>
                  <div className="text-sm font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark uppercase tracking-wide">
                    Recovery
                  </div>
                  <p className="text-sm text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-semibold">
                    Export the active recovery phrase for safekeeping
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onExportMnemonic}
                disabled={!isVaultUnlocked}
                className="mt-4 neuro-card px-5 py-3 rounded-neuro text-sm font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-40"
              >
                Export mnemonic
              </button>
            </div>
          </div>
        </section>

        <section className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
              <LockIcon size={32} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">Security Controls</h3>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold text-sm">
                Manage session security and device safety
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-sm dark:shadow-neuro-dark-sm flex items-center justify-between gap-4">
              <div>
                <div className="text-base font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark mb-1">
                  Lock vault
                </div>
                <div className="text-sm text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-semibold">
                  End the current session and require credentials to reopen
                </div>
              </div>
              <button
                type="button"
                onClick={onLock}
                disabled={!isVaultUnlocked || lockPending}
                className="neuro-card px-5 py-2.5 rounded-neuro text-sm font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-40"
              >
                {lockPending ? 'Locking…' : 'Lock now'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark border-2 border-red-500/30">
          <div className="flex items-center gap-4 mb-7">
            <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
              <AlertIcon size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
          </div>
          <div className="p-5 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-inset dark:shadow-neuro-dark-inset border-l-4 border-red-500">
            <div>
              <div className="text-base font-bold text-red-600 dark:text-red-400 mb-1.5">Delete vault</div>
              <div className="text-sm text-red-600/80 dark:text-red-400/80 font-semibold">
                Securely erase the vault file from disk. This action cannot be undone.
              </div>
            </div>
            <button
              type="button"
              onClick={onDeleteVault}
              disabled={!hasVaultPath || deletePending}
              className={`neuro-card px-5 py-2.5 rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark text-sm font-bold transition ${!hasVaultPath || deletePending ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              {deletePending ? 'Deleting…' : 'Delete vault'}
            </button>
          </div>
        </section>

        <section className="bg-neuro-bg-light dark:bg-neuro-bg-dark rounded-neuro-lg p-7 shadow-neuro-light dark:shadow-neuro-dark">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light dark:shadow-neuro-dark flex items-center justify-center">
              <InfoIcon size={32} className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
            </div>
            <h3 className="text-3xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">About Micrypt</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-inset dark:shadow-neuro-dark-inset">
              <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">Version</span>
              <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold">1.0.0</span>
            </div>
            <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-inset dark:shadow-neuro-dark-inset">
              <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">Build</span>
              <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold">2025</span>
            </div>
            <div className="flex justify-between p-4 rounded-neuro bg-neuro-bg-light dark:bg-neuro-bg-dark shadow-neuro-light-inset dark:shadow-neuro-dark-inset">
              <span className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-bold">License</span>
              <span className="text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-bold">MIT</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
