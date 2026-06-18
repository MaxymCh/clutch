# Theming — Tailwind v4 & tokens Clutch

## Principe

Toutes les couleurs vivent dans `src/index.css` sous `@theme { ... }`.
Les composants utilisent **uniquement les tokens** — jamais de couleur codée en dur (`#e2260a`, `gray-500`, etc.).

## Tokens disponibles

### Identité
| Token | Valeur | Usage |
|---|---|---|
| `text-accent` / `bg-accent` | `#e2260a` | CTAs, éléments actifs, badge live |
| `bg-accent` (pressed) | `#c11f08` | État pressé des boutons |
| `text-on-accent` | `#ffffff` | Texte sur fond accent |

### Neutres (surfaces & texte)
| Token | Rôle |
|---|---|
| `bg-surface` | Fond principal de l'app (`#ffffff` / dark `#15161a`) |
| `bg-surface-2` | Zones légèrement enfoncées, fond des cartes (`#f6f6f4`) |
| `text-ink` | Texte principal (`#17171b`) |
| `text-ink-2` | Texte secondaire (`#45454c`) |
| `text-dim` | Méta-infos, timestamps (`#76767e`) |
| `text-faint` | Infos tertiaires, placeholders (`#ababb2`) |
| `border-line` | Séparateurs (`#ececea`) |
| `border-line-2` | Bordures de contrôles (`#e0e0dd`) |

### Statuts de match
| Token | Statut |
|---|---|
| `text-live` / `bg-live` | `live` — même orange que accent |
| `text-upcoming` | `upcoming` |
| `text-done` | `done` — grisé |

### Veto cartes (maps)
| Token | Sens |
|---|---|
| `text-pick` / `bg-pick` | Pick (vert `#16955a`) |
| `text-ban` / `bg-ban` | Ban (rouge `#d23b3b`) |

### Ombres
```
shadow-card   →   var(--shadow-card)
```

## Thème sombre

Basculé via `data-theme="dark"` sur `<html>` (géré par `features/settings`).
Les tokens se mettent à jour automatiquement — aucune classe `dark:` à écrire.

## Animations live

```css
animate-live-ping    /* cercle qui s'étend (1.8s) */
animate-live-blink   /* clignotement doux (1.3s) */
```

Désactivées automatiquement si `prefers-reduced-motion`.

## Typographie

Police : **Bricolage Grotesque** (variable font, chargée depuis le projet).
Classe utilitaire : `font-sans` (appliquée sur `body` par défaut).

## Utilitaire

```css
scrollbar-none   /* masque la scrollbar, active le scroll tactile */
```
