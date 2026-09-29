"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/", label: "النهارده" },
  { href: "/roadmap", label: "الخطة" },
  { href: "/log", label: "السجل" },
  { href: "/help", label: "اتزنقت" },
  { href: "/settings", label: "إعدادات" },
];

export default function Nav() {
  const path = usePathname();
  const { syncStatus } = useStore();
  const dot = { off: "bg-muted/40", syncing: "bg-warn", ok: "bg-accent", error: "bg-red-500" }[syncStatus];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 backdrop-blur md:static md:border-b md:border-t-0">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-2 md:px-4">
        <span className="hidden items-center gap-2 font-bold md:flex">
          مسار مادا <span className={`size-2 rounded-full ${dot}`} title={`sync: ${syncStatus}`} />
        </span>
        <div className="flex w-full justify-around md:w-auto md:gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-3 text-sm font-semibold md:py-3 ${
                path === l.href ? "text-accent" : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
