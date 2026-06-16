/** Icônes minimales en trait (24×24, currentColor) — style Pulse. */

const PATHS = {
  back: "M15 19l-7-7 7-7",
  chevron: "M9 6l6 6-6 6",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  filter: "M3 5h18l-7 8v6l-4-2v-4z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  calendar:
    "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  close: "M18 6L6 18M6 6l12 12",
  search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
  bell: "M18 9a6 6 0 10-12 0c0 7-3 8-3 8h18s-3-1-3-8M13.7 21a2 2 0 01-3.4 0",
  plus: "M12 5v14M5 12h14",
  check: "M20 6L9 17l-5-5",
  copy: "M9 9h10a1 1 0 011 1v10a1 1 0 01-1 1H9a1 1 0 01-1-1V10a1 1 0 011-1zM5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1",
  share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14",
  users:
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
  info: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01",
  trend: "M22 7l-8.5 8.5-4-4L2 19M16 7h6v6",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  games: "M3 5h7v6H3zM14 5h7v6h-7zM3 13h7v6H3zM14 13h7v6h-7z",
  trophy:
    "M8 21h8M12 17v4M5 4h14v4a7 7 0 01-14 0zM5 6H3v1a3 3 0 003 3M19 6h2v1a3 3 0 01-3 3",
  shield: "M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z",
  pencil: "M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5z",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
  "eye-off":
    "M17.9 17.9A10.1 10.1 0 0112 20C5 20 1 12 1 12a18.1 18.1 0 015.1-5.9M9.9 4.2A9.5 9.5 0 0112 4c7 0 11 8 11 8a18.2 18.2 0 01-2.1 3.1M14.1 14.1A3 3 0 019.9 9.9M1 1l22 22",
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export const Icon = ({
  name,
  size = 20,
  strokeWidth = 1.9,
  className,
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={`block shrink-0 ${className ?? ""}`}
  >
    <path d={PATHS[name]} />
  </svg>
);
