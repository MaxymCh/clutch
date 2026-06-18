# Clutch Frontend

PWA React mobile-first — calendrier unifié des matchs EWC 2026, filtrable par jeu et par équipe, avec pronostics communautaires.

## Documentation

Voir [`CLAUDE.md`](./CLAUDE.md) pour le guide complet : tech stack, architecture, commandes, conventions de code.

## Démarrage rapide

```bash
npm install
npm run dev        # serveur de dev (proxy vers l'API sur :8000)
npm run build      # build production
npm run lint       # ESLint
npm run test       # Vitest
```

## App mobile (Capacitor)

```bash
npm run mobile:sync     # build + sync Android/iOS
npm run mobile:android  # ouvre Android Studio
```
