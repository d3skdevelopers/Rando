# Rando → Gaming Pivot

## The problem
Gamers play alone but don't want to feel alone. Between matches, mid-tilt,
post-clutch — there's no one to talk to. Discord requires friends. Reddit
is slow. Rando fixes that: instant, anonymous, always another gamer.

## What changed

### New / updated pages
| File | What |
|------|------|
| `app/page.tsx` | Gaming-focused hero: "Someone to talk to." — Between matches / mid-tilt / post-clutch taglines. 4 feature cards for gaming use cases. Live gamer count. |
| `app/matchmaking/page.tsx` | Mood selector (Hyped / Tilted / Chilling / Need a squad) before queue. "Find Lobby" / "Leave Lobby" language. Orb says 🎮. |
| `app/chat/end/[id]/page.tsx` | "GG" screen. "Rate the game" rating. Register gate uses gaming FOMO: rematch, lobby history, squad building. "New Lobby" as skip CTA. |

### Updated components
| File | What |
|------|------|
| `components/chat/ChatHeader.tsx` | Shows partner's mood (🔥 Hyped, 💢 Tilted, etc.) under their alias. "Leave lobby" tooltip on ✕. |
| `components/chat/RegisterNudge.tsx` | After 5 messages: "GG — join free →" instead of generic "Register". |

### New lib
| File | What |
|------|------|
| `lib/gamerAlias.ts` | `generateGamerAlias()` → "Toxic Cobra", "Silent Mantis", etc. Use this in `useIdentity.ts` to assign aliases when a guest joins a chat. |

## What did NOT change
- Design: same `#0a0a0f` background, purple `#7c3aed` gradient, Georgia serif, floating orbs, grid pattern
- Auth flow, Supabase wiring, matchmaking hook, all existing pages
- hCaptcha gate on landing
- All bug fixes from previous builds

## Wire up gamer aliases
In `hooks/useIdentity.ts`, where a display name is generated for guest sessions,
import and call `generateGamerAlias()` instead of the current random name logic:

```ts
import { generateGamerAlias } from '@/lib/gamerAlias'
// ...
const display_name = generateGamerAlias() // e.g. "Cracked Falcon"
```

## Mood persistence
The mood selected on `/matchmaking` should be stored in the chat session's
`shared_interests` or a new `mood` column so `ChatHeader` can read it.
For now it defaults to the passed prop — wire through `useChat` when ready.
