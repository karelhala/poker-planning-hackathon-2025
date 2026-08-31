# Implementation Order — Batched by Pattern

Items grouped by shared mechanism. Each batch adds ONE new pattern, then remaining items in that batch are near-free copies.

Status: ⬜ Not started | 🟡 In progress | ✅ Done

## Already Built

- ✅ Points system (Phase 3)
- ✅ Shop UI + item catalog (Phase 5)
- ✅ ChipStack + Ghost Stacks S/M/XL 👻 (Phase 6)
- ✅ Tomato 🍅 (targeting + broadcast + visual pipeline proven)

---

## Batch 1: Broadcast-Only Effects

**New mechanism:** `sendEvent → all players render visual → auto-clear after duration`

No targeting needed. Player uses item, everyone sees effect.

| # | Item | Cost | Effort | Key Implementation |
|---|------|------|--------|--------------------|
| 1 | ✅ Applause 👏 | 2 pts | Trivial | Floating 👏 emojis from user's seat, 2s duration |
| 2 | ✅ Megaphone 📢 | 3 pts | Trivial | Flag on use, "VOTED!" banner flash on next vote |
| 3 | ✅ Earthquake 🌍 | 5 pts | Small | Randomize seat positions, CSS transition, reset next round |
| 4 | ✅ Rainbow Table 🌈 | 30 pts | Small | CSS `hue-rotate` animation on felt, persists until session end |
| 5 | ✅ Confetti Cannon 🎉 | 5 pts | Small | Particle effect on consensus (spread === 0), permanent item |

**Broadcast event shape:**
```typescript
sendEvent('applause', { userId, userName })
sendEvent('earthquake', { shuffledOrder: number[] })
sendEvent('rainbow_table', { userId })
// Megaphone: sendEvent('megaphone_vote', { userId, userName }) — triggered on vote, not on use
// Confetti: triggered locally when consensus detected + player owns item
```

**Files:** `useSupabaseRealtime.ts` (events), `PokerTable.tsx` (effects), `App.tsx` (megaphone flag)

---

## Batch 2: Self-Flag Items

**New mechanism:** Presence flag modifies local rendering/behavior. No targeting.

Player uses item → sets flag in own state → flag changes how game renders/behaves for them.

| # | Item | Cost | Effort | Key Implementation |
|---|------|------|--------|--------------------|
| 6 | ✅ Dice 🎲 | 3 pts | Trivial | Pick random from current scale, call `onVote(random)` |
| 7 | ✅ Poker Face 🃏 | 3 pts | Small | Override `hasVoted: false` in presence even after voting |
| 8 | ✅ Invisible Ink 🫥 | 4 pts | Small | Card blank on reveal, CSS fade-in after 5s |
| 9 | ✅ Disguise 🥸 | 4 pts | Small | Override name → "???" and avatar → silhouette in presence |
| 10 | ✅ Shield 🛡️ | 3 pts | Medium | Check flag in ALL special card handlers, shield icon at seat |

**Notes:**
- Dice is near-zero — existing `?` random card does same thing, just auto-trigger it
- Shield is hardest — touches Copy, Shuffle, Block, and all shop targeting items
- Do Shield last in batch so all targetable items exist to test against

**Files:** `useSupabaseRealtime.ts` (presence flags), `PokerTable.tsx` (rendering overrides), `App.tsx` (dice handler)

---

## Batch 3: Targeting Effects

**Pattern already proven by Tomato 🍅.** Same flow: use item → targeting mode → click seat → broadcast → render effect on target.

| # | Item | Cost | Effort | Key Implementation |
|---|------|------|--------|--------------------|
| 12 | ✅ Spotlight 🔦 | 3 pts | Trivial | CSS radial gradient overlay on target seat, 10s duration |
| 13 | ✅ Mirror 🪞 | 4 pts | Small | 
`transform: scaleX(-1) scaleY(-1)` on target's VotingCards |
| 14 | ✅ Smoke Bomb 💨 | 5 pts | Medium | Smoke overlay on target cards, click 5-8× to clear |
| 15 | ✅ Flamethrower 🔥 | 8 pts | Medium | Fire CSS animation on whole table felt, burnt card edges |

**Files:** `useSupabaseRealtime.ts` (events), `PokerTable.tsx` (overlays), `VotingCards.tsx` (mirror/smoke on cards)

---

## Batch 4: Cosmetic Permanents

**New mechanism:** Permanent items stored via presence data. No consumable logic. Rendered at seat for all to see.

| # | Item | Cost | Effort | Key Implementation |
|---|------|------|--------|--------------------|
| 16 | ⬜ Name Color 🎨 | 3 pts | Small | Color picker dialog on buy, `nameColor` in presence |
| 17 | ⬜ Dealer Hat 🎩 | 25 pts | Small | Hat emoji/SVG above avatar, subtle bob animation |
| 18 | ⬜ Crown 👑 | 12 pts | Medium | Single-owner global state, buying transfers from current owner |

**Files:** `PokerTable.tsx` (rendering), `useSupabaseRealtime.ts` (presence fields, crown state)

---

## Batch 5: Complex Mechanics

Each needs unique logic. Implement one at a time. Ordered by fun-to-effort ratio.

| # | Item | Cost | Effort | Key Implementation |
|---|------|------|--------|--------------------|
| 19 | ⬜ Swap 🔄 | 5 pts | Medium | After voting, swap vote with random player on reveal |
| 20 | ✅ Table Cloth 🟩 | 15 pts | Medium | Color picker + broadcast felt color change to all |
| 21 | ⬜ Golden Ticket 🎫 | 50 pts | Medium | 3× vote weight in average calculation |
| 22 | ⬜ Magnet 🧲 | 6 pts | Medium-High | Nudge nearby votes ±1 in displayed average |
| 23 | ⬜ Time Bomb 💣 | 7 pts | High | 30s countdown, auto-reveal, timer sync across clients |
| 24 | ⬜ Telescope 🔭 | 6 pts | High | Private data exchange (new architecture needed) |
| 25 | ⬜ Jumping Button 🐇 | 10 pts | High | Bouncing reveal button minigame, position sync |

**Cut candidates:** Time Bomb, Telescope, Jumping Button — each needs unique architecture. Cut without losing much if time is short.

---

## Not Yet Planned (Phase 4/7/9)

These require new systems beyond individual items:

- **DiceBear Avatars** (Phase 4) — new dependency, avatar editor, localStorage persistence
- **Avatar Shop Gating** (Phase 9) — locks avatar options behind purchases
- **Social Actions & Admin Awards** (Phase 7) — player-initiated requests, admin approval flow, Make It Rain minigame, session leaderboard
- **Card Skins 🎴** — custom card back CSS per player
- **Seat Cushion 💺** — glow/border variants at seat

These are independent feature tracks, not individual shop items. Plan separately.

---

## Summary

| Batch | Items | Est. Effort | Cumulative |
|-------|-------|-------------|------------|
| 1 — Broadcast Effects | 5 | Small | 5 items |
| 2 — Self-Flag Items | 5 | Small-Medium | 10 items |
| 3 — Targeting Effects | 4 | Small-Medium | 14 items |
| 4 — Cosmetic Permanents | 3 | Small-Medium | 17 items |
| 5 — Complex Mechanics | 7 | Medium-High | 24 items |
| **Total** | **24** | | |

**Start with Batch 1.** Highest fun-per-effort ratio. 5 items, each ~30 min.
