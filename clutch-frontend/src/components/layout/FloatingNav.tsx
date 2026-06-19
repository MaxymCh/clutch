import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { LiveDot } from "../ui/Badge";
import { TABS, activeTabId } from "./navTabs";

type FloatingNavProps = {
  agendaLive?: boolean;
  forYouLive?: boolean;
  themeToggle?: ReactNode;
};

/** Navigation desktop (≥ lg) : barre flottante centrée, style pill. */
export const FloatingNav = ({
  agendaLive = false,
  forYouLive = false,
  themeToggle,
}: FloatingNavProps) => {
  const { pathname } = useLocation();
  const active = activeTabId(pathname);

  return (
    <header
      className={[
        "fixed top-4 left-1/2 z-20 hidden",
        "w-[calc(100%-3rem)] max-w-[1100px]",
        "-translate-x-1/2",
        "items-center gap-2",
        "rounded-2xl",
        "border border-line-2",
        "bg-surface-2",
        "px-4 py-3.5",
        "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        "lg:flex",
      ].join(" ")}
    >
      {/* Logo — crop 15% du bas pour éliminer l'espace vide */}
      <Link to="/" className="mr-1 shrink-0 pb-0.5">
        <div className="h-[40px] overflow-hidden">
          <img
            src="/SDC-168H.png"
            alt="Clutch"
            className="h-[47px] w-auto object-contain object-top"
          />
        </div>
      </Link>

      {/* Onglets */}
      <nav className="flex flex-1 items-center gap-0.5">
        {TABS.map((tab) => {
          const on = tab.id === active;
          return (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={on ? "page" : undefined}
              className={[
                "flex items-center gap-1.5 rounded-[11px] px-3 py-2.5",
                "text-sm tracking-tight transition-transform active:scale-[.97]",
                on
                  ? "bg-surface font-bold text-ink shadow-card"
                  : "font-semibold text-dim hover:text-ink-2",
              ].join(" ")}
            >
              <Icon name={tab.icon} size={18} strokeWidth={on ? 2.2 : 1.8} />
              {tab.label}
              {tab.id === "home" && forYouLive && (
                <span className="ml-0.5">
                  <LiveDot />
                </span>
              )}
              {tab.id === "agenda" && agendaLive && (
                <span className="ml-0.5">
                  <LiveDot />
                </span>
              )}
            </Link>
          );
        })}
        <Link
          to="/search"
          className="flex items-center gap-1.5 rounded-[11px] px-3 py-2.5 text-sm font-semibold tracking-tight text-dim transition-transform hover:text-ink-2 active:scale-[.97]"
        >
          <Icon name="search" size={18} />
          Recherche
        </Link>
      </nav>

      {/* Droite : Theme */}
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        {themeToggle}
      </div>
    </header>
  );
};
