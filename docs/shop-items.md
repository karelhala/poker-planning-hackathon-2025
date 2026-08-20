# Shop Items - Poker Planning Gamification

Players earn points by voting each round. Points can be spent in the shop on items that affect gameplay, visuals, or are purely cosmetic.

## Point Economy

Typical session: ~7 tickets. Target: 25-40 pts/session so players can buy cheap items each session and save 2-3 sessions for premium items.

### Automatic Points (no approval needed)

| Action | Points | Notes |
|--------|--------|-------|
| Vote in a round | +2 | Base reward for participation |
| Consensus reached | +3 | Bonus for ALL voters when spread = 0 |
| Close agreement (spread <= 2) | +1 | Smaller bonus for near-consensus |
| First to vote | +1 | Speed bonus, first player to submit vote |
| Closest to final average | +1 | Accuracy reward (ties: all get it) |
| Voting streak (3+ rounds) | +1 | Every 3 consecutive rounds voted |
| Quick Draw participation | +2 | Bonus for joining Quick Draw |
| Quick Draw winner | +3 | Closest vote in Quick Draw |
| Session started | +5 | One-time bonus for joining the session |
| All tickets completed | +5 | Bonus when all loaded tickets are voted on |

**Estimated automatic earnings per 7-ticket session: 20-30 pts**

### Social Actions (Player-Initiated, Admin Approves)

Buttons on player's side of the table. Player clicks to request, admin sees notification and approves/denies. Points awarded on approval.

| Action | Button | Points | What it means |
|--------|--------|--------|---------------|
| Present ticket | 🎤 Present | +3 | Volunteer to explain the ticket to the team. Shows leadership. |
| Challenge estimate | 🤔 Challenge | +2 | Disagree with consensus and explain why. Encourages healthy debate. |
| Ask question | ❓ Question | +2 | Asked a clarifying question that helped the team understand the ticket better. |

**How it works:**
1. Player clicks action button on their table seat (small icon row)
2. Admin sees a toast/badge: "Karel wants to Present 🎤" with Approve/Deny buttons
3. On approve: player gets points, brief animation at their seat
4. On deny: nothing happens, no penalty
5. Each action usable once per ticket (prevents spam)

### Admin Awards (Admin-Initiated, Given to Player)

Admin can award bonus points to players directly. Click on a player's seat, choose award from context menu. **Awards are broadcast to all players** — everyone sees who got recognized.

| Award | Icon | Points | When to give |
|-------|------|--------|--------------|
| Great Insight | 💡 | +3 | Player shared valuable context or edge case |
| Spot On | 🎯 | +2 | Player's reasoning was particularly well-argued |
| MVP | ⭐ | +5 | Best contributor this round (once per round max) |
| Helpful | 🤝 | +2 | Helped another team member understand something |

**What everyone sees when an award is given:**
- Animated icon (💡/🎯/⭐/🤝) floats up from the awarded player's seat
- Brief banner across the table: "Karel earned 💡 Great Insight! +3 pts"
- Award icon badge appears next to player's name for the rest of the round
- Sound effect (optional, toggleable in settings)
- Awards accumulate visibly — a player with multiple awards shows all badges at their seat

**Session leaderboard:** At the end of a session (or viewable anytime), a summary shows total awards received per player. Encourages healthy competition and recognition.

### Estimated Total Per Session (7 tickets)

| Source | Min | Max |
|--------|-----|-----|
| Voting (7 rounds x 2) | 14 | 14 |
| Session bonus | 5 | 5 |
| Consensus/close bonuses | 3 | 21 |
| First to vote | 0 | 7 |
| Closest to average | 0 | 7 |
| Streak bonuses | 0 | 2 |
| Present/Challenge/Question | 0 | 14 |
| Admin awards | 0 | 10 |
| Completion bonus | 0 | 5 |
| **Total** | **22** | **85** |

Typical session: **30-45 pts.** Enough to buy 1-2 cheap items or save for 2-3 sessions for premium items.

---

## Existing Special Powers (Already Implemented)

These are the current special card mechanics in the game. They are granted by the admin to players and are single-use per round.

### Copy Vote 📋
Copy someone's vote value when cards are revealed. You secretly link to a target player — your vote becomes theirs. Shown with a copycat reveal animation.

### Shuffle 🔀
Hide and shuffle someone's card values. Target player's voting cards get randomized — they must flip face-down cards to find the real values. Creates confusion and fun.

### Block 🚫
Block someone from voting. Target player cannot cast a vote this round. Their vote is automatically set to the average of other players' votes when revealed.

### Double Power ⚡
Next round vote counts for 2x in the average calculation.

### Half Power ☕
Next round vote counts for 0.5x in the average calculation (coffee break).

### Quick Draw ⚡
Triggered by admin when vote spread is >= 5. A 5-second timed voting minigame with 3 card options around the average. Participants earn Double Power for the next round.

---

## Gameplay Items (Single Use)

### Dice 🎲
**Cost:** 3 points
Rolls a random vote instead of choosing. Who brings dice to a poker game? Chaotic energy. Replaces your vote with a random value from the current scale.

### Flamethrower 🔥
**Cost:** 8 points
Sets the table on fire for the current round. Visual fire effect on the felt surface. All cards are "singed" — revealed cards have a burnt edge effect. Pure chaos energy.

### Jumping Reveal Button 🐇
**Cost:** 10 points
Admin's reveal button starts bouncing around the table center. Admin must click it 4 times to catch it before cards are revealed. Everyone watches the admin chase the button. Hilarious in screenshare.

### Smoke Bomb 💨
**Cost:** 5 points
Target player's cards become obscured with smoke. Similar to shuffle but the card values are hidden behind a smoke overlay — they have to "fan" the smoke away by clicking rapidly to clear it.

### Mirror 🪞
**Cost:** 4 points
Target player's cards are flipped — text is mirrored (upside down and reversed). They can still vote but have to read the values backwards. Numbers like 8 and 13 become tricky.

### Poker Face 🃏
**Cost:** 3 points
Hides your "Voted" status indicator. Other players (and admin) see you as still "Thinking..." even after you've voted. Creates uncertainty about when everyone is ready.

### Time Bomb 💣
**Cost:** 7 points
Places a 30-second countdown timer on the table. When it hits zero, cards auto-reveal whether the admin likes it or not. Creates urgency. Timer is visible to everyone.

### Telescope 🔭
**Cost:** 6 points
Peek at one player's face-down card before reveal. Only you see it — a small preview appears next to their seat. Strategic intel.

### Swap 🔄
**Cost:** 5 points
After voting, secretly swap your card with a random other player's card. Neither player knows until reveal. Can backfire spectacularly.

### Magnet 🧲
**Cost:** 6 points
Your vote exerts a "pull" — after reveal, any vote within ±2 of yours gets nudged 1 point closer to your value in the displayed average. Doesn't change actual votes, just the calculated result.

### Invisible Ink 🫥
**Cost:** 4 points
Your card appears blank when first revealed. After a 5-second delay, the value fades in. Dramatic reveal for your vote.

### Earthquake 🌍
**Cost:** 5 points
All player seats shuffle to random positions around the table. Pure visual chaos. Seats animate sliding to new positions. Lasts for the current round.

### Shield 🛡️
**Cost:** 3 points
Blocks the next special card (Block, Shuffle, Copy, or any shop item) used on you. Shows a shield icon on your seat. Consumed when triggered. Persists until used.

---

## Cosmetic Items (Permanent / Duration)

### Card Skins 🎴
**Cost:** 10-20 points (varies by rarity)
Custom card back designs visible to everyone when your card is face-down on the table.
- **Dragon** — red scales pattern
- **Galaxy** — swirling stars
- **Pixel Art** — 8-bit pattern
- **Gold Foil** — shiny gold texture
- **Neon** — glowing neon lines
- **Wood Grain** — classy wooden back

### Table Cloth 🟩
**Cost:** 15 points
Change the felt color for ALL players this room. Options: red, blue, purple, black, pink. Resets next round. Flex item.

### Confetti Cannon 🎉
**Cost:** 5 points
Automatically fires a confetti explosion whenever your round achieves "Perfect Consensus!" Everyone sees it. Lasts for the room.

### Seat Cushion 💺
**Cost:** 5 points
Decorative glow/border around your seat position on the table.
- **Flame ring** — animated fire border
- **Ice** — frosty blue glow
- **Electric** — sparking yellow outline
- **Royal** — purple velvet glow

### Crown 👑
**Cost:** 12 points
Visible crown floating above your avatar. Only one player can wear the crown at a time — buying it takes it from whoever has it. King of the table.

### Name Color 🎨
**Cost:** 3 points
Change your display name color. Pick from a palette. Visible to everyone at your seat.

---

## Avatar Customization (DiceBear Integration)

### Recommended DiceBear Style: `pixel-art`

Best for shop system — 8 distinct purchasable categories, 139+ variants, all independently colorable. The only style with a dedicated hat component separate from hair.

**npm packages:** `@dicebear/core` + `@dicebear/pixel-art`

**Usage:**
```tsx
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/pixel-art';

const svg = createAvatar(pixelArt, {
  seed: userId,
  hair: ['long01'],
  hairColor: ['ff0000'],
  eyes: ['variant03'],
  mouth: ['happy05'],
  hat: ['variant02'],
  beard: ['variant01'],
  glasses: ['dark03'],
  accessories: ['variant01'],
  clothing: ['variant10'],
});

<Avatar src={svg.toDataUri()} />
```

### Alternative style: `avataaars`

Most recognizable DiceBear style. 104+ variants across 7 categories. Hats are mixed into hair/top variants (no separate hat component).

**npm packages:** `@dicebear/core` + `@dicebear/avataaars`

---

### Hair 💇
**Variants:** 45 in pixel-art (long01-long21, short01-short24)
**Shop items (5+ ideas):**

| Item | Style | Cost |
|------|-------|------|
| Mohawk | short05 | 3 pts |
| Afro | long08 | 3 pts |
| Long Flowing | long01 | 3 pts |
| Top Bun | long15 | 4 pts |
| Buzz Cut | short01 | 2 pts |
| Pigtails | long12 | 4 pts |
| Mullet | long18 | 5 pts |
| Braids | long20 | 5 pts |
| Pompadour | short15 | 4 pts |

**Hair Colors:** Fully customizable RGB. Sell color packs:
- Natural pack (blonde, brunette, black, red, gray): 2 pts
- Wild pack (blue, green, pink, purple, white): 5 pts
- Rainbow gradient: 8 pts

---

### Eyes 👀
**Variants:** 12 in pixel-art (variant01-variant12)
**Shop items (5+ ideas):**

| Item | Style | Cost |
|------|-------|------|
| Normal | variant01 | Free |
| Sleepy | variant04 | 2 pts |
| Happy Squint | variant06 | 2 pts |
| Wink | variant08 | 3 pts |
| Hearts | variant10 | 5 pts |
| Angry | variant03 | 3 pts |
| Surprised | variant12 | 2 pts |
| Cyclops | variant09 | 6 pts |

---

### Beard 🧔
**Variants:** 8 in pixel-art (variant01-variant08)
**Shop items (5+ ideas):**

| Item | Style | Cost |
|------|-------|------|
| Stubble | variant01 | 2 pts |
| Full Beard | variant03 | 3 pts |
| Goatee | variant05 | 3 pts |
| Handlebar Mustache | variant06 | 4 pts |
| Viking Braid | variant08 | 6 pts |
| Soul Patch | variant02 | 2 pts |
| Walrus | variant07 | 4 pts |
| Pencil Thin | variant04 | 3 pts |

**Beard Colors:** Match hair color pack system.

---

### Mouth 👄
**Variants:** 23 in pixel-art (happy01-happy13, sad01-sad10)
**Shop items (5+ ideas):**

| Item | Style | Cost |
|------|-------|------|
| Default Smile | happy01 | Free |
| Big Grin | happy05 | 2 pts |
| Smirk | happy09 | 2 pts |
| Tongue Out | happy13 | 3 pts |
| Frown | sad01 | 2 pts |
| Surprised O | sad05 | 3 pts |
| Gritted Teeth | happy11 | 3 pts |
| Poker Face (flat) | sad08 | 4 pts |
| Vampire Fangs | sad10 | 5 pts |

---

### Hat 🎩
**Variants:** 10 in pixel-art (variant01-variant10)
**Only pixel-art has a dedicated hat component.** This is a key differentiator.
**Shop items (5+ ideas):**

| Item | Style | Cost |
|------|-------|------|
| Baseball Cap | variant01 | 3 pts |
| Cowboy Hat | variant02 | 5 pts |
| Top Hat | variant03 | 6 pts |
| Beanie | variant04 | 3 pts |
| Party Hat | variant05 | 4 pts |
| Crown | variant06 | 8 pts |
| Wizard Hat | variant07 | 7 pts |
| Pirate Tricorn | variant08 | 6 pts |
| Santa Hat | variant09 | 5 pts (seasonal) |
| Chef Hat | variant10 | 4 pts |

**Hat Colors:** Customizable. Sell color packs like hair.

---

### Tattoo 🐉
**Not available in any DiceBear style.** Requires custom SVG overlay implementation.
**Shop items (5+ ideas) — custom overlay system:**

| Item | Design | Cost |
|------|--------|------|
| Flame Sleeve | Animated fire pattern on arm area | 8 pts |
| Heart | Classic heart on cheek/arm | 3 pts |
| Star | Small star near eye | 3 pts |
| Tribal | Geometric tribal pattern | 6 pts |
| Snake | Coiled snake wrap | 7 pts |
| Anchor | Sailor anchor | 4 pts |
| Lightning Bolt | Harry Potter-style forehead bolt | 5 pts |

**Implementation:** Custom SVG elements positioned relative to the DiceBear avatar. Rendered as an overlay layer on top of the base avatar.

---

### Extra Buyable Categories (pixel-art)

#### Glasses 👓
**Variants:** 14 (dark01-dark07, light01-light07)

| Item | Style | Cost |
|------|-------|------|
| Sunglasses | dark01 | 3 pts |
| Aviators | dark03 | 4 pts |
| Round Glasses | light01 | 2 pts |
| Nerd Glasses | light04 | 3 pts |
| Monocle | light07 | 5 pts |
| 3D Glasses | dark06 | 4 pts |
| Cyber Visor | dark07 | 6 pts |

#### Accessories 💍
**Variants:** 4 (variant01-variant04)

| Item | Style | Cost |
|------|-------|------|
| Earring | variant01 | 2 pts |
| Nose Ring | variant02 | 3 pts |
| Headphones | variant03 | 4 pts |
| Scarf | variant04 | 3 pts |

#### Clothing 👔
**Variants:** 23 (variant01-variant23)

| Item | Style | Cost |
|------|-------|------|
| T-Shirt | variant01 | Free |
| Suit & Tie | variant05 | 5 pts |
| Hoodie | variant08 | 3 pts |
| Hawaiian Shirt | variant12 | 4 pts |
| Tuxedo | variant15 | 6 pts |
| Jersey | variant18 | 3 pts |
| Lab Coat | variant20 | 5 pts |
| Tank Top | variant03 | 2 pts |

**Clothing Colors:** Customizable RGB.

---

## DiceBear Style Comparison Matrix

| Feature | pixel-art | avataaars | notionists | lorelei | adventurer |
|---------|-----------|-----------|------------|---------|------------|
| Hair | 45 | 36 | 62 | 48 | 44 |
| Eyes | 12 | 12 | 5 | 24 | 26 |
| Beard | 8 | 5 | 12 | 2 | 1 (detail) |
| Mouth | 23 | 12 | 30 | 27 | 30 |
| Hat | **10** | — | (in hair) | — | — |
| Glasses | 14 | 7 | 11 | 5 | 5 |
| Accessories | 4 | 7 | — | 3 | 6 |
| Clothing | 23 | 19 | 28 | — | — |
| Total items | **139** | 98 | 148 | 109 | 112 |
| Dedicated hat | **Yes** | No | No | No | No |

**Recommendation:** Use `pixel-art` as primary avatar style. Consider offering `avataaars` as a premium alternative avatar style (costs 20 pts to unlock the style).

---

## Social Items (Single Use)

### Tomato 🍅
**Cost:** 2 points
Throw a tomato at another player. Visual splat effect on their avatar that fades after 3 seconds. Harmless but funny.

### Applause 👏
**Cost:** 2 points
Triggers a clapping hands animation visible to all players. Good for celebrating consensus or a well-argued estimate.

### Disguise 🥸
**Cost:** 4 points
Your name and avatar show as "???" with a generic silhouette for one round. Nobody knows who you are (except by your vote pattern). Mystery voter.

### Megaphone 📢
**Cost:** 3 points
When you vote, your name flashes and a "VOTED!" banner briefly appears across the table. Attention-grabbing.

### Spotlight 🔦
**Cost:** 3 points
Highlights a target player with a spotlight beam. Their seat glows and everyone can see their voting status more prominently. Social pressure to vote faster.

---

## Rare / Event Items

### Golden Ticket 🎫
**Cost:** 50 points (or earned through achievements)
One-time use. Your vote is worth 3x in the average calculation. Nuclear option.

### Table Flip Immunity 🛑
**Cost:** 15 points
When admin resets the round, your vote carries over to the next round automatically. You don't have to re-vote.

### Dealer Hat 🎩
**Cost:** 25 points
Cosmetic. Animated dealer hat on your avatar. Shows you're a shop veteran. Subtle flex.

### Rainbow Table 🌈
**Cost:** 30 points
The entire table cycles through rainbow colors for the rest of the session. Everyone sees it. Maximum visual impact.

---

## Implementation Notes

### General
- Items that affect gameplay should be carefully balanced — too powerful = frustrating
- Visual-only items are safest and most fun to collect
- Point display: show in header or at player's seat
- Shop UI: modal/drawer accessible from header, categorized tabs
- Item inventory: stored in localStorage (or Supabase if persistence is added)
- Active effects: broadcast via Supabase realtime so all players see them

### DiceBear Avatar Implementation
- Install: `npm i @dicebear/core @dicebear/pixel-art`
- Optional alt style: `npm i @dicebear/avataaars`
- Generate SVG with `createAvatar()`, render as data URI in MUI `<Avatar src={...} />`
- Store selected options in localStorage: `{ style, hair, eyes, beard, mouth, hat, glasses, accessories, clothing, colors }`
- Broadcast avatar config via Supabase presence so all players see each other's customized avatars
- Tattoos: custom SVG overlay layer, positioned relative to avatar, rendered on top

### Special Powers Integration
- Existing powers (Copy, Shuffle, Block, Double/Half Power) remain admin-granted
- New shop items are player-purchased with points
- Both types appear in the unified card hand arc
- Shop items that target other players use the same targeting mode as existing special cards
