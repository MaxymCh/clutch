# Clutch Frontend — Project Guide

## 🎯 Purpose (Why)

Clutch est une PWA web responsive (mobile-first) qui agrège les matchs de
l'Esports World Cup 2026 en un calendrier unifié, filtrable par jeu et par
équipe. Projet étudiant (ETNA, sprint 168h). Identité propre, NON affiliée à l'EWC.

- Objectif : UI rapide, claire et responsive ; l'UI/UX est notre spécialité notée.

## 🛠️ Tech Stack (What)

- **Framework:** React 19 + TypeScript (functional components, arrow syntax)
- **Build:** Vite + plugin `@tailwindcss/vite`
- **Styling:** Tailwind CSS v4 — PAS de `tailwind.config.js`. Thème et couleurs
  vivent dans `src/index.css` via la syntaxe `@theme { ... }`.
- **Data fetching:** TanStack Query (appels vers NOTRE API interne uniquement).
- **PWA:** `vite-plugin-pwa` (service worker + manifest).
- **Types API:** générés depuis la spec OpenAPI du backend — NE PAS écrire à la
  main les types des réponses API. Source de vérité = le backend.
- ⚠️ Toujours vérifier les versions exactes dans `package.json` avant de coder ;
  ne jamais inventer un numéro de version.

## 🏗️ Architecture (high-level)

- **Monorepo.** Ce dossier `clutch-frontend/` est le front ; le backend (API +
  worker d'ingestion Liquipedia) vit dans `../clutch-backend/`.
- Le front consomme NOTRE API interne via un client typé généré depuis OpenAPI.
- Flux de données : Liquipedia → worker backend → base → API interne → ce front.
  Le front ne connaît que l'API interne.
- Organisation `src/` : `components/` (UI réutilisable), `features/` (calendrier,
  filtres, équipe — par domaine métier), `api/` (client généré + hooks TanStack
  Query), `pages/` ou routes, `index.css` (thème `@theme`).
- Détail complet de la structure et du routing → `.claude/rules/architecture.md`.

## ⚙️ Commands (How)

- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Régénérer les types API:** `npm run gen:api` <!-- adapte au nom réel -->

## 🎨 Code & Style Guidelines

- **Langue:** réponds et commente le code en français ; garde les termes
  techniques en anglais quand c'est naturel ("state", "hook", "props").
- **TypeScript:** strict mode. Types explicites, éviter `any`.
- **Charte graphique:** base claire/blanche, accent orange `#e2260a`. Les
  couleurs sont définies UNE fois dans `@theme` (variables) — ne pas coder de
  couleurs en dur dans les composants, utiliser les tokens du thème.
- **État:** hooks natifs (`useState`, `useContext`) pour l'état LOCAL/UI.
  Pour les DONNÉES SERVEUR (matchs, équipes, tournois) → TanStack Query, pas de
  fetch maison ni de state global bricolé.
- **Données:** ne JAMAIS appeler Liquipedia depuis le front. Le front ne parle
  qu'à notre API interne. (Liquipedia est interrogé côté backend/worker.)
- **Accessibilité & tactile:** cibles tactiles confortables, contraste suffisant
  (l'orange sur blanc doit rester lisible), responsive mobile-first.

## 🧠 Progressive Knowledge (More Rules)

Ne devine pas. Lis le fichier dédié AVANT de coder le sujet concerné :

- Structure des dossiers & routing : `.claude/rules/architecture.md`
- Patterns de composants UI (cartes de match, filtres, états live/à venir/fini) : `.claude/rules/components.md`
- Conventions de thème & tokens Tailwind v4 : `.claude/rules/theming.md`
