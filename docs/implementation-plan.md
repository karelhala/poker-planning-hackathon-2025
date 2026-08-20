# Implementation Plan - Poker Planning Gamification

Broken into phases. Each phase is independently shippable. Later phases build on earlier ones.

---

## Phase 3: Point System Foundation

**Goal:** Players earn points automatically. Points visible at seat and header. No shop yet — just earning and displaying.

### 3a: Point State & Storage
- Add `points` to player model in `useSupabaseRealtime.ts`
- Points are **session-scoped** — stored in React state only, NOT localStorage
- Leave room or close tab = points reset to 0
- Broadcast point count via Supabase presence (so others see your total)
- Creates "use it or lose it" urgency — spend before session ends

### 3b: Automatic Point Triggers
- +2 on vote cast (in `updateVotingStatus`)
- +3 on consensus / +1 on close agreement (in `handleRevealCards`, check spread)
- +1 first to vote (track first voter per round)
- +1 closest to average (calculate on reveal)
- +1 streak bonus (track consecutive rounds in state)
- +5 session started (on room join, once per session)
- +5 all tickets completed (when last loaded ticket is voted on)

### 3c: Point Display
- Show point count as chip icon + number at each player's seat on table (next to name)
- Show own points in header bar (persistent, always visible)
- Brief "+N" floating animation at seat when points are earned
- Point change broadcast to all players

**Files to modify:** `useSupabaseRealtime.ts`, `UserContext.tsx`, `PokerTable.tsx`, `Header.tsx`
**New files:** none (extend existing)
**Estimated scope:** Medium

---

## Phase 4: DiceBear Avatar Integration

**Goal:** Replace initials-based avatars with DiceBear pixel-art avatars. Default random avatar based on userId seed.

### 4a: Install & Basic Integration
- `npm i @dicebear/core @dicebear/pixel-art`
- Create `src/services/avatarService.ts` — wrapper around DiceBear API
- Generate default avatar from `userId` seed
- Replace MUI `<Avatar>` in `PokerTable.tsx` with DiceBear SVG data URI

### 4b: Avatar Persistence (localStorage)
- Store full avatar config in `localStorage` under key `avatarConfig`:
  ```json
  {
    "style": "pixel-art",
    "hair": "short03",
    "hairColor": "2c1b18",
    "eyes": "variant01",
    "beard": null,
    "beardColor": null,
    "mouth": "happy01",
    "hat": null,
    "hatColor": null,
    "glasses": null,
    "accessories": null,
    "clothing": "variant01",
    "clothingColor": null,
    "tattoo": null,
    "unlockedItems": ["hair:short01", "hair:short03", "hair:long01", "eyes:variant01", "eyes:variant06", "beard:none", "beard:variant01", "mouth:happy01", "mouth:happy03", "glasses:none", "glasses:light01", "clothing:variant01", "clothing:variant03"]
  }
  ```
- `unlockedItems` array tracks all purchased/free items — persists across sessions
- On first load: populate with free starter kit items
- Avatar renders from saved config every session — no re-purchase needed

### 4c: Avatar Config in Presence
- Broadcast avatar config (minus `unlockedItems`) via Supabase presence payload
- Other players render each other's customized avatars
- Only broadcast equipped selections, not full inventory

### 4d: Avatar Editor (Basic)
- Add avatar editor modal (accessible from user settings or avatar click)
- Grid picker for each category showing all variants as previews
- Free items: selectable immediately
- Locked items: grayed out with lock icon + cost (purchase handled in Phase 9)
- Color pickers for hair, beard, clothing, hat (natural colors free)
- Live preview of full avatar
- Save persists to `localStorage` + broadcasts updated config to room

**Files to modify:** `PokerTable.tsx`, `UserContext.tsx`, `UserModal.tsx`, `useSupabaseRealtime.ts`
**New files:** `src/services/avatarService.ts`, `src/components/AvatarEditor.tsx`
**Dependencies:** `@dicebear/core`, `@dicebear/pixel-art`
**Estimated scope:** Medium

---

## Phase 5: Shop UI

**Goal:** Shop modal where players spend points on items. Item inventory stored locally.

### 5a: Shop Data Model
- Define item catalog: `src/data/shopItems.ts`
  - Each item: `{ id, name, icon, description, cost, category, type, rarity }`
  - Categories: `gameplay`, `cosmetic`, `avatar`, `social`, `rare`
  - Types: `single-use`, `permanent`, `session`
- Player inventory is **session-scoped** (in-memory state only):
  ```json
  {
    "points": 42,
    "consumableItems": [{ "id": "smoke-1", "itemType": "smoke_bomb" }, ...],
    "ghostStackSize": 0
  }
  ```
- Points, consumable items, and ghost stacks reset when leaving a room or joining a new one
- This is intentional — points are earned fresh each session, spent during that session
- Creates urgency to spend points before session ends ("use it or lose it")
- **Only avatar config persists in localStorage** (see Phase 4b) — unlocked avatar features carry across all sessions and rooms
- Broadcast owned item count (not details) via Supabase presence

### 5b: Shop Modal UI
- Accessible from header (shop icon + point balance)
- Tabbed layout: Gameplay | Cosmetic | Avatar | Social | Rare
- Each item: card with icon, name, description, cost, buy button
- Grayed out if not enough points
- Owned items show checkmark (permanent) or count (consumable)
- Category filters and search

### 5c: Purchase Flow
- Click buy — confirm dialog with cost
- Deduct points, add to inventory
- Broadcast updated point count + item count (stack height) to all players
- Animation: new chip appears on your stack (right side of screen)

**Files to modify:** `Header.tsx`, `App.tsx`
**New files:** `src/components/ShopModal.tsx`, `src/data/shopItems.ts`, `src/hooks/useInventory.ts`
**Estimated scope:** Medium-Large

---

## Phase 6: Poker Chip Stack (Item Inventory UI)

**Goal:** Visual chip stack for owned items. Your stack on right side of screen, others' stacks at their seats.

### 6a: Your Stack (Fixed Right Side)
- Fixed position component on right edge of viewport
- Renders owned consumable items as colored poker chips
- Hover: chips spread apart to show contents
- Click chip: activate item (triggers targeting mode or immediate effect)
- Empty state: ghost chip outline, click to open shop
- Ghost stack items (if purchased) render at bottom, translucent

### 6b: Others' Stacks (At Table Seats)
- Small chip stack icon at each player's seat in `PokerTable.tsx`
- Stack height = item count + ghost stack bluff count
- Broadcast item count via presence (not item details)
- When item activated: chip flies from seat, effect triggers for all

### 6c: Item Activation Flow
- Single-use items: consume on use, chip flies off with poof
- Targeting items: enter targeting mode (reuse existing `activeTargeting` system)
- Self/table items: immediate activation with broadcast
- All activations broadcast via Supabase so all players see effects

**Files to modify:** `PokerTable.tsx`, `App.tsx`, `useSupabaseRealtime.ts`
**New files:** `src/components/ChipStack.tsx`, `src/components/ChipStackMini.tsx`
**Estimated scope:** Medium

---

## Phase 7: Social Actions & Admin Awards

**Goal:** Player-initiated social action buttons. Admin award system with broadcast animations.

### 7a: Social Action Buttons (Player Side)
- Add small icon row at player's seat on table: 🎤 🤔 ❓
- Player clicks: sends request via Supabase broadcast
- Admin sees toast notification: "Karel wants to Present 🎤" with Approve/Deny
- On approve: award points, animation at player's seat
- Each action usable once per ticket (tracked per round)

### 7b: Admin Awards
- Extend admin grant menu (click on player seat) with award options
- Awards: 💡 Great Insight (+3), 🎯 Spot On (+2), ⭐ MVP (+5), 🤝 Helpful (+2)
- On award: broadcast to all players
  - Animated icon floats up from player's seat
  - Banner across table: "Karel earned 💡 Great Insight! +3 pts"
  - Award badge appears at player's seat for the round
- Awards accumulate visibly at seat

### 7c: Make It Rain (Admin Power)
- Admin button in table center or controls
- Pick variant: Light Drizzle / Make It Rain / Jackpot
- Broadcast rain event to all players
- Render falling chips across table surface (10-15 seconds)
- Players click to catch: +1 per gold chip, +3 per rare blue
- Scoreboard popup after rain ends

### 7d: Session Leaderboard
- Track total points earned, awards received per player per session
- Viewable anytime (button in header or action log)
- Summary at session end: top earner, most awards, most items used

**Files to modify:** `PokerTable.tsx`, `useSupabaseRealtime.ts`, `Header.tsx`
**New files:** `src/components/SocialActions.tsx`, `src/components/AdminAwardMenu.tsx`, `src/components/MakeItRain.tsx`, `src/components/SessionLeaderboard.tsx`
**Estimated scope:** Large

---

## Phase 8: Gameplay Items (Shop Powers)

**Goal:** Implement purchasable gameplay items from the shop. Each item is a new broadcast event + visual effect.

### Priority order (easiest to hardest):

#### Tier 1 — Simple (reuse existing patterns)
1. **Dice 🎲** — Random vote. Just a vote handler variant. No broadcast needed.
2. **Shield 🛡️** — Flag on player. Block next special card. State tracked in hook.
3. **Poker Face 🃏** — Hide voted status. Override `hasVoted` display for others.
4. **Invisible Ink 🫥** — Delay card reveal. CSS animation (opacity 0 → 1 after 5s).

#### Tier 2 — Moderate (new visual effects)
5. **Smoke Bomb 💨** — Overlay on target's cards. Click-to-clear mechanic.
6. **Mirror 🪞** — CSS transform on target's cards: `scaleX(-1) scaleY(-1)`.
7. **Swap 🔄** — After voting, swap vote values between two players. Hook logic.
8. **Telescope 🔭** — Peek at one card. Private data sent only to requester.

#### Tier 3 — Complex (new UI mechanics)
9. **Time Bomb 💣** — Countdown overlay on table. Auto-reveal on zero.
10. **Earthquake 🌍** — Shuffle seat positions. Animate seat transitions.
11. **Magnet 🧲** — Modify average calculation display. Visual pull effect.
12. **Flamethrower 🔥** — Full table fire effect (CSS animation overlay).
13. **Jumping Reveal Button 🐇** — Moving button minigame. Click counter.

**Files to modify:** `useSupabaseRealtime.ts` (new broadcast events), `PokerTable.tsx`, `VotingCards.tsx`
**New files:** `src/components/effects/` directory with per-effect components
**Estimated scope:** Large (implement incrementally)

---

## Phase 9: Avatar Shop Gating

**Goal:** Lock avatar customization options behind the shop. Free defaults, paid unlocks.

### 9a: Lock/Unlock System
- Define which avatar options are free vs paid in `shopItems.ts`
- Each category: 1-2 free options, rest require purchase
- Avatar editor shows locked items grayed with cost
- Purchase unlocks permanently (stored in localStorage)

### 9b: Cosmetic Items Integration
- Card Skins: custom card back CSS per player, broadcast via presence
- Seat Cushion: glow/border effect at seat, broadcast via presence
- Crown: single-owner item, tracked globally via broadcast
- Name Color: colored name text, stored in avatar config
- Ghost Stack: render ghost chips in stack component
- Table Cloth: admin broadcasts felt color change to all

### 9c: Tattoo System (Custom Overlays)
- Custom SVG overlay system on top of DiceBear avatar
- Position tattoo elements relative to avatar bounding box
- Store tattoo selections in avatar config
- Render as additional SVG layer over the avatar

**Files to modify:** `AvatarEditor.tsx`, `PokerTable.tsx`, `shopItems.ts`
**New files:** `src/components/AvatarOverlay.tsx`, `src/data/tattoos.ts`
**Estimated scope:** Medium

---

## Phase 10: Social Items & Rare Items

**Goal:** Fun social interactions and aspirational rare items.

### 10a: Social Items
- **Tomato 🍅** — Splat effect on target avatar (CSS animation, fades after 3s)
- **Applause 👏** — Clapping animation broadcast to all
- **Disguise 🥸** — Override name/avatar to "???" for one round
- **Megaphone 📢** — Flash + banner when voting
- **Spotlight 🔦** — Glow effect on target seat

### 10b: Rare Items
- **Golden Ticket 🎫** — 3x vote weight in average. Modify calculation.
- **Table Flip Immunity 🛑** — Persist vote across reset. Hook logic.
- **Dealer Hat 🎩** — Animated hat cosmetic. DiceBear overlay.
- **Rainbow Table 🌈** — Cycling table color CSS animation for all.

**Files to modify:** `useSupabaseRealtime.ts`, `PokerTable.tsx`
**New files:** `src/components/effects/Tomato.tsx`, `src/components/effects/Spotlight.tsx`, etc.
**Estimated scope:** Medium

---

## Phase Summary

| Phase | Name | Dependencies | Scope | Shippable alone? |
|-------|------|-------------|-------|-------------------|
| 3 | Point System | — | Medium | Yes |
| 4 | DiceBear Avatars | — | Medium | Yes |
| 5 | Shop UI | Phase 3 | Medium-Large | Yes (with Phase 3) |
| 6 | Chip Stack UI | Phase 5 | Medium | Yes (with Phase 5) |
| 7 | Social Actions & Awards | Phase 3 | Large | Yes (with Phase 3) |
| 8 | Gameplay Items | Phase 5, 6 | Large | Incremental |
| 9 | Avatar Shop Gating | Phase 4, 5 | Medium | Yes (with Phase 4, 5) |
| 10 | Social & Rare Items | Phase 5, 6 | Medium | Incremental |

**Recommended order:** 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

Phases 3 and 4 are independent — can run in parallel. Everything else chains from Phase 3 (points) and Phase 5 (shop).
