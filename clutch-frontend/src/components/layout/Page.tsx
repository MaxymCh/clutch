import type { ReactNode } from "react";

/**
 * Conteneur de page mobile-first : pleine largeur sur mobile,
 * colonne centrée bordée de filets sur écran large (style Pulse).
 */
export const Page = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-surface">
    {/* pb-24 : dégage la BottomNav mobile ; ≥ lg la Sidebar prend le relais */}
    <main className="mx-auto min-h-dvh w-full min-w-0 max-w-3xl bg-surface pb-24 sm:border-x sm:border-line lg:w-[62vw] lg:max-w-none lg:pb-10">
      {children}
    </main>
  </div>
);
