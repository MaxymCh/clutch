import type { ReactNode } from "react";

/**
 * Conteneur de page mobile-first : pleine largeur sur mobile,
 * colonne centrée bordée de filets sur écran large (style Pulse).
 */
export const Page = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-surface">
    {/* pb-24 : dégage la BottomNav mobile ; ≥ lg la Sidebar prend le relais */}
    <main className="mx-auto flex min-h-dvh w-full min-w-0 max-w-[1100px] flex-col bg-surface pb-24 sm:border-x sm:border-line lg:pb-10">
      <div className="flex-1">{children}</div>
      <DataAttribution />
    </main>
  </div>
);

/**
 * Crédit Liquipedia — obligatoire (données sous licence CC-BY-SA 3.0), affiché
 * à proximité des données avec backlink, sur toutes les pages.
 */
const DataAttribution = () => (
  <footer className="mt-6 border-t border-line px-4 py-4 text-center text-[11px] leading-relaxed text-faint">
    Données esport fournies par{" "}
    <a
      href="https://liquipedia.net"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-dim underline underline-offset-2"
    >
      Liquipedia
    </a>{" "}
    sous licence{" "}
    <a
      href="https://creativecommons.org/licenses/by-sa/3.0/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-dim underline underline-offset-2"
    >
      CC-BY-SA 3.0
    </a>
    . Clutch est un projet étudiant ETNA, non affilié à l'Esports World Cup.
  </footer>
);
