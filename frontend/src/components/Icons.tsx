interface IconProps {
  className?: string;
  size?: number;
}

export const FilesIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M12 8L12 40C12 42 13 43 15 43L33 43C35 43 36 42 36 40L36 16L28 8L12 8Z"
          fill="currentColor" opacity="0.2"/>
    <path d="M28 8L28 16L36 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 8L28 8L36 16L36 40C36 42 35 43 33 43L15 43C13 43 12 42 12 40Z"
          stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
  </svg>
);

export const CategoriesIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="8" width="14" height="14" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="26" y="8" width="14" height="14" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="8" y="26" width="14" height="14" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="26" y="26" width="14" height="14" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="8" y="8" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="26" y="8" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="8" y="26" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="26" y="26" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const StatisticsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="10" y="28" width="6" height="12" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="21" y="20" width="6" height="20" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="32" y="12" width="6" height="28" rx="1" fill="currentColor" opacity="0.2"/>
    <rect x="10" y="28" width="6" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="21" y="20" width="6" height="20" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="32" y="12" width="6" height="28" rx="1" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const SettingsIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="6" fill="currentColor" opacity="0.2"/>
    <path d="M24 8L26.5 14L32 12L30 18L36 20L30 22L32 28L26.5 26L24 32L21.5 26L16 28L18 22L12 20L18 18L16 12L21.5 14Z"
          fill="currentColor" opacity="0.15"/>
    <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M24 8L26.5 14L32 12L30 18L36 20L30 22L32 28L26.5 26L24 32L21.5 26L16 28L18 22L12 20L18 18L16 12L21.5 14Z"
          stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

export const VaultIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="12" width="32" height="28" rx="2" fill="currentColor" opacity="0.15"/>
    <rect x="8" y="12" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="26" r="6" fill="currentColor" opacity="0.2"/>
    <circle cx="30" cy="26" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="30" cy="26" r="2" fill="currentColor"/>
    <line x1="28" y1="28" x2="26" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const LockIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="12" y="22" width="24" height="18" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="12" y="22" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 22L16 16C16 12 18 8 24 8C30 8 32 12 32 16L32 22"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="24" cy="31" r="3" fill="currentColor"/>
    <line x1="24" y1="34" x2="24" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const UnlockIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="12" y="22" width="24" height="18" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="12" y="22" width="24" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 22L16 16C16 12 18 8 24 8C30 8 32 12 32 14"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="24" cy="31" r="3" fill="currentColor"/>
    <line x1="24" y1="34" x2="24" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlusIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3"/>
    <line x1="24" y1="14" x2="24" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const TrashIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M14 16L14 38C14 40 15 42 18 42L30 42C33 42 34 40 34 38L34 16"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M10 16L38 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 16L20 10L28 10L28 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <line x1="20" y1="24" x2="20" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="28" y1="24" x2="28" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DownloadIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 10L24 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 26L24 36L34 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M10 38L38 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const UploadIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 36L24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M14 20L24 10L34 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M10 38L38 38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SearchIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="28" y1="28" x2="38" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ShieldIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 6L10 12L10 22C10 32 16 40 24 42C32 40 38 32 38 22L38 12L24 6Z"
          fill="currentColor" opacity="0.2"/>
    <path d="M24 6L10 12L10 22C10 32 16 40 24 42C32 40 38 32 38 22L38 12L24 6Z"
          stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <path d="M18 24L22 28L30 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const KeyIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="32" cy="16" r="8" fill="currentColor" opacity="0.2"/>
    <circle cx="32" cy="16" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="32" cy="16" r="3" fill="currentColor"/>
    <path d="M26 22L10 38L14 42L18 38L20 40L24 36L22 34L26 30Z"
          stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
  </svg>
);

export const BriefcaseIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="6" y="16" width="36" height="24" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="6" y="16" width="36" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M16 16L16 12C16 10 17 8 19 8L29 8C31 8 32 10 32 12L32 16"
          stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M6 24L42 24" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

export const AlertIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M24 6L42 38L6 38L24 6Z" fill="currentColor" opacity="0.2"/>
    <path d="M24 6L42 38L6 38L24 6Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <line x1="24" y1="18" x2="24" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="32" r="2" fill="currentColor"/>
  </svg>
);

export const InfoIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <circle cx="24" cy="24" r="16" fill="currentColor" opacity="0.2"/>
    <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="24" cy="16" r="2" fill="currentColor"/>
    <line x1="24" y1="22" x2="24" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DocumentIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M14 6L14 42L34 42L34 16L24 6L14 6Z" fill="currentColor" opacity="0.2"/>
    <path d="M24 6L24 16L34 16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 6L24 6L34 16L34 42L14 42Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <line x1="20" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="20" y1="30" x2="28" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ImageIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="10" y="10" width="28" height="28" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="10" y="10" width="28" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="18" cy="18" r="3" fill="currentColor"/>
    <path d="M12 34L20 26L27 33L32 28L38 34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const VideoIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="12" width="28" height="24" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="8" y="12" width="28" height="24" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M36 18L40 16C41 15.5 42 16 42 17V31C42 32 41 32.5 40 32L36 30Z" fill="currentColor" opacity="0.2"/>
    <path d="M36 18L40 16C41 15.5 42 16 42 17V31C42 32 41 32.5 40 32L36 30V18Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <path d="M22 19L22 29L30 24Z" fill="currentColor"/>
    <path d="M22 19L22 29L30 24Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const AudioIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="10" y="12" width="20" height="24" rx="4" fill="currentColor" opacity="0.2"/>
    <rect x="10" y="12" width="20" height="24" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M30 20L38 18V30C38 33 36 35 33 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="32" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="20" cy="32" r="2" fill="currentColor"/>
  </svg>
);

export const CodeIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="8" width="32" height="32" rx="4" fill="currentColor" opacity="0.15"/>
    <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M18 18L12 24L18 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M30 18L36 24L30 30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 34L26 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const CertificateIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="12" y="6" width="24" height="28" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="12" y="6" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="24" cy="18" r="6" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="24" cy="18" r="2" fill="currentColor"/>
    <path d="M18 26L18 40L24 36L30 40L30 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArchiveIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <rect x="8" y="10" width="32" height="10" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="8" y="10" width="32" height="10" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="10" y="20" width="28" height="18" rx="2" fill="currentColor" opacity="0.2"/>
    <rect x="10" y="20" width="28" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <rect x="20" y="24" width="8" height="4" rx="1" fill="currentColor"/>
  </svg>
);

export const FolderIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
    <path d="M8 14C8 12 9 11 11 11L19 11L23 15L37 15C39 15 40 16 40 18L40 35C40 37 39 38 37 38L11 38C9 38 8 37 8 35L8 14Z" fill="currentColor" opacity="0.2"/>
    <path d="M8 14C8 12 9 11 11 11L19 11L23 15L37 15C39 15 40 16 40 18L40 35C40 37 39 38 37 38L11 38C9 38 8 37 8 35L8 14Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/>
  </svg>
);

export const CatIcon = ({ className = '', size = 24 }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    className={className}
  >
    <path
      d="M10 18C10 13 13 8 18 8L24 12L30 8C35 8 38 13 38 18V30C38 36 33 40 27 40H21C15 40 10 36 10 30V18Z"
      fill="currentColor"
      opacity="0.2"
    />
    <path
      d="M18 18L16 16L14 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M34 18L32 16L30 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M20 26C21 28 23 29 24 29C25 29 27 28 28 26"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 18C10 13 13 8 18 8L24 12L30 8C35 8 38 13 38 18V30C38 36 33 40 27 40H21C15 40 10 36 10 30V18Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);
