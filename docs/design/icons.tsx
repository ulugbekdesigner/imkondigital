// src/design/icons.tsx â IMKON ikonka to'plami (20Ã20, stroke 1.75, currentColor)
// Qoida: har bir ikonka aria-hidden. Yolg'iz ikonka-tugmada aria-label MAJBURIY.
// Unicode belgi (â â¶ â â âª âº â¾) ishlatilmaydi.

import type { SVGProps } from 'react';

const base = {
  width: 20, height: 20, viewBox: '0 0 20 20', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round',
  strokeLinejoin: 'round', 'aria-hidden': true,
} as const;

type P = SVGProps<SVGSVGElement>;

export const RouteIcon = (p: P) => (<svg {...base} {...p}><path d="M5 16.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M15 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M15 7.5v3a3.5 3.5 0 0 1-3.5 3.5h-3"/></svg>);
export const BookIcon = (p: P) => (<svg {...base} {...p}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H16v14H5.5A1.5 1.5 0 0 1 4 15.5v-11Z"/><path d="M4 14.5A1.5 1.5 0 0 1 5.5 13H16"/></svg>);
export const BriefcaseIcon = (p: P) => (<svg {...base} {...p}><rect x="3" y="6.5" width="14" height="9.5" rx="2"/><path d="M7.5 6.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 12.5 5v1.5"/><path d="M3 10.5h14"/></svg>);
export const HeartIcon = (p: P) => (<svg {...base} {...p}><path d="M10 16s-6-3.7-6-7.6A3.4 3.4 0 0 1 10 6.2a3.4 3.4 0 0 1 6 2.2C16 12.3 10 16 10 16Z"/></svg>);
export const BellIcon = (p: P) => (<svg {...base} {...p}><path d="M6 8.5a4 4 0 0 1 8 0c0 3 1 4 1 4H5s1-1 1-4Z"/><path d="M8.5 15.5a1.7 1.7 0 0 0 3 0"/></svg>);
export const GearIcon = (p: P) => (<svg {...base} {...p}><circle cx="10" cy="10" r="2.5"/><path d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4"/></svg>);
export const SearchIcon = (p: P) => (<svg {...base} {...p}><circle cx="9" cy="9" r="5"/><path d="m13 13 4 4"/></svg>);
export const CloseIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="m6 6 8 8M14 6l-8 8"/></svg>);
export const CheckIcon = (p: P) => (<svg {...base} {...p} strokeWidth={2.3}><path d="m5 10.5 3.2 3L15 6.5"/></svg>);
export const AlertIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M10 4.6 17 16H3l7-11.4Z"/><path d="M10 8.8v3M10 13.8h.01"/></svg>);
export const RefreshIcon = (p: P) => (<svg {...base} {...p}><path d="M15.5 8A5.5 5.5 0 0 0 5.4 6.3"/><path d="M4.5 12A5.5 5.5 0 0 0 14.6 13.7"/><path d="M5.2 3.5v3h3M14.8 16.5v-3h-3"/></svg>);
export const PlayIcon = (p: P) => (<svg {...base} {...p} stroke="none"><path d="M7.5 5.5v9l7-4.5-7-4.5Z" fill="currentColor"/></svg>);
export const FullscreenIcon = (p: P) => (<svg {...base} {...p}><path d="M4 7.5V4h3.5M16 12.5V16h-3.5M16 7.5V4h-3.5M4 12.5V16h3.5"/></svg>);
export const AudioIcon = (p: P) => (<svg {...base} {...p}><path d="M5 8v4h2.5L11 15V5L7.5 8H5Z"/><path d="M13.5 7.8a3 3 0 0 1 0 4.4"/></svg>);
export const MicIcon = (p: P) => (<svg {...base} {...p}><rect x="8" y="3" width="4" height="8" rx="2"/><path d="M6 9.5a4 4 0 0 0 8 0M10 13.5V16"/></svg>);
export const LockIcon = (p: P) => (<svg {...base} {...p}><rect x="5" y="9" width="10" height="7" rx="2"/><path d="M7.5 9V7a2.5 2.5 0 0 1 5 0v2"/></svg>);
export const SunIcon = (p: P) => (<svg {...base} {...p}><circle cx="10" cy="10" r="3.2"/><path d="M10 3v1.6M10 15.4V17M17 10h-1.6M4.6 10H3M15 5l-1.1 1.1M6.1 13.9 5 15M15 15l-1.1-1.1M6.1 6.1 5 5"/></svg>);
export const MoonIcon = (p: P) => (<svg {...base} {...p}><path d="M15.5 11.6A5.8 5.8 0 0 1 8.4 4.5a6 6 0 1 0 7.1 7.1Z"/></svg>);
export const ContrastIcon = (p: P) => (<svg {...base} {...p}><circle cx="10" cy="10" r="6.5"/><path d="M10 3.5v13a6.5 6.5 0 0 0 0-13Z" fill="currentColor" stroke="none"/></svg>);
export const EditIcon = (p: P) => (<svg {...base} {...p}><path d="M13.2 4.3 15.7 6.8 7.5 15H5v-2.5l8.2-8.2Z"/></svg>);
export const SendIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M4.5 10 16 5l-4 11-2.2-4.4L4.5 10Z"/></svg>);
export const SparkIcon = (p: P) => (<svg {...base} {...p}><path d="M10 3.5 11.6 8 16 9.6 11.6 11.2 10 15.6 8.4 11.2 4 9.6 8.4 8 10 3.5Z"/></svg>);
export const ChartIcon = (p: P) => (<svg {...base} {...p}><path d="M4 16V9M8.6 16V4.5M13.2 16v-4.5M17 16h-14"/></svg>);
export const UsersIcon = (p: P) => (<svg {...base} {...p}><circle cx="7.5" cy="7" r="2.6"/><path d="M3.5 16c0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8"/><circle cx="14.4" cy="8" r="2"/><path d="M13.5 16c0-2 .8-3 2.5-3.4"/></svg>);
export const ClipboardIcon = (p: P) => (<svg {...base} {...p}><rect x="4.5" y="3.5" width="11" height="13" rx="2"/><path d="M7.5 7.5h5M7.5 10.5h5M7.5 13.5h3"/></svg>);
export const BuildingIcon = (p: P) => (<svg {...base} {...p}><path d="M4 16.5V7l6-3.5L16 7v9.5"/><path d="M8 16.5v-4h4v4"/></svg>);
export const ShieldIcon = (p: P) => (<svg {...base} {...p}><path d="M10 3.5 16 6v4.5c0 3.4-2.4 5.7-6 6.5-3.6-.8-6-3.1-6-6.5V6l6-2.5Z"/></svg>);
export const ChevronDownIcon = (p: P) => (<svg {...base} {...p} strokeWidth={2}><path d="m5 8 5 5 5-5"/></svg>);
export const ChevronRightIcon = (p: P) => (<svg {...base} {...p} strokeWidth={2}><path d="m8 5 5 5-5 5"/></svg>);
export const ArrowLeftIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M15.5 10h-11M8.5 5.5 4 10l4.5 4.5"/></svg>);
export const EyeIcon = (p: P) => (<svg {...base} {...p}><path d="M2.6 10S5.4 5.4 10 5.4 17.4 10 17.4 10 14.6 14.6 10 14.6 2.6 10 2.6 10Z"/><circle cx="10" cy="10" r="2.2"/></svg>);
export const EyeOffIcon = (p: P) => (<svg {...base} {...p}><path d="M4.2 5.6C2.9 6.9 2.1 8.4 2.1 8.4s2.8 4.6 7.4 4.6c1.3 0 2.4-.3 3.4-.8"/><path d="M15.3 11.3c.9-1 1.4-1.9 1.4-1.9S13.9 4.8 9.3 4.8c-.5 0-1 .1-1.5.2"/><path d="m4 4 12 12"/></svg>);
export const DownloadIcon = (p: P) => (<svg {...base} {...p}><path d="M10 4v8M6.5 9 10 12.5 13.5 9M4.5 15.5h11"/></svg>);
export const AttachIcon = (p: P) => (<svg {...base} {...p}><path d="M13.5 6.5 8 12a2.1 2.1 0 0 0 3 3l5.5-5.5a4.2 4.2 0 0 0-6-6L5 9a6.3 6.3 0 0 0 9 9l4-4"/></svg>);
export const DragIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M7 6h.01M7 10h.01M7 14h.01M13 6h.01M13 10h.01M13 14h.01"/></svg>);
export const PhoneIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M4.5 5.5c0 6 4 10 10 10l1.5-2.5-3-2-1.5 1.5a9 9 0 0 1-4-4L9 7 7 4 4.5 5.5Z"/></svg>);
export const MoreIcon = (p: P) => (<svg {...base} {...p} strokeWidth={2}><path d="M10 5.5h.01M10 10h.01M10 14.5h.01"/></svg>);
export const PlusIcon = (p: P) => (<svg {...base} {...p} strokeWidth={1.9}><path d="M10 4.5v11M4.5 10h11"/></svg>);
