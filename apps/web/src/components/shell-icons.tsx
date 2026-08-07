/**
 * AppShell/CabinetShell uchun minimal SVG ikonkalar to'plami.
 * Loyihada icon kutubxonasi yo'q (bundle yengil bo'lsin) — mavjud
 * qo'lda-chizilgan SVG naqshiga mos (masalan vacancy-card.tsx belgisi).
 * Barchasi 20x20 viewBox, stroke-based, currentColor orqali rangni meros oladi.
 */
import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(children: ReactNode, props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const RouteIcon = (p: IconProps) =>
  base(<path d="M4 17c2 0 2-4 4-4s2 4 4 4 2-8 4-8" />, p);

export const BookIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v14H5.5A1.5 1.5 0 0 0 4 18.5v-14Z" />
      <path d="M4 15.5A1.5 1.5 0 0 1 5.5 14H16" />
    </>,
    p,
  );

export const BriefcaseIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="6" width="15" height="10.5" rx="1.8" />
      <path d="M7 6V4.8A1.8 1.8 0 0 1 8.8 3h2.4A1.8 1.8 0 0 1 13 4.8V6" />
    </>,
    p,
  );

export const HeartIcon = (p: IconProps) =>
  base(
    <path d="M10 17S3 12.4 3 7.8A3.8 3.8 0 0 1 10 5.4a3.8 3.8 0 0 1 7 2.4C17 12.4 10 17 10 17Z" />,
    p,
  );

export const BellIcon = (p: IconProps) =>
  base(
    <>
      <path d="M5 8a5 5 0 0 1 10 0c0 4 1.5 5 1.5 5h-13S5 12 5 8Z" />
      <path d="M8.2 16a1.8 1.8 0 0 0 3.6 0" />
    </>,
    p,
  );

export const GearIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4M15.1 15.1l-1.4-1.4M6.3 6.3 4.9 4.9" />
    </>,
    p,
  );

export const SearchIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="9" cy="9" r="6" />
      <path d="m17 17-3.5-3.5" />
    </>,
    p,
  );

export const CloseIcon = (p: IconProps) => base(<path d="M5 5l10 10M15 5 5 15" />, p);

export const MenuIcon = (p: IconProps) => base(<path d="M4 6h12M4 10h12M4 14h12" />, p);

export const MicIcon = (p: IconProps) =>
  base(
    <>
      <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" />
      <path d="M4.5 9.5A5.5 5.5 0 0 0 10 15a5.5 5.5 0 0 0 5.5-5.5M10 15v2.5" />
    </>,
    p,
  );

export const DashboardIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.2" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.2" />
    </>,
    p,
  );

export const ClipboardIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4" y="3.5" width="12" height="14" rx="1.5" />
      <path d="M7.5 3.5V3a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12.5 3v.5" />
      <path d="M7 9h6M7 12.5h6" />
    </>,
    p,
  );

export const UsersIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="7.2" cy="7" r="2.6" />
      <path d="M2.5 17c0-3 2.1-4.8 4.7-4.8S12 14 12 17" />
      <circle cx="14.5" cy="7.5" r="2.2" />
      <path d="M13.5 12.4c2.3.2 4 1.9 4 4.6" />
    </>,
    p,
  );

export const WalletIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="5" width="15" height="10.5" rx="1.8" />
      <path d="M2.5 8.5h15" />
      <circle cx="14" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const StarIcon = (p: IconProps) =>
  base(<path d="m10 2.8 2.2 4.7 5.1.6-3.8 3.6.9 5.1L10 14.3l-4.4 2.5.9-5.1-3.8-3.6 5.1-.6L10 2.8Z" />, p);

export const VideoIcon = (p: IconProps) =>
  base(
    <>
      <rect x="2.5" y="5" width="11" height="10" rx="1.8" />
      <path d="M13.5 9 17.5 6.5v7L13.5 11" />
    </>,
    p,
  );

export const SlidersIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 6h12M4 10h12M4 14h12" />
      <circle cx="8" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="10" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="7" cy="14" r="1.6" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const ShieldIcon = (p: IconProps) =>
  base(<path d="M10 2.5 16.5 5v4.8c0 4.2-2.8 6.9-6.5 7.7-3.7-.8-6.5-3.5-6.5-7.7V5L10 2.5Z" />, p);

export const BuildingIcon = (p: IconProps) =>
  base(
    <>
      <rect x="4" y="2.5" width="9" height="15" rx="1" />
      <path d="M13 8h3v9.5h-3M6.5 6h2M6.5 9h2M6.5 12h2" />
    </>,
    p,
  );

export const LogIcon = (p: IconProps) =>
  base(
    <>
      <path d="M5 3h10v14H5z" />
      <path d="M7.5 6.5h5M7.5 9.5h5M7.5 12.5h3" />
    </>,
    p,
  );

export const UserIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="10" cy="6.8" r="3.3" />
      <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </>,
    p,
  );

export const ChevronDownIcon = (p: IconProps) => base(<path d="m5 7.5 5 5 5-5" />, p);

export const ChevronRightIcon = (p: IconProps) => base(<path d="m8 5 5 5-5 5" />, { strokeWidth: 2, ...p });

export const ArrowLeftIcon = (p: IconProps) =>
  base(<path d="M15.5 10h-11M8.5 5.5 4 10l4.5 4.5" />, { strokeWidth: 1.9, ...p });

export const CheckIcon = (p: IconProps) => base(<path d="m5 10.5 3.2 3L15 6.5" />, { strokeWidth: 2.3, ...p });

export const ShareIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="15" cy="5" r="2" />
      <circle cx="15" cy="15" r="2" />
      <circle cx="5" cy="10" r="2" />
      <path d="m6.8 9 6.4-3.2M6.8 11l6.4 3.2" />
    </>,
    p,
  );

export const AlertIcon = (p: IconProps) =>
  base(
    <>
      <path d="M10 4.6 17 16H3l7-11.4Z" />
      <path d="M10 8.8v3M10 13.8h.01" />
    </>,
    { strokeWidth: 1.9, ...p },
  );

export const RefreshIcon = (p: IconProps) =>
  base(
    <>
      <path d="M15.5 8A5.5 5.5 0 0 0 5.4 6.3" />
      <path d="M4.5 12A5.5 5.5 0 0 0 14.6 13.7" />
      <path d="M5.2 3.5v3h3M14.8 16.5v-3h-3" />
    </>,
    p,
  );

export const PlayIcon = (p: IconProps) =>
  base(<path d="M7.5 5.5v9l7-4.5-7-4.5Z" fill="currentColor" stroke="none" />, p);

export const FullscreenIcon = (p: IconProps) => base(<path d="M4 7.5V4h3.5M16 12.5V16h-3.5M16 7.5V4h-3.5M4 12.5V16h3.5" />, p);

export const AudioIcon = (p: IconProps) =>
  base(
    <>
      <path d="M5 8v4h2.5L11 15V5L7.5 8H5Z" />
      <path d="M13.5 7.8a3 3 0 0 1 0 4.4" />
    </>,
    p,
  );

export const LockIcon = (p: IconProps) =>
  base(
    <>
      <rect x="5" y="9" width="10" height="7" rx="2" />
      <path d="M7.5 9V7a2.5 2.5 0 0 1 5 0v2" />
    </>,
    p,
  );

export const SunIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 3v1.6M10 15.4V17M17 10h-1.6M4.6 10H3M15 5l-1.1 1.1M6.1 13.9 5 15M15 15l-1.1-1.1M6.1 6.1 5 5" />
    </>,
    p,
  );

export const MoonIcon = (p: IconProps) => base(<path d="M15.5 11.6A5.8 5.8 0 0 1 8.4 4.5a6 6 0 1 0 7.1 7.1Z" />, p);

export const ContrastIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 3.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" stroke="none" />
    </>,
    p,
  );

export const EditIcon = (p: IconProps) => base(<path d="M13.2 4.3 15.7 6.8 7.5 15H5v-2.5l8.2-8.2Z" />, p);

export const SendIcon = (p: IconProps) => base(<path d="M4.5 10 16 5l-4 11-2.2-4.4L4.5 10Z" />, { strokeWidth: 1.9, ...p });

export const SparkIcon = (p: IconProps) => base(<path d="M10 3.5 11.6 8 16 9.6 11.6 11.2 10 15.6 8.4 11.2 4 9.6 8.4 8 10 3.5Z" />, p);

export const ChartIcon = (p: IconProps) => base(<path d="M4 16V9M8.6 16V4.5M13.2 16v-4.5M17 16h-14" />, p);

export const EyeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M2.6 10S5.4 5.4 10 5.4 17.4 10 17.4 10 14.6 14.6 10 14.6 2.6 10 2.6 10Z" />
      <circle cx="10" cy="10" r="2.2" />
    </>,
    p,
  );

export const EyeOffIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4.2 5.6C2.9 6.9 2.1 8.4 2.1 8.4s2.8 4.6 7.4 4.6c1.3 0 2.4-.3 3.4-.8" />
      <path d="M15.3 11.3c.9-1 1.4-1.9 1.4-1.9S13.9 4.8 9.3 4.8c-.5 0-1 .1-1.5.2" />
      <path d="m4 4 12 12" />
    </>,
    p,
  );

export const DownloadIcon = (p: IconProps) => base(<path d="M10 4v8M6.5 9 10 12.5 13.5 9M4.5 15.5h11" />, p);

export const AttachIcon = (p: IconProps) =>
  base(<path d="M13.5 6.5 8 12a2.1 2.1 0 0 0 3 3l5.5-5.5a4.2 4.2 0 0 0-6-6L5 9a6.3 6.3 0 0 0 9 9l4-4" />, p);

export const DragIcon = (p: IconProps) =>
  base(<path d="M7 6h.01M7 10h.01M7 14h.01M13 6h.01M13 10h.01M13 14h.01" />, { strokeWidth: 1.9, ...p });

export const PhoneIcon = (p: IconProps) =>
  base(<path d="M4.5 5.5c0 6 4 10 10 10l1.5-2.5-3-2-1.5 1.5a9 9 0 0 1-4-4L9 7 7 4 4.5 5.5Z" />, { strokeWidth: 1.9, ...p });

export const MoreIcon = (p: IconProps) => base(<path d="M10 5.5h.01M10 10h.01M10 14.5h.01" />, { strokeWidth: 2, ...p });

export const PlusIcon = (p: IconProps) => base(<path d="M10 4.5v11M4.5 10h11" />, { strokeWidth: 1.9, ...p });

export const InfoIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 9v4M10 6.8h.01" />
    </>,
    { strokeWidth: 1.7, ...p },
  );

export const HomeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3.5 9.5 10 4l6.5 5.5" />
      <path d="M5.5 8v8h9V8" />
      <path d="M8 16v-4.5h4V16" />
    </>,
    p,
  );

export const WifiOffIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 7.5a12 12 0 0 1 3.6-2.2M16 7.5a12 12 0 0 0-3-2" />
      <path d="M6.8 10.8a7.6 7.6 0 0 1 2.2-1.2M13.2 10.8a7.6 7.6 0 0 0-1.6-1" />
      <path d="M9 13.8a3.6 3.6 0 0 1 2-.6" />
      <path d="M10 16.2h.01" />
      <path d="M2.5 2.5l15 15" />
    </>,
    { strokeWidth: 1.6, ...p },
  );

export const LinkIcon = (p: IconProps) =>
  base(
    <>
      <path d="M8.5 11.5a3.2 3.2 0 0 0 4.6.1l2.3-2.3a3.2 3.2 0 0 0-4.6-4.6l-1.3 1.3" />
      <path d="M11.5 8.5a3.2 3.2 0 0 0-4.6-.1l-2.3 2.3a3.2 3.2 0 0 0 4.6 4.6l1.3-1.3" />
    </>,
    p,
  );
