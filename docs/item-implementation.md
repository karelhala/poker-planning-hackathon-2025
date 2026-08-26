# Item Implementation Guide

Each item's implementation broken down by complexity and what needs to change. Items ordered by implementation difficulty (easiest first).

Status: ⬜ Not started | 🟡 In progress | ✅ Done

---

## Tier 1 — Simple (local state only, no broadcast needed)

### ⬜ Dice 🎲 (Normal, 3pts, Consumable)
**What it does:** Replaces your vote with a random value from the current scale.
**Implementation:**
- On use: pick random value from CARDS (fibonacci) or TSHIRT_SIZES (tshirt)
- Call `onVote(randomValue)` automatically
- Show brief animation at seat: dice rolling emoji
**Files:** `App.tsx` (handler), `VotingCards.tsx` (already has random card — reuse logic)
**Broadcast:** None — just a vote, other players see it normally
**Effort:** Trivial — essentially clicking the existing "?" random card automatically

---

### ⬜ Tomato 🍅 (Normal, 2pts, Consumable)
**What it does:** Throw a tomato at another player. Splat on their avatar for 3 seconds.
**Implementation:**
- On use: enter targeting mode (reuse existing `activeTargeting` system)
- On target selected: broadcast `tomato_throw` event with target userId
- Target's seat shows tomato splat overlay (red circle with 🍅) for 3 seconds
- All players see the splat
**Files:** `useSupabaseRealtime.ts` (new event), `PokerTable.tsx` (splat overlay on seat)
**Broadcast:** `tomato_throw` → `{ targetUserId, thrownBy }`
**Effort:** Small — reuses targeting, simple CSS overlay

---

### ⬜ Applause 👏 (Normal, 2pts, Consumable)
**What it does:** Trigger clapping animation visible to everyone.
**Implementation:**
- On use: broadcast `applause` event
- All players see 👏 emojis floating up from the user's seat for 2 seconds
- Optional: brief "Karel clapped!" notification
**Files:** `useSupabaseRealtime.ts` (new event), `PokerTable.tsx` (floating emojis)
**Broadcast:** `applause` → `{ userId, userName }`
**Effort:** Small — floating emoji animation, simple broadcast

---

### ⬜ Megaphone 📢 (Normal, 3pts, Consumable)
**What it does:** When you vote, your name flashes with a "VOTED!" banner.
**Implementation:**
- On use: set a flag `hasMegaphone = true` (session state)
- When voting with megaphone active: broadcast `megaphone_vote` event
- All players see a "VOTED!" banner flash across the table with user's name
- Megaphone consumed after one vote
**Files:** `useSupabaseRealtime.ts` (new event), `PokerTable.tsx` (banner overlay)
**Broadcast:** `megaphone_vote` → `{ userId, userName }`
**Effort:** Small

---

## Tier 2 — Moderate (broadcast + state tracking)

### ⬜ Shield 🛡️ (Normal, 3pts, Consumable)
**What it does:** Blocks the next special card used on you.
**Implementation:**
- On buy/use: set `hasShield = true` in player state
- Broadcast shield status via presence (others see shield icon at seat)
- When any special card (Block, Shuffle, Copy, shop items) targets this player:
  - Check shield → if active, cancel the effect, consume shield
  - Show "🛡️ Blocked!" animation at seat
  - Notify both players
**Files:** `useSupabaseRealtime.ts` (check in all special card handlers), `PokerTable.tsx` (shield icon at seat)
**Broadcast:** Shield status in presence data + `shield_blocked` event when triggered
**Effort:** Medium — touches multiple existing handlers

---

### ⬜ Poker Face 🃏 (Normal, 3pts, Consumable)
**What it does:** Hide your "Voted" status from others.
**Implementation:**
- On use: set `hasPokerFace = true`
- When tracking presence with vote, override `hasVoted: false` in the broadcast even though you've voted
- Your card at seat stays as "thinking" (dashed outline) even after voting
- On reveal: your card appears normally — surprise!
- Consumed when round ends
**Files:** `useSupabaseRealtime.ts` (override presence `hasVoted`), `PokerTable.tsx` (no visual change needed)
**Broadcast:** Modified presence data (hasVoted stays false)
**Effort:** Medium — need to carefully separate local voted state from broadcast state

---

### ⬜ Invisible Ink 🫥 (Normal, 4pts, Consumable)
**What it does:** Your card appears blank on reveal, value fades in after 5 seconds.
**Implementation:**
- On use: set `hasInvisibleInk = true`
- On reveal: broadcast `invisible_ink_active` for this player
- All players see this player's card as blank/empty on reveal
- After 5 seconds: CSS fade-in animation reveals the actual value
- Consumed when round ends
**Files:** `useSupabaseRealtime.ts` (new flag), `PokerTable.tsx` (delayed card value render)
**Broadcast:** `invisible_ink_active` → `{ userId }` or via presence flag
**Effort:** Medium — timing + animation coordination

---

### ⬜ Mirror 🪞 (Normal, 4pts, Consumable)
**What it does:** Target player's voting cards are mirrored (upside down and reversed).
**Implementation:**
- On use: enter targeting mode
- On target selected: broadcast `mirror_effect` event
- Target player's VotingCards get CSS `transform: scaleX(-1) scaleY(-1)` on the card content
- Numbers appear upside down and mirrored — still clickable but confusing
- Effect lasts until round ends
**Files:** `useSupabaseRealtime.ts` (new event + state), `VotingCards.tsx` (conditional CSS transform)
**Broadcast:** `mirror_effect` → `{ targetUserId, mirroredBy }`
**Effort:** Medium — CSS transform on card content, targeting

---

### ⬜ Smoke Bomb 💨 (Normal, 5pts, Consumable)
**What it does:** Obscure a player's cards with smoke. They click rapidly to clear.
**Implementation:**
- On use: enter targeting mode
- On target selected: broadcast `smoke_bomb` event
- Target player's VotingCards get a smoke overlay (gray/white gradient, animated opacity)
- Target must click 5-8 times on the smoke to clear it
- Click counter shown: "Click to clear! (3/8)"
- After clearing: normal cards visible again
**Files:** `useSupabaseRealtime.ts` (new event), `VotingCards.tsx` (smoke overlay component with click counter)
**Broadcast:** `smoke_bomb` → `{ targetUserId, smokedBy }`
**Effort:** Medium — new overlay with click interaction

---

### ⬜ Swap 🔄 (Normal, 5pts, Consumable)
**What it does:** After voting, secretly swap your vote with a random player's.
**Implementation:**
- On use: set `hasSwap = true` (activates after you vote)
- After you vote: pick random other player who has voted
- On reveal: broadcast `swap_executed` with both players' votes swapped
- Both players see their displayed vote changed
- Neither knows until reveal — surprise!
**Files:** `useSupabaseRealtime.ts` (swap logic in reveal handler), `PokerTable.tsx` (swap animation)
**Broadcast:** `swap_executed` → `{ player1, player2, vote1, vote2 }`
**Effort:** Medium — needs to modify vote display on reveal, timing critical

---

### ⬜ Earthquake 🌍 (Normal, 5pts, Consumable)
**What it does:** All player seats shuffle to random positions.
**Implementation:**
- On use: broadcast `earthquake` event
- All players: randomize seat positions for the current round
- Animate seats sliding to new positions (CSS transition)
- Reset on next round
**Files:** `useSupabaseRealtime.ts` (new event + shuffled positions state), `PokerTable.tsx` (override seat positions)
**Broadcast:** `earthquake` → `{ shuffledOrder: number[] }` (randomized player indices)
**Effort:** Medium — seat position override + animation

---

### ⬜ Confetti Cannon 🎉 (Normal, 5pts, Permanent)
**What it does:** Auto-fires confetti when your round hits perfect consensus.
**Implementation:**
- On buy: store in permanent items
- On reveal: if spread === 0 and player has confetti cannon, trigger confetti
- Confetti animation: particles falling across the table (reuse or adapt existing effects)
- All players see it (broadcast or trigger locally based on consensus check)
**Files:** `PokerTable.tsx` or new `ConfettiEffect.tsx`
**Broadcast:** Can be local — each player checks if any player in room has confetti + consensus
**Effort:** Medium — confetti particle animation

---

### ⬜ Spotlight 🔦 (Rare, 3pts, Consumable)
**What it does:** Highlight target player with a spotlight beam.
**Implementation:**
- On use: enter targeting mode
- On target selected: broadcast `spotlight` event
- Target seat gets a bright radial gradient overlay (spotlight cone from above)
- Lasts 10 seconds
**Files:** `useSupabaseRealtime.ts` (new event), `PokerTable.tsx` (spotlight CSS overlay)
**Broadcast:** `spotlight` → `{ targetUserId, spotlitBy }`
**Effort:** Small-Medium — CSS radial gradient overlay

---

### ⬜ Disguise 🥸 (Rare, 4pts, Consumable)
**What it does:** Your name and avatar show as "???" for one round.
**Implementation:**
- On use: broadcast `disguise_active` or set in presence
- All players see this player's name as "???" and avatar as generic silhouette
- Player's actual avatar and name hidden until round ends
**Files:** `useSupabaseRealtime.ts` (presence flag), `PokerTable.tsx` (override name + avatar rendering)
**Broadcast:** Presence flag `isDisguised: true`
**Effort:** Medium — override rendering conditionally

---

### ⬜ Name Color 🎨 (Normal, 3pts, Permanent)
**What it does:** Change display name color at your seat.
**Implementation:**
- On buy: open color picker dialog
- Store selected color in avatar config / presence
- Name text at seat rendered with custom color
**Files:** `PokerTable.tsx` (colored name), presence data (nameColor field)
**Broadcast:** Via presence: `nameColor: '#FF5722'`
**Effort:** Small — color picker + conditional text color

---

### ⬜ Ghost Stack S/M/XL 👻 (Normal/Rare/Legendary, 3/6/12pts, Permanent)
**What it does:** Fake chip stacks at your seat.
**Implementation:**
- On buy: store ghost stack size in presence
- Render visual chips at seat (right side of avatar)
- S: 2-3 chips, M: 5-6 chips, XL: 15+ chips (comically tall, dead serious)
- Other players see the stack but can't tell they're fake
**Files:** `PokerTable.tsx` (chip stack visual at seat), presence data
**Broadcast:** Via presence: `ghostStack: 'small' | 'medium' | 'large'`
**Effort:** Medium — new visual component at seat

---

## Tier 3 — Complex (new mechanics, UI elements)

### ⬜ Telescope 🔭 (Rare, 6pts, Consumable)
**What it does:** Peek at one player's face-down card before reveal.
**Implementation:**
- On use: enter targeting mode
- On target selected: request target's vote via private broadcast
- Only requesting player sees a small card preview near target's seat
- Peek is secret — target and others don't know
- Preview disappears after 5 seconds
**Files:** `useSupabaseRealtime.ts` (private data exchange — tricky with broadcast), `PokerTable.tsx` (peek preview)
**Broadcast:** Need a way to send private data — use a separate ephemeral channel or include voter ID filter
**Effort:** High — private data exchange is architecturally new

---

### ⬜ Magnet 🧲 (Rare, 6pts, Consumable)
**What it does:** Nudge nearby votes closer to yours in the displayed average.
**Implementation:**
- On use: set `hasMagnet = true`
- On reveal: modify the displayed average calculation
- Votes within ±2 of your vote get nudged 1 point closer in the display
- Actual votes unchanged — only the "Average" display in table center is affected
- Visual: magnet pull animation on affected vote values
**Files:** `PokerTable.tsx` (modified average display), `useSupabaseRealtime.ts` (magnet state)
**Broadcast:** `magnet_active` → `{ userId }` — others need to know for display
**Effort:** Medium-High — modified calculation + visual feedback

---

### ⬜ Time Bomb 💣 (Rare, 7pts, Consumable)
**What it does:** 30-second timer that auto-reveals cards.
**Implementation:**
- On use: broadcast `time_bomb` event with endTime
- All players see countdown timer overlay on table center
- At zero: auto-trigger reveal (even if admin hasn't clicked)
- Admin can't stop it
- Timer visual: large countdown numbers, ticking animation, red flash at < 5s
**Files:** `useSupabaseRealtime.ts` (new event + auto-reveal timer), `PokerTable.tsx` (timer overlay in center)
**Broadcast:** `time_bomb` → `{ endTime, plantedBy }`
**Effort:** High — timer sync across clients, auto-reveal trigger

---

### ⬜ Flamethrower 🔥 (Rare, 8pts, Consumable)
**What it does:** Table on fire for the round. Cards have burnt edges.
**Implementation:**
- On use: broadcast `flamethrower` event
- All players see fire CSS animation overlay on table felt
- Revealed cards get a burnt/singed edge effect (CSS filter or border effect)
- Lasts until round reset
- Fire: animated orange/red gradient overlay with flicker keyframes
**Files:** `useSupabaseRealtime.ts` (new event + state), `PokerTable.tsx` (fire overlay on felt + burnt card style)
**Broadcast:** `flamethrower` → `{ userId }`
**Effort:** Medium-High — fire animation + card styling

---

### ⬜ Jumping Button 🐇 (Rare, 10pts, Consumable)
**What it does:** Admin must catch the bouncing reveal button 4 times.
**Implementation:**
- On use: broadcast `jumping_button` event
- Admin's reveal button starts moving randomly within the table center area
- Admin must click it 4 times — each click it jumps to new position
- Click counter: "Catch it! (2/4)"
- After 4 catches: cards reveal normally
- All other players watch the admin chase the button (broadcast position updates)
**Files:** `PokerTable.tsx` (bouncing button logic), `useSupabaseRealtime.ts` (event + state)
**Broadcast:** `jumping_button` → `{ userId }`, position updates for spectators
**Effort:** High — minigame mechanics, position sync

---

### ⬜ Crown 👑 (Rare, 12pts, Permanent)
**What it does:** Floating crown above avatar. Only one player can wear it.
**Implementation:**
- On buy: broadcast `crown_claimed` event — takes crown from previous owner
- Crown renders as emoji above avatar at seat
- If another player buys crown, it transfers
- Track current crown holder in shared state
**Files:** `useSupabaseRealtime.ts` (crown holder state), `PokerTable.tsx` (crown visual above avatar)
**Broadcast:** `crown_claimed` → `{ newOwner }` or via presence
**Effort:** Medium — global single-owner state management

---

### ⬜ Table Flip Immunity 🛑 (Legendary, 15pts, Consumable)
**What it does:** Your vote carries over when admin resets.
**Implementation:**
- On use: set `hasTableFlipImmunity = true`
- On reset: instead of clearing vote, keep it
- Re-track presence with previous vote intact
- Consumed on next reset
**Files:** `useSupabaseRealtime.ts` (skip vote clear on reset if immune)
**Broadcast:** None needed — local state, vote persists in presence
**Effort:** Small-Medium — conditional logic in reset handler

---

### ⬜ Table Cloth 🟩 (Legendary, 15pts, Consumable)
**What it does:** Change felt color for all players.
**Implementation:**
- On use: show color picker (red, blue, purple, black, pink)
- Broadcast `table_cloth` event with chosen color
- All players' PokerTable felt gradient changes to selected color
- Resets on round reset
**Files:** `useSupabaseRealtime.ts` (new event + state), `PokerTable.tsx` (dynamic felt color)
**Broadcast:** `table_cloth` → `{ color }`
**Effort:** Medium — color picker + dynamic gradient

---

### ⬜ Dealer Hat 🎩 (Legendary, 25pts, Permanent)
**What it does:** Animated dealer hat on avatar.
**Implementation:**
- On buy: store in permanent items + presence
- Render hat emoji/SVG above avatar (below crown position if both)
- Subtle bob animation
**Files:** `PokerTable.tsx` (hat overlay), presence data
**Broadcast:** Via presence
**Effort:** Small — emoji overlay

---

### ⬜ Rainbow Table 🌈 (Legendary, 30pts, Consumable)
**What it does:** Table cycles through rainbow colors for the session.
**Implementation:**
- On use: broadcast `rainbow_table` event
- All players' table felt continuously cycles through hue rotation
- CSS: `animation: hueRotate 5s linear infinite` on the felt gradient
- Lasts until session ends (not reset on round change)
**Files:** `useSupabaseRealtime.ts` (new event + persistent state), `PokerTable.tsx` (CSS hue-rotate)
**Broadcast:** `rainbow_table` → `{ userId }`
**Effort:** Small-Medium — CSS animation, persistent session state

---

### ⬜ Golden Ticket 🎫 (Legendary, 50pts, Consumable)
**What it does:** Your vote is worth 3x in the average calculation.
**Implementation:**
- On use: set `hasGoldenTicket = true` + broadcast
- On reveal: this player's vote counted 3x in average
- Visual: golden glow on card, "3x" badge at seat
- All players see modified average
**Files:** `useSupabaseRealtime.ts` (modified average calc), `PokerTable.tsx` (golden glow + badge)
**Broadcast:** `golden_ticket_active` → `{ userId }` or via presence
**Effort:** Medium — modified calculation + visual

---

## Recommended Implementation Order

1. **Tomato** 🍅 — Simplest targeting item, tests the buy→use→broadcast→visual pipeline
2. **Applause** 👏 — Simplest broadcast-only item
3. **Dice** 🎲 — Trivial, reuses existing random logic
4. **Megaphone** 📢 — Simple flag + banner
5. **Shield** 🛡️ — Important defensive item, tests hook integration
6. **Poker Face** 🃏 — Tests presence manipulation
7. **Name Color** 🎨 — Simple permanent item
8. **Ghost Stack** 👻 — Tests visual-only permanent items
9. **Spotlight** 🔦 — Simple CSS overlay targeting
10. **Invisible Ink** 🫥 — Tests timed reveal
11. **Mirror** 🪞 — CSS transform on cards
12. **Smoke Bomb** 💨 — Interactive overlay
13. **Disguise** 🥸 — Presence override
14. **Earthquake** 🌍 — Seat position shuffling
15. **Confetti** 🎉 — Particle animation
16. **Table Flip Immunity** 🛑 — Reset handler modification
17. **Swap** 🔄 — Vote manipulation on reveal
18. **Crown** 👑 — Global single-owner state
19. **Dealer Hat** 🎩 — Avatar overlay permanent
20. **Table Cloth** 🟩 — Dynamic table styling
21. **Rainbow Table** 🌈 — CSS animation persistent
22. **Flamethrower** 🔥 — Complex visual effect
23. **Golden Ticket** 🎫 — Modified calculation
24. **Magnet** 🧲 — Modified display calculation
25. **Time Bomb** 💣 — Timer sync + auto-reveal
26. **Telescope** 🔭 — Private data exchange
27. **Jumping Button** 🐇 — Minigame mechanics

---

## Common Patterns

### Consumable item flow:
1. Player clicks item in chip stack (right side) or buys from shop
2. If targeting: enter targeting mode → click player seat → broadcast event
3. If self/table: broadcast event immediately
4. All players receive event → update state → render effect
5. Item consumed (removed from inventory)

### Permanent item flow:
1. Player buys from shop → stored permanently
2. Effect applied via presence data (all players see it)
3. Persists across rounds, resets on room leave (except avatar items in localStorage)

### Broadcast event template:
```typescript
// In useSupabaseRealtime.ts
channel.on('broadcast', { event: 'item_name' }, (payload) => {
  const { targetUserId, userId, userName } = payload.payload
  // Update state
  // Add log entry
  // Show notification
})

// Send
sendEvent('item_name', { targetUserId, userId, userName })
```
