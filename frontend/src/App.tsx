import { useState, useEffect } from 'react';
import type { ClipboardEvent } from 'react';
import {
  CreateVault,
  UnlockVault,
  IsVaultUnlocked,
  GetRecoveryMnemonic,
  RecoverVaultWithSeed,
  LockVault,
  SelectVaultDirectory,
  DeleteVault,
  SelectVaultFile,
  VaultExistsAtPath,
  GetHomeDirectory,
  GetVaultStats,
  RequestRecoveryMnemonic,
} from '../wailsjs/go/main/App';
import { useTheme } from './hooks/useTheme';
import { LockIcon, CatIcon, ShieldIcon, KeyIcon } from './components/Icons';
import Sidebar from './components/Sidebar';
import FilesView from './components/FilesView';
import CategoriesView from './components/CategoriesView';
import StatisticsView from './components/StatisticsView';
import SettingsView from './components/SettingsView';
import EntropyCollector from './components/EntropyCollector';
import DragRegion from './components/DragRegion';

type View = 'files' | 'categories' | 'statistics' | 'settings';
type Screen = 'welcome' | 'unlock' | 'create' | 'entropy' | 'seed' | 'recover' | 'main';

type KeyfilePayload = {
  name: string;
  data: string;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    let chunk = '';
    for (let j = 0; j < sub.length; j++) {
      chunk += String.fromCharCode(sub[j]);
    }
    chunks.push(chunk);
  }
  return window.btoa(chunks.join(''));
};

const parsePimInput = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const createWordSlots = (count: number, seed: string[] = []) => {
  const slots = Array(count).fill('');
  seed.forEach((word, index) => {
    if (index < count) {
      slots[index] = word;
    }
  });
  return slots;
};

const recoverWordOptions = [12];

const algorithms = [
  { id: 0, name: 'AES-256-GCM', description: 'Fast and secure', icon: ShieldIcon },
  { id: 1, name: 'AES + Serpent', description: 'Double encryption', icon: ShieldIcon },
  { id: 2, name: 'AES + Twofish', description: 'Double encryption', icon: ShieldIcon },
  { id: 3, name: 'AES + Twofish + Serpent', description: 'Triple cascade (Maximum security)', icon: KeyIcon },
];

function App() {
  useTheme();
  const [currentView, setCurrentView] = useState<View>('files');
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [createConfirm, setCreateConfirm] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(3);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seedWords, setSeedWords] = useState<string[] | null>(null);
  const [createPIM, setCreatePIM] = useState('');
  const [unlockPIM, setUnlockPIM] = useState('');
  const [createKeyfiles, setCreateKeyfiles] = useState<KeyfilePayload[]>([]);
  const [unlockKeyfiles, setUnlockKeyfiles] = useState<KeyfilePayload[]>([]);
  const [recoverWordMode, setRecoverWordMode] = useState(12);
  const [recoverWords, setRecoverWords] = useState<string[]>(createWordSlots(12));
  const [createVaultPath, setCreateVaultPath] = useState('');
  const [unlockPath, setUnlockPath] = useState('');
  const [recoverPath, setRecoverPath] = useState('');
  const [createPathError, setCreatePathError] = useState('');
  const [unlockPathError, setUnlockPathError] = useState('');
  const [recoverPathError, setRecoverPathError] = useState('');
  const [currentVaultPath, setCurrentVaultPath] = useState('');
  const [lockPending, setLockPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [homeDirectory, setHomeDirectory] = useState('');
  const [seedPromptOpen, setSeedPromptOpen] = useState(false);
  const [seedPromptPassword, setSeedPromptPassword] = useState('');
  const [seedPromptPIM, setSeedPromptPIM] = useState('');
  const [seedPromptError, setSeedPromptError] = useState('');
  const [seedPromptLoading, setSeedPromptLoading] = useState(false);

  const panelClass = 'panel-elevated px-12 py-10 space-y-10';
  const primaryButtonClass = 'btn-primary';
  const mutedButtonClass = 'btn-muted';
  const inputClass = 'input-surface';

  useEffect(() => {
    const init = async () => {
      try {
        const unlocked = await IsVaultUnlocked();
        setIsVaultUnlocked(unlocked);
        if (unlocked) {
          setCurrentScreen('main');
          try {
            const stats = await GetVaultStats();
            setCurrentVaultPath(stats?.vaultPath ?? '');
          } catch (statsErr) {
            console.error('Failed to load initial vault stats:', statsErr);
          }
        }
      } catch (err) {
        console.error('Error checking vault status:', err);
      }
      try {
        const home = await GetHomeDirectory();
        setHomeDirectory(home);
      } catch (err) {
        console.error('Failed to resolve home directory:', err);
      }
    };
    init();
  }, []);

  const resetUnlockForm = () => {
    setUnlockPassword('');
    setUnlockPIM('');
    setUnlockKeyfiles([]);
    setUnlockPath('');
    setUnlockPathError('');
  };

  const resetRecoverForm = () => {
    setRecoverWordMode(12);
    setRecoverWords(createWordSlots(12));
    setRecoverPath('');
    setRecoverPathError('');
  };

  const resetCreateForm = () => {
    setCreatePassword('');
    setCreateConfirm('');
    setCreatePIM('');
    setCreateKeyfiles([]);
    setCreateVaultPath('');
    setCreatePathError('');
  };

  const handleChooseCreatePath = async () => {
    try {
      const path = await SelectVaultDirectory();
      if (!path) {
        return;
      }
      const normalized = path.toLowerCase().endsWith('.mvault') ? path : `${path}.mvault`;
      setCreateVaultPath(normalized);
      const exists = await VaultExistsAtPath(normalized);
      if (exists) {
        setCreatePathError('A vault already exists at this file');
      } else {
        setCreatePathError('');
      }
      setError('');
    } catch (err: any) {
      setError(err?.toString?.() || 'Failed to select vault file');
    }
  };

  const handleChooseUnlockPath = async () => {
    try {
      const filePath = await SelectVaultFile();
      if (!filePath) {
        return;
      }
      const exists = await VaultExistsAtPath(filePath);
      setUnlockPath(filePath);
      if (!exists) {
        setUnlockPathError('No vault file found at this location');
      } else {
        setUnlockPathError('');
      }
      setError('');
    } catch (err: any) {
      setError(err?.toString?.() || 'Failed to select vault file');
    }
  };

  const handleChooseRecoverPath = async () => {
    try {
      const filePath = await SelectVaultFile();
      if (!filePath) {
        return;
      }
      const exists = await VaultExistsAtPath(filePath);
      setRecoverPath(filePath);
      if (!exists) {
        setRecoverPathError('No vault file found at this location');
      } else {
        setRecoverPathError('');
      }
      setError('');
    } catch (err: any) {
      setError(err?.toString?.() || 'Failed to select vault file');
    }
  };

  const handleAddKeyfiles = async (files: FileList | null, setter: React.Dispatch<React.SetStateAction<KeyfilePayload[]>>) => {
    if (!files || files.length === 0) {
      return;
    }
    const additions: KeyfilePayload[] = [];
    for (const file of Array.from(files)) {
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);
      additions.push({ name: file.name, data: base64 });
    }
    setter((prev) => [...prev, ...additions]);
  };

  const handleRemoveKeyfile = (index: number, setter: React.Dispatch<React.SetStateAction<KeyfilePayload[]>>) => {
    setter((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUnlockVault = async () => {
    if (!unlockPassword && unlockKeyfiles.length === 0) {
      setError('Password or keyfile required');
      return;
    }

    setLoading(true);
    setError('');
    setUnlockPathError('');

    try {
      const pimValue = parsePimInput(unlockPIM);
      const keyfileData = unlockKeyfiles.map((item) => item.data);
      if (unlockPath) {
        const exists = await VaultExistsAtPath(unlockPath);
        if (!exists) {
          setUnlockPathError('No vault file found at this location');
          return;
        }
      }
      await UnlockVault(unlockPassword, pimValue, keyfileData, unlockPath || '');
      setIsVaultUnlocked(true);
      setCurrentScreen('main');
      setCurrentView('files');
      const stats = await GetVaultStats().catch(() => null);
      if (stats && stats.vaultPath) {
        setCurrentVaultPath(stats.vaultPath);
      } else if (unlockPath) {
        setCurrentVaultPath(unlockPath);
      } else {
        setCurrentVaultPath('');
      }
      resetUnlockForm();
    } catch (err: any) {
      const message = err?.toString?.() || 'Failed to unlock vault';
      setError(message);
      if (message.toLowerCase().includes('no vault')) {
        setUnlockPathError('No vault file found at this location');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToEntropy = () => {
    if (!createPassword) {
      setError('Please enter a password');
      return;
    }
    if (createPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (createPassword !== createConfirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setCurrentScreen('entropy');
  };

  const handleEntropyComplete = async () => {
    setLoading(true);
    setError('');
    setCreatePathError('');

    try {
      const pimValue = parsePimInput(createPIM);
      const keyfileData = createKeyfiles.map((item) => item.data);
      const vaultPath = await CreateVault(createPassword, selectedAlgorithm, pimValue, keyfileData, createVaultPath);
      setIsVaultUnlocked(true);
      setCurrentVaultPath(vaultPath);
      resetCreateForm();
      try {
        const words = await GetRecoveryMnemonic();
        if (words && words.length > 0) {
          setSeedWords(words);
          setCurrentScreen('seed');
        } else {
          setCurrentScreen('main');
        }
      } catch (mnemonicErr) {
        console.error('Failed to fetch mnemonic:', mnemonicErr);
        setCurrentScreen('main');
      }
      console.log('Vault created at:', vaultPath);
    } catch (err: any) {
      const message = err?.toString?.() || 'Failed to create vault';
      setError(message);
      if (message.toLowerCase().includes('exists')) {
        setCreatePathError('A vault already exists at the selected file.');
      }
      setCurrentScreen('create');
    } finally {
      setLoading(false);
    }
  };

  const applyMnemonicWords = (values: string[]) => {
    const sanitized = values.map((word) => word.trim().toLowerCase()).filter((word) => word.length > 0);
    if (sanitized.length !== 12) {
      setError('Recovery phrase must contain exactly 12 words');
      return false;
    }
    setRecoverWordMode(12);
    setRecoverWords(createWordSlots(12, sanitized));
    setError('');
    return true;
  };

  const handleRecoverModeChange = (count: number) => {
    if (count === recoverWordMode) {
      return;
    }
    setRecoverWords((prev) => createWordSlots(count, prev));
    setRecoverWordMode(count);
    setError('');
  };

  const handleRecoverWordChange = (index: number, value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z]/g, '');
    setRecoverWords((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });
    setError('');
  };

  const handleMnemonicInputPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!text || !text.trim()) {
      return;
    }
    if (text.trim().includes(' ')) {
      event.preventDefault();
      applyMnemonicWords(text.split(/\s+/));
    }
  };

  const handlePasteMnemonic = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setError('Clipboard is empty');
        return;
      }
      applyMnemonicWords(text.split(/\s+/));
    } catch (err: any) {
      setError(err?.toString?.() || 'Unable to access clipboard');
    }
  };

  const handleConfirmSeedExport = async () => {
    if (seedPromptLoading) {
      return;
    }
    if (!seedPromptPassword.trim()) {
      setSeedPromptError('Password required');
      return;
    }
    setSeedPromptLoading(true);
    setSeedPromptError('');
    const pimValue = parsePimInput(seedPromptPIM);
    try {
      const words = await RequestRecoveryMnemonic(seedPromptPassword, pimValue);
      if (!words || words.length === 0) {
        setSeedPromptError('No recovery phrase available');
      } else {
        setSeedWords(words);
        setSeedPromptOpen(false);
        setSeedPromptPassword('');
        setSeedPromptPIM('');
        setCurrentScreen('seed');
      }
    } catch (err: any) {
      setSeedPromptError(err?.toString?.() || 'Incorrect password');
    } finally {
      setSeedPromptLoading(false);
    }
  };

  const handleCancelSeedExport = () => {
    if (seedPromptLoading) {
      return;
    }
    setSeedPromptOpen(false);
    setSeedPromptPassword('');
    setSeedPromptPIM('');
    setSeedPromptError('');
  };

  const handleRecoverWithSeed = async () => {
    const words = recoverWords.map((w) => w.trim().toLowerCase());
    if (words.some((word) => word.length === 0)) {
      setError('Fill every recovery word');
      return;
    }

    setLoading(true);
    setError('');
    setRecoverPathError('');

    try {
      if (recoverPath) {
        const exists = await VaultExistsAtPath(recoverPath);
        if (!exists) {
          setRecoverPathError('No vault file found at this location');
          return;
        }
      }
      const dir = await RecoverVaultWithSeed(words, recoverPath || '');
      setIsVaultUnlocked(true);
      setCurrentScreen('main');
      setCurrentView('files');
      setCurrentVaultPath(dir);
      resetRecoverForm();
    } catch (err: any) {
      const message = err?.toString?.() || 'Failed to recover vault';
      setError(message);
      if (message.toLowerCase().includes('no vault')) {
        setRecoverPathError('No vault file found at this location');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLockVault = async () => {
    if (lockPending || !isVaultUnlocked) {
      return;
    }
    setLockPending(true);
    setError('');
    try {
      await LockVault();
      setIsVaultUnlocked(false);
      setCurrentScreen('welcome');
      setCurrentView('files');
      setCurrentVaultPath('');
      setSeedWords(null);
      resetUnlockForm();
      resetRecoverForm();
    } catch (err: any) {
      setError(err.toString() || 'Failed to lock vault');
    } finally {
      setLockPending(false);
    }
  };

  const handleDeleteVault = async () => {
    if (deletePending) {
      return;
    }
    if (!currentVaultPath) {
      setError('No vault file available to delete');
      return;
    }

    const confirmed = window.confirm('This will permanently erase the vault file. Continue?');
    if (!confirmed) {
      return;
    }

    setDeletePending(true);
    setError('');
    try {
      await DeleteVault();
      setIsVaultUnlocked(false);
      setCurrentScreen('welcome');
      setCurrentView('files');
      setCurrentVaultPath('');
      setSeedWords(null);
      resetUnlockForm();
      resetRecoverForm();
      resetCreateForm();
    } catch (err: any) {
      const message = err?.toString?.() || 'Failed to delete vault';
      setError(message);
      window.alert(message);
    } finally {
      setDeletePending(false);
    }
  };

  const handleCopyVaultPath = async () => {
    if (!currentVaultPath) {
      setError('No vault path available to copy');
      return;
    }
    try {
      await navigator.clipboard.writeText(currentVaultPath);
    } catch (err: any) {
      setError(err?.toString?.() || 'Unable to copy vault path');
    }
  };

  const handleExportMnemonic = async () => {
    setSeedPromptPassword('');
    setSeedPromptPIM('');
    setSeedPromptError('');
    setSeedPromptOpen(true);
  };

  const renderKeyfileList = (entries: KeyfilePayload[], onRemove: (index: number) => void) => {
    if (entries.length === 0) {
      return null;
    }
    return (
      <ul className="mt-3 space-y-2">
        {entries.map((entry, idx) => (
          <li key={`${entry.name}-${idx}`} className="flex items-center justify-between text-sm font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark">
            <span className="truncate pr-4">{entry.name}</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="text-red-500 dark:text-red-400"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'files':
        return <FilesView />;
      case 'categories':
        return <CategoriesView />;
      case 'statistics':
        return <StatisticsView />;
      case 'settings':
        return (
          <SettingsView
            isVaultUnlocked={isVaultUnlocked}
            onLock={handleLockVault}
            lockPending={lockPending}
            vaultPath={currentVaultPath}
            onCopyPath={handleCopyVaultPath}
            onExportMnemonic={handleExportMnemonic}
            onDeleteVault={handleDeleteVault}
            deletePending={deletePending}
          />
        );
      default:
        return <FilesView />;
    }
  };

  const renderSeedPrompt = () => {
    if (!seedPromptOpen) {
      return null;
    }
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/85 shadow-2xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Confirm Identity</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Re-enter your vault password to reveal the recovery phrase.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Password
              </label>
              <input
                type="password"
                value={seedPromptPassword}
                onChange={(e) => {
                  setSeedPromptPassword(e.target.value);
                  setSeedPromptError('');
                }}
                disabled={seedPromptLoading}
                className="input-surface"
                placeholder="Enter vault password"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                PIM (optional)
              </label>
              <input
                type="number"
                min="0"
                value={seedPromptPIM}
                onChange={(e) => setSeedPromptPIM(e.target.value)}
                disabled={seedPromptLoading}
                className="input-surface"
                placeholder="Personal iterations multiplier"
              />
            </div>
          </div>
          {seedPromptError && (
            <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400">
              {seedPromptError}
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-3">
            <button
              type="button"
              onClick={handleCancelSeedExport}
              disabled={seedPromptLoading}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSeedExport}
              disabled={seedPromptLoading}
              className="btn-primary w-full sm:w-auto px-6 py-2.5"
            >
              {seedPromptLoading ? 'Verifying…' : 'Reveal Phrase'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (currentScreen === 'welcome') {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DragRegion />
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className={`${panelClass} text-center intro-animation`}>
            <div className="flex justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-300 text-white shadow-lg shadow-slate-400/40 dark:bg-slate-700 dark:shadow-black/40">
                <CatIcon size={42} />
              </span>
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-semibold text-slate-900 dark:text-white tracking-tight">Micryptlol</h1>
              <p className="text-base text-slate-500 dark:text-slate-400">
                Offline first vault with Argon2id, keyfile and PIM support, and mnemonic recovery. No network connection required.
              </p>
            </div>
            <div className="grid gap-3">
              <button
                onClick={() => {
                  setCurrentScreen('unlock');
                  setError('');
                  resetUnlockForm();
                }}
                className={`${primaryButtonClass} justify-between px-7 py-4 text-base`}
              >
                <span>Unlock existing vault</span>
                <LockIcon size={20} />
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('create');
                  setSeedWords(null);
                  setError('');
                  resetCreateForm();
                }}
                className={`${mutedButtonClass} justify-between px-7 py-4 text-base`}
              >
                <span>Create new vault</span>
                <ShieldIcon size={20} />
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('recover');
                  resetRecoverForm();
                  setError('');
                }}
                className={`${mutedButtonClass} justify-between px-7 py-4 text-base`}
              >
                <span>Recover with seed phrase</span>
                <KeyIcon size={20} />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-6 py-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                AES-256 · XChaCha20 · Argon2id · Offline
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'unlock') {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DragRegion />
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className={`${panelClass} space-y-6 text-left scroll-region`}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-200">
                  <LockIcon size={24} />
                </span>
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Unlock vault</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Enter your password, keyfiles, or PIM to continue.</p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => {
                    setUnlockPassword(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleUnlockVault()}
                  placeholder="Enter vault password"
                  disabled={loading}
                  className={`${inputClass} mt-2`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">PIM (optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={unlockPIM}
                    onChange={(e) => {
                      setUnlockPIM(e.target.value);
                      setError('');
                    }}
                    placeholder="Personal iterations multiplier"
                    disabled={loading}
                    className={`${inputClass} mt-2`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Keyfiles</label>
                  <input
                    type="file"
                    multiple
                    onChange={async (e) => {
                      await handleAddKeyfiles(e.target.files, setUnlockKeyfiles);
                      if (e.target.value) {
                        e.target.value = '';
                      }
                    }}
                    disabled={loading}
                    className="mt-2 text-sm text-slate-600 dark:text-slate-300"
                  />
                  {renderKeyfileList(unlockKeyfiles, (index) => handleRemoveKeyfile(index, setUnlockKeyfiles))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vault file</label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                    <button
                      type="button"
                      onClick={handleChooseUnlockPath}
                      disabled={loading}
                      className={`${mutedButtonClass} md:w-auto w-full justify-center`}
                    >
                      Choose vault file
                    </button>
                    {unlockPath ? (
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate md:max-w-xs lg:max-w-sm" title={unlockPath}>
                        {unlockPath}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Leave empty to pick when prompted
                      </span>
                    )}
                  </div>
                  {unlockPathError && (
                    <p className="text-xs font-semibold text-red-500 dark:text-red-400">{unlockPathError}</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-300/40 bg-red-50/60 dark:border-red-500/40 dark:bg-red-900/20 px-5 py-3 text-sm font-semibold text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
                <button
                  onClick={handleUnlockVault}
                  disabled={loading}
                  className={`${primaryButtonClass} w-full md:w-auto px-8`}
                >
                  {loading ? 'Unlocking…' : 'Unlock vault'}
                </button>
                <button
                  onClick={() => {
                    setCurrentScreen('welcome');
                    resetUnlockForm();
                    setError('');
                  }}
                  className={`${mutedButtonClass} w-full md:w-auto`}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'create') {
    return (
      <div className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <DragRegion />
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <div className={`${panelClass} space-y-6 text-left scroll-region`}>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-300">
                  <ShieldIcon size={24} />
                </span>
                <div>
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Create new vault</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Select algorithm, define your password, and optionally load keyfiles and PIM.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {algorithms.map((algo) => {
                const Icon = algo.icon;
                const selected = selectedAlgorithm === algo.id;
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithm(algo.id)}
                    className={`flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${selected ? 'border-blue-400 bg-blue-50/70 dark:bg-blue-900/30 dark:border-blue-400 text-blue-800 dark:text-blue-100' : 'border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:border-blue-300/70 hover:text-slate-900 dark:hover:text-white'}`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/80 text-blue-600 dark:bg-blue-900/40 dark:text-blue-200">
                      <Icon size={22} />
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">{algo.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{algo.description}</div>
                    </div>
                    {selected && <span className="badge-tonal">Selected</span>}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Vault file</label>
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row md:items-center md:gap-3">
                  <button
                    type="button"
                    onClick={handleChooseCreatePath}
                    disabled={loading}
                    className={`${mutedButtonClass} w-full md:w-auto justify-center`}
                  >
                    Choose vault file
                  </button>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 md:max-w-sm truncate" title={createVaultPath || homeDirectory}>
                    {createVaultPath
                      ? `${createVaultPath}`
                      : homeDirectory
                      ? `Default: ${homeDirectory}/MicryptVault.mvault`
                      : "You'll be asked for a vault file location during creation"}
                  </span>
                </div>
                {createPathError && (
                  <p className="text-xs font-semibold text-red-500 dark:text-red-400">{createPathError}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Master password</label>
              <input
                type="password"
                value={createPassword}
                onChange={(e) => {
                  setCreatePassword(e.target.value);
                  setError('');
                }}
                placeholder="Choose a strong password"
                disabled={loading}
                className={inputClass}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {createPassword.length === 0
                  ? 'Minimum 8 characters required'
                  : createPassword.length < 8
                  ? `${8 - createPassword.length} more characters needed`
                  : `✓ Password strength: ${createPassword.length < 12 ? 'Good' : createPassword.length < 16 ? 'Strong' : 'Very strong'}`}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Confirm password</label>
              <input
                type="password"
                value={createConfirm}
                onChange={(e) => {
                  setCreateConfirm(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleProceedToEntropy()}
                placeholder="Re-enter password"
                disabled={loading}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">PIM (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={createPIM}
                  onChange={(e) => {
                    setCreatePIM(e.target.value);
                    setError('');
                  }}
                  placeholder="Personal iterations multiplier"
                  disabled={loading}
                  className={`${inputClass} mt-2`}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Keyfiles</label>
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    await handleAddKeyfiles(e.target.files, setCreateKeyfiles);
                    if (e.target.value) {
                      e.target.value = '';
                    }
                  }}
                  disabled={loading}
                  className="mt-2 text-sm text-slate-600 dark:text-slate-300"
                />
                {renderKeyfileList(createKeyfiles, (index) => handleRemoveKeyfile(index, setCreateKeyfiles))}
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-300/40 bg-red-50/60 dark:border-red-500/40 dark:bg-red-900/20 px-5 py-3 text-sm font-semibold text-red-600 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-1">
              <button
                onClick={handleProceedToEntropy}
                disabled={loading}
                className={`${primaryButtonClass} w-full md:w-auto px-8`}
              >
                Continue
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('welcome');
                  resetCreateForm();
                  setError('');
                }}
                className={`${mutedButtonClass} w-full md:w-auto`}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'entropy') {
    return <EntropyCollector onComplete={handleEntropyComplete} />;
  }

  if (currentScreen === 'recover') {
    return (
      <div className="flex items-center justify-center h-screen bg-neuro-bg-light dark:bg-neuro-bg-dark scroll-region py-8 px-4">
        <div className="w-full max-w-2xl">
          <div className="neuro-card rounded-neuro-lg p-10 space-y-6">
            <div className="text-center space-y-4">
              <KeyIcon size={48} className="mx-auto text-neuro-text-primary-light dark:text-neuro-text-primary-dark" />
              <h2 className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark tracking-tight">
                Recover Vault
              </h2>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-medium">
                Enter your 12-word recovery phrase to unlock the vault offline.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                Vault file
              </label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={handleChooseRecoverPath}
                    disabled={loading}
                    className="neuro-card hover:neuro-card px-4 py-3 rounded-neuro text-sm font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-50"
                  >
                    Choose vault file
                  </button>
                  {recoverPath ? (
                    <span className="text-xs font-semibold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark truncate sm:max-w-xs" title={recoverPath}>
                      {recoverPath}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                      Leave blank to pick during recovery
                    </span>
                  )}
                </div>
                {recoverPathError && (
                  <p className="text-xs font-semibold text-red-500 dark:text-red-400">{recoverPathError}</p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                    Seed phrase
                  </span>
                  <p className="text-sm font-medium text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                    Enter each word exactly as shown on your recovery card
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {recoverWordOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleRecoverModeChange(option)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-full text-sm font-bold border transition ${
                        recoverWordMode === option
                          ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30'
                          : 'bg-white/70 dark:bg-slate-900/50 text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark border-slate-200/70 dark:border-slate-800 hover:border-blue-300/70'
                      }`}
                    >
                      {option} words
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handlePasteMnemonic}
                    disabled={loading}
                    className="neuro-card px-4 py-2 rounded-neuro text-sm font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-50"
                  >
                    Paste from clipboard
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recoverWords.map((word, index) => {
                  const filled = word.length > 0;
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                        filled
                          ? 'border-blue-500/40 bg-blue-500/5'
                          : 'border-slate-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50'
                      }`}
                    >
                      <span className="w-7 text-center text-xs font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      <input
                        value={word}
                        onChange={(e) => handleRecoverWordChange(index, e.target.value)}
                        onPaste={handleMnemonicInputPaste}
                        spellCheck={false}
                        autoComplete="off"
                        disabled={loading}
                        className="flex-1 bg-transparent border-0 outline-none text-sm font-semibold text-neuro-text-primary-light dark:text-neuro-text-primary-dark placeholder-neuro-text-muted-light dark:placeholder-neuro-text-muted-dark"
                        placeholder="word"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {error && (
              <div className="px-5 py-4 rounded-neuro neuro-inset border-l-4 border-red-500">
                <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
              </div>
            )}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleRecoverWithSeed}
                disabled={loading}
                className="neuro-card hover:neuro-card w-full px-6 py-4 text-base font-bold rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recovering...' : 'Recover Vault'}
              </button>
              <button
                onClick={() => {
                  setCurrentScreen('welcome');
                  resetRecoverForm();
                  setError('');
                }}
                className="w-full px-6 py-3 text-sm font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark hover:text-neuro-text-primary-light dark:hover:text-neuro-text-primary-dark transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'seed' && seedWords) {
    return (
      <div className="flex items-center justify-center h-screen bg-neuro-bg-light dark:bg-neuro-bg-dark scroll-region py-8 px-4">
        <DragRegion />
        <div className="w-full max-w-3xl">
          <div className="neuro-card rounded-neuro-lg p-10 space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-neuro-text-primary-light dark:text-neuro-text-primary-dark tracking-tight">Recovery Seed Phrase</h2>
              <p className="text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark font-medium">Store these words securely; they are required to recover your vault.</p>
            </div>
            <div className="neuro-inset rounded-neuro p-6">
              <div className="grid grid-cols-3 gap-4 text-neuro-text-primary-light dark:text-neuro-text-primary-dark font-mono text-base">
                {seedWords.map((word, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-neuro-text-secondary-light dark:text-neuro-text-secondary-dark w-6 text-right">{(idx + 1).toString().padStart(2, '0')}.</span>
                    <span className="font-bold text-lg">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setSeedWords(null);
                  setCurrentScreen('main');
                }}
                className="neuro-card hover:neuro-card px-8 py-3 text-base font-bold rounded-neuro text-neuro-text-primary-light dark:text-neuro-text-primary-dark"
              >
                I've Saved My Seed Phrase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'main') {
    return (
      <>
        {renderSeedPrompt()}
        <div className="flex h-screen bg-neuro-bg-light dark:bg-neuro-bg-dark">
          <DragRegion />
          <Sidebar currentView={currentView} onViewChange={setCurrentView} isVaultUnlocked={isVaultUnlocked} />
          <div className="flex-1 overflow-hidden">
            {renderView()}
          </div>
        </div>
      </>
    );
  }

  return null;
}

export default App;
