// أيقونات SVG صغيرة (stroke) عشان منضيفش مكتبة
const PATHS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  map: "M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zm0 0v13m6-10.5v13",
  chat: "M4 5h16v11H9l-5 4z M8 9.5h8 M8 12.5h5",
  cap: "M2 9l10-5 10 5-10 5z M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5 M22 9v5",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6 M12 17h.01",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  flame:
    "M12 22c4 0 7-2.7 7-6.8 0-4.2-3.4-6.7-4.5-10.2-2.4 1.8-3.3 4.2-3 6.5C10.3 10.6 9.2 9.3 9 7.5 6.6 9.6 5 12.2 5 15.2 5 19.3 8 22 12 22z",
  pen: "M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4 M8 14h2 M14 14h2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2",
  check: "M5 12.5l4.5 4.5L19 7.5",
  lock: "M6 11h12v10H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  arrow: "M15 5l-7 7 7 7",
  external: "M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6",
  send: "M4 12l16-8-6 16-2.5-6.5z",
  spark: "M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M5.6 18.4l2.8-2.8 M15.6 8.4l2.8-2.8",
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
