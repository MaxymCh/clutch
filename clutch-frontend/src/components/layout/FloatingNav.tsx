import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { LiveDot } from "../ui/Badge";
import { TABS, activeTabId } from "./navTabs";

type FloatingNavProps = {
  agendaLive?: boolean;
  themeToggle?: ReactNode;
};

/** Switcher EWC / ENC — les deux cliquables (ENC = no-op pour l'instant). */
const CompSwitcher = () => {
  // TODO: gérer l'état actif EWC/ENC via contexte quand l'API ENC sera prête
  return (
    <div className="flex items-center rounded-full bg-surface p-0.5">
      <button
        className="cursor-pointer rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-surface"
      >
        EWC
      </button>
      <button
        className="cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold text-dim hover:text-ink"
      >
        ENC
      </button>
    </div>
  );
};

/** Navigation desktop (≥ lg) : barre flottante centrée, style pill. */
export const FloatingNav = ({
  agendaLive = false,
  themeToggle,
}: FloatingNavProps) => {
  const { pathname } = useLocation();
  const active = activeTabId(pathname);

  return (
    <header
      className={[
        "fixed top-4 left-1/2 z-20 hidden",
        "w-[calc(100%-3rem)] max-w-3xl lg:w-[62vw] lg:max-w-none",
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
      {/* Logo */}
      <Link to="/" className="mr-3 shrink-0">
        <div className="h-[44px] w-[154px] overflow-hidden rounded-xl">
          <img
            src="/SDC-168H.png"
            alt="Clutch"
            className="h-full w-full object-cover object-center"
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
                "flex items-center gap-2 rounded-[11px] px-4 py-2.5",
                "text-sm tracking-tight transition-transform active:scale-[.97]",
                on
                  ? "bg-surface font-bold text-ink shadow-card"
                  : "font-semibold text-dim hover:text-ink-2",
              ].join(" ")}
            >
              <Icon name={tab.icon} size={18} strokeWidth={on ? 2.2 : 1.8} />
              {tab.label}
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
          className="flex items-center gap-2 rounded-[11px] px-4 py-2.5 text-sm font-semibold tracking-tight text-dim transition-transform hover:text-ink-2 active:scale-[.97]"
        >
          <Icon name="search" size={18} />
          Recherche
        </Link>
      </nav>

      {/* Droite : Compétition switcher + Theme */}
      <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
        <CompSwitcher />
        {themeToggle}
      </div>
    </header>
  );
};
