const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

const Svg = ({ size = 17, children, ...rest }) => (
  <svg width={size} height={size} {...base} {...rest} aria-hidden="true">
    {children}
  </svg>
)

export const ChevronDown = (p) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
)
export const Search = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></Svg>
)
export const Close = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)
export const ArrowLeft = (p) => (
  <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
)
export const Undo = (p) => (
  <Svg {...p}><path d="M9 14L4 9l5-5" /><path d="M4 9h9a6 6 0 010 12H9" /></Svg>
)
export const Redo = (p) => (
  <Svg {...p}><path d="M15 14l5-5-5-5" /><path d="M20 9h-9a6 6 0 000 12h4" /></Svg>
)
export const Download = (p) => (
  <Svg {...p}><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 20h16" /></Svg>
)
export const Save = (p) => (
  <Svg {...p}><path d="M5 4h11l3 3v13H5z" /><path d="M8 4v6h8V4M8 20v-6h8v6" /></Svg>
)
export const Trash = (p) => (
  <Svg {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></Svg>
)
export const Plus = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)
export const Type = (p) => (
  <Svg {...p}><path d="M5 6V4h14v2M12 4v16M8 20h8" /></Svg>
)
export const Sparkle = (p) => (
  <Svg {...p}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" /></Svg>
)
export const Layers = (p) => (
  <Svg {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5M3 17l9 5 9-5" /></Svg>
)
export const Copy = (p) => (
  <Svg {...p}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 5H6a2 2 0 00-2 2v9" /></Svg>
)
export const ArrowUp = (p) => (
  <Svg {...p}><path d="M12 20V5M6 11l6-6 6 6" /></Svg>
)
export const ArrowDown = (p) => (
  <Svg {...p}><path d="M12 4v15M6 13l6 6 6-6" /></Svg>
)
export const Grid = (p) => (
  <Svg {...p}><rect x="4" y="4" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" /></Svg>
)
export const Folder = (p) => (
  <Svg {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></Svg>
)
export const ZoomIn = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4M8.5 11h5M11 8.5v5" /></Svg>
)
export const ZoomOut = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4M8.5 11h5" /></Svg>
)
export const Check = (p) => (
  <Svg {...p}><path d="M5 13l4 4L19 7" /></Svg>
)
export const Globe = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 4 5.7 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.7-4-9s1.5-6.4 4-9z" /></Svg>
)
export const Upload = (p) => (
  <Svg {...p}><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" /></Svg>
)
export const Photo = (p) => (
  <Svg {...p}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M4 17l4.5-4.5L12 16l3-3 5 5" /></Svg>
)
export const Refresh = (p) => (
  <Svg {...p}><path d="M20 11a8 8 0 10-2.3 5.7" /><path d="M20 5v6h-6" /></Svg>
)
export const LogOut = (p) => (
  <Svg {...p}><path d="M14 4h5v16h-5" /><path d="M10 8l-4 4 4 4M6 12h9" /></Svg>
)
export const Database = (p) => (
  <Svg {...p}><ellipse cx="12" cy="6" rx="7" ry="2.8" /><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6" /><path d="M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" /></Svg>
)
export const Shield = (p) => (
  <Svg {...p}><path d="M12 3l7 3v6c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z" /><path d="M9 12l2 2 4-4" /></Svg>
)
