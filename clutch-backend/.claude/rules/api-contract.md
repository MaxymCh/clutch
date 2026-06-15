# Contrat API — règles

Le contrat complet (entités, champs, endpoints, décisions actées) est dans
`docs/CONTRAT-API.md`. **Le lire avant de toucher aux schémas ou aux routes.**

Invariants non négociables :

- JSON de sortie en camelCase, identique aux types TS du front
  (`clutch-frontend/src/types/esports.ts` et `community.ts`).
- Statuts de match : `upcoming` / `live` / `done` (jamais `finished`).
- `bestOf` : chaînes `"BO1"` / `"BO3"` / `"BO5"`.
- `Match.teamA`/`teamB` : objets `Team` embarqués, jamais des ids.
- `oddsA` : jamais renvoyé (aucune source, aucune valeur fabriquée).
- `date`/`time` : stockage UTC, sérialisation dans `DISPLAY_TZ` (.env).
- Champs optionnels absents (`exclude_none`), pas de `null` parasites.
- Scoring pronostics : paliers EXCLUSIFS 25 (score exact) / 10 (bon
  vainqueur) / 0. Prono uniquement sur match `upcoming` non commencé.
- Toute divergence détectée avec le front : S'ARRÊTER et demander.
