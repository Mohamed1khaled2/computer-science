"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { currentPhaseIndex, overallProgress } from "@/lib/journey";
import { PHASES } from "@/lib/roadmap";
import { streak, useStore } from "@/lib/store";
import Icon, { type IconName } from "./Icon";
import TimerBar from "./TimerBar";

type NavLink = { href: string; label: string; icon: IconName };

const MAIN: NavLink[] = [
  { href: "/", label: "النهارده", icon: "home" },
  { href: "/roadmap", label: "الرحلة", icon: "map" },
  { href: "/mentor", label: "المشرف", icon: "chat" },
  { href: "/notes", label: "الملاحظات", icon: "pen" },
  { href: "/glossary", label: "القاموس", icon: "translate" },
  { href: "/english", label: "إنجليزي البرمجة", icon: "spark" },
  { href: "/transcript", label: "السجل الأكاديمي", icon: "cap" },
  { href: "/attendance", label: "الجدول والحضور", icon: "calendar" },
  { href: "/log", label: "دفتر الجلسات", icon: "book" },
];
const EXTRA: NavLink[] = [
  { href: "/help", label: "اتزنقت", icon: "help" },
  { href: "/settings", label: "الإعدادات", icon: "gear" },
];
const SHORT: Record<string, string> = { "/transcript": "السجل" };
// على الموبايل: 5 تابات تحت، والقاموس والحضور ودفتر الجلسات أيقونات في الهيدر
// (إنجليزي البرمجة بيتفتح من صفحة القاموس)
const IN_HEADER = ["/glossary", "/english", "/attendance", "/log"];
const NO_HEADER_ICON = ["/english"];
const TABS = MAIN.filter((l) => !IN_HEADER.includes(l.href));
const HEADER_ICONS = [...MAIN.filter((l) => IN_HEADER.includes(l.href) && !NO_HEADER_ICON.includes(l.href)), ...EXTRA];

function active(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/roadmap") return path.startsWith("/roadmap") || path.startsWith("/course");
  return path.startsWith(href);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { state, ready, syncStatus } = useStore();
  const dot = { off: "bg-muted/40", syncing: "bg-warn", ok: "bg-accent", error: "bg-red-500" }[syncStatus];
  const phaseIdx = ready ? currentPhaseIndex(state) : 0;
  const pct = ready ? Math.round(overallProgress(state).pct * 100) : 0;
  const st = ready ? streak(state) : 0;
  const phase = PHASES[phaseIdx];

  return (
    <div className="md:flex">
      {/* سايدبار الكمبيوتر */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-line bg-card md:flex">
        <div className="px-5 pb-4 pt-6">
          <Link href="/" className="block">
            <span className="block text-lg font-extrabold">مسار مادا</span>
            <span className="block text-xs text-muted" dir="ltr">
              Computer Science · OSSU
            </span>
          </Link>
        </div>

        <div className="mx-3 rounded-2xl bg-bg p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent text-lg font-bold text-bg">م</span>
            <div className="min-w-0">
              <p className="font-bold">مادا</p>
              <p className="truncate text-xs text-muted">{phase ? phase.title.split("—")[0].trim() : "خلّصت 🎓"}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted">
            <span>الخطة كلها</span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <div className="track mt-1">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 1)}%` }} />
          </div>
        </div>

        <nav className="mt-4 flex-1 space-y-0.5 px-3">
          {MAIN.map((l) => (
            <SideLink key={l.href} link={l} on={active(path, l.href)} />
          ))}
          <div className="my-3 border-t border-line" />
          {EXTRA.map((l) => (
            <SideLink key={l.href} link={l} on={active(path, l.href)} />
          ))}
        </nav>

        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Icon name="flame" className={`size-4 ${st ? "text-warn" : ""}`} />
            {st} يوم
          </span>
          <span className="flex items-center gap-1.5" title={`sync: ${syncStatus}`}>
            <span className={`size-2 rounded-full ${dot}`} />
            {syncStatus === "ok"
              ? "متزامن"
              : syncStatus === "off"
                ? "على الجهاز"
                : syncStatus === "error"
                  ? "مشكلة مزامنة"
                  : "..."}
          </span>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* هيدر الموبايل + شريط التايمر لو فيه جلسة شغالة */}
        <div className="sticky top-0 z-20">
          <header className="flex items-center justify-between border-b border-line bg-card/95 px-4 py-2.5 backdrop-blur md:hidden">
            <Link href="/" className="flex items-center gap-2 font-extrabold">
              مسار مادا <span className={`size-2 rounded-full ${dot}`} />
            </Link>
            <div className="flex items-center gap-1">
              <span className="me-1 flex items-center gap-1 text-xs text-muted">
                <Icon name="flame" className={`size-4 ${st ? "text-warn" : ""}`} />
                {st}
              </span>
              {HEADER_ICONS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-label={l.label}
                  className={`rounded-lg p-2 ${active(path, l.href) ? "text-accent" : "text-muted"}`}
                >
                  <Icon name={l.icon} />
                </Link>
              ))}
            </div>
          </header>
          <TimerBar />
        </div>

        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8">{children}</main>
      </div>

      {/* تابات الموبايل */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex justify-around">
          {TABS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                active(path, l.href) ? "text-accent" : "text-muted"
              }`}
            >
              <Icon name={l.icon} />
              {SHORT[l.href] ?? l.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function SideLink({ link, on }: { link: NavLink; on: boolean }) {
  return (
    <Link
      href={link.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        on ? "bg-accent-soft text-accent" : "text-muted hover:bg-bg hover:text-text"
      }`}
    >
      <Icon name={link.icon} />
      {link.label}
    </Link>
  );
}
