# Handoff: WedPlay — Wedding Games App

## Overview
WedPlay is a mobile-first web app for wedding receptions. Guests scan a QR code (or enter an event code) to join the couple's "room" and play real-time games together — Bingo Humano, Quiz/Trivia, Adivina Quién, Deseos, Timeline, Foto Challenge, and a collaborative Playlist. The couple logs in as admins from a TV/desktop screen to project leaderboards, questions, and results to the room.

Primary users:
- **Guests** (mobile) — scan QR, enter name, play.
- **Admins = los novios** (mobile + TV/desktop) — log in with email + password, control games, project to a big screen.

Language: **Spanish rioplatense** ("vos", "jugá"), with a Spanish-neutral variant included.

## About the Design Files
The files in this bundle are **design references created in HTML + React (inline Babel JSX)** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (Next.js/React Native/SvelteKit/etc.) using its established patterns and libraries. If no codebase exists yet, pick the best framework for the job (Next.js + Tailwind + a real-time backend like Supabase/Convex is a solid default) and implement the designs there.

The HTML prototype renders static screens in a pan/zoom design canvas — it is **not** a functional app. There is no routing, no state persistence, no backend, and no real-time channels wired up.

## Fidelity
**High-fidelity.** Colors, typography, spacing, corner radii, button styles and copy are all final for the two art directions. Two complete art directions are provided — the user should pick one (or instruct a hybrid) before implementation.

## Art Directions (pick one)

### Direction A — "Confetti Fiesta"
Warm ivory background, rounded multi-color cards (one color per game), confetti shape pattern behind the hero, gradient wordmark (pink → orange), chunky rounded buttons (radius 12–14px). Friendly, playful, party vibe.

### Direction B — "Retro Poster"
Editorial serif display (Fraunces italic for accents), strong grid rules, sharp 2–4px corner radii, high contrast. Feels like a designed wedding invitation. Uses the same game palette but as small inline chips, not full-bleed cards.

Both directions share the same information architecture, auth flows, and game mechanics — only visual language changes.

## Information Architecture

```
/                           → Home (logo + game grid + guest/admin entry)
/join                       → Guest login (QR + event code + name)
/admin/login                → Admin login (email + password) — the couple
/admin                      → Admin TV dashboard (desktop/TV target)
/play/bingo                 → Bingo Humano (mobile)
/play/quiz                  → Quiz (mobile)
/play/guess                 → Adivina Quién (mobile)
/play/wishes                → Deseos / Mensajes (mobile)
/play/timeline              → Timeline (mobile) — not mocked, follow same pattern
/play/photo                 → Foto Challenge (mobile) — not mocked
/play/playlist              → Playlist (mobile) — not mocked
```

## Design Tokens

### Per-game palette (OKLCH)
Each game has a primary (`c`), secondary (`c2`), soft tint (`soft`), and ink color. All defined in `tokens.jsx` as `WP_GAMES`.

| Game        | Primary (c)                 | Secondary (c2)              | Ink    |
|-------------|-----------------------------|-----------------------------|--------|
| bingo       | `oklch(0.68 0.22 358)` pink | `oklch(0.78 0.18 28)`  red  | #fff   |
| quiz        | `oklch(0.68 0.15 165)` green| `oklch(0.78 0.14 180)` teal | #fff   |
| guess       | `oklch(0.63 0.20 290)` violet| `oklch(0.72 0.18 310)` magenta| #fff   |
| wishes      | `oklch(0.76 0.16 70)`  gold | `oklch(0.82 0.15 55)`  amber| #3a2a10|
| timeline    | `oklch(0.62 0.16 230)` blue | `oklch(0.75 0.14 210)` sky  | #fff   |
| photo       | `oklch(0.68 0.20 30)`  coral| `oklch(0.78 0.18 45)`  orange| #fff   |
| playlist    | `oklch(0.66 0.18 140)` green| `oklch(0.78 0.16 125)` lime | #fff   |

### Mode tokens
Light:
- bg `oklch(0.985 0.008 80)` — warm ivory
- bgAlt `oklch(0.97 0.012 75)`
- ink `oklch(0.22 0.02 50)`
- inkSoft `oklch(0.45 0.02 50)`
- line `oklch(0.88 0.02 70)`
- card `#fff`

Dark:
- bg `oklch(0.19 0.015 40)` — warm charcoal
- bgAlt `oklch(0.24 0.018 40)`
- ink `oklch(0.96 0.01 70)`
- inkSoft `oklch(0.72 0.015 60)`
- line `oklch(0.32 0.02 50)`
- card `oklch(0.24 0.02 40)`

### Typography
- **Body + UI** → `Plus Jakarta Sans` (400 / 500 / 600 / 700 / 800)
- **Dir A display** → `Unbounded` 800 (letter-spacing `-0.04em`) for the wordmark
- **Dir B display** → `Fraunces` 900 (italic + roman), letter-spacing `-0.03em`
- **Deseos handwriting** → `Caveat` 500–700
- Monospace accents → `ui-monospace`

### Spacing / radii
- Dir A radii: 12 / 14 / 16 / 18 / 22 / 44 (phone frame)
- Dir B radii: 2 / 4 / 6 (poster sharpness)
- Padding scale: 6, 8, 10, 12, 14, 18, 20, 24, 28
- Phone frame: 320×640 (iPhone-ish), 44px outer radius, 36px inner radius, 10px bezel
- TV frame: 800×500, 14px outer radius, 8px inner

### Shadows
- Cards: `0 4px 10px -4px rgba(0,0,0,0.2)`
- Phone: `0 30px 60px -20px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.06)`
- Buttons (solid): `0 2px 6px <darken(color,10%) @ 40%>` + `0 1px 0 rgba(255,255,255,0.2) inset`
- TV: `0 20px 40px -10px rgba(0,0,0,0.3)`

## Screens / Views

### 1. Home (mobile)
**Purpose:** Land on the app, see the couple's name + date, pick a game, or sign in.

**Dir A layout:**
- Status bar + top row: date (uppercase, tracked), bell icon (28×28 rounded).
- Hero placeholder: 62% wide, square, 20px radius, diagonal-stripe pattern. Drop the couple illustration here.
- Wordmark "WedPlay" (40px), tagline + couple name beneath.
- 2-column grid of game cards: each ~118px tall, 18px radius, solid color background, game glyph SVG top-right (66px, partially clipped), title bottom-left (13px, 800), sublabel uppercase (9px).
- Bottom: solid dark "Invitado · QR" button + ghost "Admin" button.

**Dir B layout:**
- Top rule with "WEDPLAY · N°01" and date (10px 800 uppercase, 1px letter-spacing).
- "La boda de" label → display names stacked with a 22px italic `&` offset-indented by 24px.
- Hero 5:3 striped placeholder.
- Game list: numbered `01. / 02. / …`, 30×30 colored icon, name in Fraunces 800, right-aligned "Jugá →" chip in game color.
- Footer row: solid dark "Invitado" + outlined "💍 Novios".

### 2. Guest Login (mobile)
- Back chevron.
- Heading "Entrá a la fiesta" (A) / "Sumate a la fiesta" (B, italic accent on "la fiesta").
- QR block — 150×150 (A, rounded) or 180×180 on black poster card (B).
- "— o —" divider.
- Code input: 4–6 character cells, current cell highlighted in brand pink (A) or filled dark (B).
- Name input.
- Primary CTA "Entrar a la fiesta →".

### 3. Admin Login (mobile, for los novios)
- Back chevron.
- Pill "💍 NOVIOS" (dir A: pink soft; dir B: outlined rule).
- Greeting with couple names (gradient text A / italic Fraunces accent B).
- Email + password fields.
- "¿Olvidaste la clave?" link.
- Primary CTA "Ingresar al panel →" in dark ink.
- Footer note "Sesión segura · los invitados no ven esto".

### 4. Bingo Humano (mobile, Dir A)
- Pink header band 160px tall, "🔴 EN VIVO" chip, title, progress chips (6/25, 42 jugando).
- 5×5 grid, 7px radius cells, center cell is "★ FREE ★" in secondary color, stamped cells filled + ✓ top-right. Copy uses Argentine phrases ("Bailó con la abuela", "Le tira la pilcha", "Canta en la ducha", etc.).
- Bottom: primary "📸 Marcar con foto" + soft "🏆" leaderboard button.

### 5. Quiz (mobile, Dir A)
- "Ronda 4 / 10" chip.
- Green timer bar 62% filled.
- Question: "¿Dónde se conocieron Nacho y Flor?"
- 4 answer rows: idle (white card + gray letter badge), **correct** (filled green + ✓ + "+850 pts" pill), **wrong** (soft red + ✕).
- Footer: rank "#7 de 42" left, score "3.240" green right.

### 6. Adivina Quién (mobile, Dir B)
- Editorial header "Adivina *quién*" (italic accent).
- Sub-prompt: "¿Quién se olvida las llaves más seguido?"
- Full-bleed VS card — left half violet (Option A, groom name), right half magenta (Option B, bride italic), 58×58 patterned avatar rings, vote percentage small uppercase, central 44×44 "vs" badge on ivory.
- Bottom: "VOTAR A" / "VOTAR B" sharp 2px-radius buttons in each color.

### 7. Deseos (mobile, Dir B)
- Heading "Un deseo para *Nacho & Flor*" (italic gold accent on names).
- Feed of colored sticky-note cards in `Caveat` handwriting, each tilted ±1–2°.
- Bottom compose card with dashed "TU DESEO" label.
- Primary CTA "ENVIAR ✉" in dark ink.

### 8. Admin TV (desktop/TV 800×500)
**Dir A — Live Quiz view:**
- Left (flex 1): wordmark + room code "NACHOFLOR22", "🔴 EN VIVO · Quiz" chip, "Pregunta 4 de 10", 36px bold question, 2×2 answer grid with progress-fill backgrounds and percentages. Footer meta: timer, players, answered.
- Right (320px sidebar): "🏆 Ranking" list, top row highlighted in game color, each with avatar dot, name, tabular score. Bottom mini QR + `wedplay.ar/nachoflor`.

**Dir B — Couple's dashboard:**
- Editorial header: "PANEL DE NOVIOS · EN VIVO" + 40px display couple name + right-aligned stats (INVITADOS 84, JUEGOS 07, PUNTOS 12.4K in Fraunces).
- 3×2 grid of game tiles: small 40px colored icon top-right, `● ACTIVO` chip in game color, display title, activity line, split footer with "JUGANDO" count + PAUSAR/VER buttons.
- Foot rule: room code, LIVE time, URL.

## Interactions & Behavior

### Guest join flow
1. Guest lands on Home → taps "Invitado · QR".
2. Camera scans QR, OR they enter 6-char event code (e.g. `NACHOFLOR22`) and name.
3. Server creates a guest session (UUID + display name + event room).
4. Guest returns to Home, now shows game grid with **live indicators** on games the admin has started.
5. Tapping a live game drops them directly into play.

### Admin flow
1. Open `/admin/login` on a laptop/TV → email + password.
2. Land on admin dashboard (Dir A = live game view with answer distribution; Dir B = overview grid of all games).
3. Admin can **Start / Pause / Next round / Reveal answer / End** per game.
4. TV view mirrors whatever game is "featured" — guests on mobile see synchronized state.

### Quiz round timing
- Timer: 15 seconds per question (configurable by admin).
- On submit: lock card, show correct/wrong state, award points (`max(100, 1000 - elapsed_ms)`).
- After all players answer OR timer expires → reveal answers for 5s → auto-advance.

### Bingo
- Each cell has `{id, label, verifications: UserId[]}`.
- Tapping a cell opens a simple modal: "¿Quién cumple esto?" with a list of guests present, multi-select, optional photo upload.
- Cell marks stamped when ≥1 verification. 5-in-a-row triggers confetti + "¡BINGO!" overlay.

### Adivina Quién
- Each prompt is binary (novio vs novia). One vote per guest per prompt.
- Live percentage shown to all as votes come in.
- After 10s (or admin advance), reveal the couple's "real" answer (stored pre-game in admin setup).

### Deseos
- Simple append-only feed; messages auto-rotate on the TV view every 6s with a gentle fade.
- Profanity filter + admin can delete.

### Animations
- Card taps: `transform: scale(0.97)` 120ms, cubic-bezier(0.2, 0.8, 0.4, 1).
- Screen transitions: 200ms slide/fade.
- Confetti on bingo win: use `canvas-confetti` or similar.
- TV leaderboard reorder: FLIP animation, 400ms ease-out.

### States to implement
- Loading (skeletons matching card shape).
- Empty (no games started yet → show illustrated empty state, "El anfitrión aún no comenzó ningún juego").
- Error (connection lost → inline banner in game-soft color).
- Disabled buttons (opacity 0.5, cursor not-allowed).

## State & Data Model

```ts
type Event = {
  id: string;
  code: string;           // "NACHOFLOR22"
  coupleNames: [string, string];
  date: string;           // ISO
  mode: 'light' | 'dark';
  lang: 'rio' | 'neutro';
};

type Guest = {
  id: string;
  eventId: string;
  displayName: string;
  avatarHue: number;      // used to color their avatar dot
  joinedAt: number;
};

type GameSession = {
  id: string;
  eventId: string;
  type: 'bingo' | 'quiz' | 'guess' | 'wishes' | 'timeline' | 'photo' | 'playlist';
  status: 'idle' | 'live' | 'paused' | 'ended';
  currentRound: number;
  config: any;            // per-game
};

type QuizQuestion = {
  id: string; prompt: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  timeLimitMs: number;
};
```

Real-time layer: WebSocket or Supabase Realtime / Convex subscriptions. Keep per-game state server-authoritative; clients send intents only.

## Responsive behavior
- Guest screens are **mobile-only** (max-width 480px centered on larger viewports with an ivory backdrop).
- Admin dashboard is **desktop/TV-first** at 16:10 (800×500 in mocks, target 1920×1200 full-screen for projection). Below 768px, degrade to a single-column card list.

## Tweaks / Config exposed at runtime (from the prototype)
- Mode (light/dark)
- Language (rio/neutro)
- Logo typography (Unbounded / Fraunces / Bricolage)
- Couple names
- Per-game display names

These can all live as fields on the `Event` record so each couple customizes their room.

## Assets
- **Couple illustration** — NOT included; the mock uses a striped placeholder. Real asset is a square PNG/SVG the couple uploads in admin setup (≥600×600).
- **Game glyphs** — simple inline SVGs, see `primitives.jsx` → `WPGameGlyph`. Easy to re-draw in the target codebase or import as React components.
- **Logo mark** — two interlocking rings + a play triangle, defined inline in `WPLogo`. Gradient pink → orange.
- **QR codes** — mocked with decorative patterns. Use `qrcode` / `qrcode.react` in production.
- **Emoji** — only a handful (💍 🔔 🏆 📸 ✉ 🔴 ☀ ☾). Consider replacing with icon set (Lucide, Phosphor) if the existing design system prefers.

## Copy reference (Spanish rioplatense)
All user-facing copy in the mocks is the intended final copy. See `tokens.jsx` → `WP_I18N.rio` for the authoritative strings:
- `play: "Jugá"`, `tagline: "Juegos para tu boda"`
- `join: "Entrar a la fiesta"`, `scan: "Escaneá el QR o ingresá el código"`
- Bingo cells, quiz question, Adivina prompts and Deseos messages are in the relevant dir-a / dir-b files.

## Files in this bundle
- `WedPlay.html` — entry point; loads the 5 JSX files below into a pan/zoom canvas.
- `tokens.jsx` — `WP_GAMES`, `WP_MODE`, `WP_LOGO_FONTS`, `WP_I18N`, `wpConfetti()`.
- `primitives.jsx` — `WPPhoneFrame`, `WPTVFrame`, `WPLogo`, `WPButton`, `WPChip`, `WPGameGlyph`.
- `dir-a.jsx` — Dir A screens: `DirA_Home`, `DirA_GuestLogin`, `DirA_AdminLogin`, `DirA_Bingo`, `DirA_Quiz`, `DirA_AdminTV`.
- `dir-b.jsx` — Dir B screens: `DirB_Home`, `DirB_GuestLogin`, `DirB_AdminLogin`, `DirB_GuessWho`, `DirB_Wishes`, `DirB_AdminTV`.
- `design-canvas.jsx` — the pan/zoom host (not part of the product; ignore when porting).

Open `WedPlay.html` locally to see the full canvas with both directions side by side.

## Not yet mocked
- Timeline, Foto Challenge, Playlist game screens — follow the same structural pattern per direction.
- Admin onboarding (creating an event, uploading couple photo, setting questions).
- End-of-night summary / thank-you screen.
- Push notifications / email invites.

Ask the designer for these before implementation, or use the two games that are mocked in each direction as the pattern reference.
