# Animate Weapon of Ranged Arms (AWoRA): league-start research for 3.30 "Covens of Umbra"

Researched 2026-11-07, six days before the 3.30 launch on 2026-11-13 (PST).
This is the input for the overlay's leveling plan (gems per act, tree by level, gear reminders).

**Confidence key:** **[3.29-confirmed]** = current in 3.29 from a dated source. **[3.30-unconfirmed]** = no 3.30 source exists yet.
**[inference]** = my own reasoning or general game knowledge, not taken from a cited guide.

---

## 0. TL;DR

- **Ascendancy:** Necromancer, used by every current AWoRA guide.
- **Bandit:** kill all three.
- **Pantheon:** Soul of Lunaris (major) + Soul of Gruthkul (minor).
- **Campaign:** you do not level as AWoRA. The reference guide (Maxroll, Helm Breaker, updated 2026-11-05) levels like this:
  - Rolling Magma → Summon Raging Spirit (SRS) + Holy Flame Totem.
  - **Absolution** from level 12 to the end of the campaign.
  - Vaal Absolution in white and yellow maps.
- **Switch to AWoRA:** at about level 80, once you have all three of:
  - a level 15+ AWoRA gem;
  - a 5-link rare body armour;
  - Bladefall (later Bladefall of Trarthus).
- **Respec at about 80:** roughly 18 points, using gold or Orbs of Regret. It does three things:
  - takes Blood Magic;
  - swaps Commander of Darkness for Mistress of Sacrifice;
  - is when you do Uber Lab.
- **How the weapons are made:** AWoRA animates a ranged weapon item on the ground, or a **Lingering Blade**. Lingering Blades turn into bows. In practice everyone casts Bladefall, or keeps Bladefall of Trarthus running, to make the blades. You do not need to drop bows or wands.
- **3.30:** official patch notes were **not published** as of 2026-11-07. Only the ExileCon reveal (2026-11-06) is out, and it covers the league mechanic and endgame. Nothing in it is about skills, minions or ascendancies, so every gem number below is 3.29. Re-check when the 3.30.0 notes go up (usually a few days before launch).

---

## 1. 3.30 and 3.29 changes that touch this build

### 1a. 3.30 (Covens of Umbra): what is actually known on 2026-11-07

| Claim | Source (date) |
|---|---|
| The newest thread in the official Patch Notes forum is "3.29.3c Patch Notes" (Nov 6, 2026). It contains only "Added support for the upcoming announcement and new Supporter Packs." There is **no 3.30.0 patch notes thread yet.** | https://www.pathofexile.com/forum/view-forum/patch-notes and https://www.pathofexile.com/forum/view-thread/4012720 (checked 2026-11-07) |
| The ExileCon announcements post covers the new challenge league, endgame changes, improvements to existing endgame systems and new unique items. It has **no** skill, minion or ascendancy details and no link to patch notes. | https://www.pathofexile.com/forum/view-thread/4012710 (2026-11-07) |
| Launch is 2026-11-13 (PST). The timeline post gives no date for the patch notes. | https://www.pathofexile.com/forum/view-thread/4010618 (2026-10-12), https://www.pathofexile.com/forum/view-thread/4012420 (2026-11-01) |
| Reveal highlights: <br>• Scarabs removed and replaced by Threads (up to 8 uses per map) <br>• Atlas tree reworked <br>• Harvest becomes Wild, Vivid and Primal Roots <br>• beastcrafting no longer needs yellow beasts <br>• Gwennen coin-flip craft <br>• tiered magic and rare drops <br>• Atziri in the Temple drops a Soul Core that corrupts a skill gem with a random support effect | https://maxroll.gg/poe/news/3-30-covens-of-umbra-reveal-summary (updated 2026-11-07) |
| Campaign zone layouts are rearranged "where necessary" so players reach the area bosses, with 24+ new additions across the campaign (Coven cauldrons and Fates on area bosses). | https://www.pcgamesn.com/path-of-exile/3-30-covens-of-umbra-exilecon-2026 (2026-11-07) |
| Fates are invoked on area bosses (up to 3 per boss), and Viscera are used on the Wickerman for permanent buffs. | https://outputlag.com/news/path-of-exile-3-30-covens-of-umbra-invoke-fate-cards-on-area-bosses-for-bigger-loot/ (Nov 2026) |

**Still unknown for 3.30:**
- changes to Animate Weapon or AWoRA, Bladefall or Bladefall of Trarthus, Unleash, Necromancer, minion supports, The Covenant, Darkness Enthroned or Ashes of the Stars;
- whether Vestigial and Foulborn uniques and Bloodline ascendancies (3.29 league content) stay in core;
- whether Mercenaries still drop Bladefall of Trarthus;
- whether the Divine Font still transfigures gems.

All of these are **[3.30-unconfirmed]**.

**Impact on the overlay [inference]:**
1. The "Harvest reforge" crafting steps in the Maxroll milestones (+2 minion helmet, cluster jewels) may break when Harvest becomes "Roots". Flag those steps as unverified.
2. Campaign layout changes plus Coven cauldrons may shift act timing a little.
3. The Soul Core gem corruption is new and does not matter for leveling.

### 1b. 3.29 (Curse of the Allflame) changes relevant to the build [3.29-confirmed]

Source for all rows: the official "Content Update 3.29.0 — Curse of the Allflame" notes (Jul 17, 2026), https://www.pathofexile.com/forum/view-thread/3985332

| Change | Relevance |
|---|---|
| "Absolution: Now has a cast time of 0.65 seconds (previously 0.75)" (Absolution of Inspiring too) | Buffs the leveling skill |
| "Bladefall of Trarthus: Now has 140% Effectiveness of Added Damage at gem level 20 (previously 120%)…" Bladefall: 160% (from 140%) | Only the blade generation matters to us. Guides keep Bladefall at level 1. |
| "Unleash: Supported Skills now deal 45-26% less Damage when Reoccurring at gem levels 1-20 (previously 45-36%)". Greater Unleash: 25-23% less (from 35-31%). | Unleash is a core AWoRA support, so this is a buff |
| "All Non-Spectre Minions no longer pause while attacking." The named winners are Dominating Blow, Zombies, Golems, SRS and Skeletons. | Animated weapons are not named. Zombies and Golems (utility minions in this build) benefit. |
| Minion Pact reworked into "Communion Support". Companionship lost the "more max life" line. | Not used by AWoRA |
| Minions have 15% increased movement speed (previously up to 10%) | Small QoL |
| 3.29.1 (Jul 30, 2026): "Coursing Current Support can now support Minions and their Skills." | Not used. Source: https://www.pathofexile.com/forum/view-thread/3991633 |
| 3.29 league content: Vestigial uniques and the Necromancer Bloodline "Ghastly Gaze of the Lich". Maxroll says a Vestigial Covenant could become best in slot, and the Lich bloodline can replace one ascendancy node via Forbidden Flesh and Flame. | Endgame only. **Whether it survives into 3.30 is [3.30-unconfirmed].** Source: Maxroll guide tab "Curse of the Allflame" (2026-11-05). |

### 1c. The gem itself: current 3.29 data [3.29-confirmed]

Source: https://poedb.tw/us/Animate_Weapon_of_Ranged_Arms (fetched 2026-11-07)

- **Tags:** Duration, Minion, Spell, Physical.
- **Description:** "Animates a Ranged Weapon Item or Lingering Blade to fight by your side. You cannot animate unidentified Weapons. Will not animate weapons with 6 sockets."
- **Stats:**
  - "Base duration is 40 seconds".
  - "Maximum (5—14) Animated Weapons". Quality adds +0–2, i.e. one more weapon per 10% quality.
  - "Can use Items requiring up to Level (9—100)".
  - **"Animated Lingering Blades become Bows"**.
  - Flat added physical damage for minion attacks; more damage and more attack speed (0–38%).
- **Requirements:** gem level 1 needs character level 4; gem level 20 needs level 70 (98 Dex / 68 Int).
- poedb also shows a level 1–40 table. Why is unclear; possibly data-mined. Treat it as unconfirmed.

Guide-reported duration: "When summoned they last around 85 seconds". That figure includes duration scaling from the tree and gear. Source: Maxroll (2026-11-05); Corak's forum guide also says ~85 s.

---

## 2. What the current guides recommend

| Guide | Ascendancy | Leveling | Notes | Source (date) |
|---|---|---|---|---|
| **Maxroll, "Poison Ranged Animate Weapons League Starter", Helm Breaker** (the main reference) | Necromancer | Absolution through the campaign (or the Poison SRS guide). Switch to AWoRA at about level 80. | Rating: Difficulty Low, Budget Moderate, Mapping Great, Bossing Excellent, Defence Excellent. Strengths: "HC viable, Very tanky, Few buttons, Uber boss viable, Great All-rounder". Weaknesses: "Visual clarity, Late game is expensive". Claims boss and map damage beat Minion Army and Poison SRS, at the cost of swapping gems between mapping and bossing. | https://maxroll.gg/poe/build-guides/poison-ranged-animate-weapons-league-starter (updated 2026-11-05 for 3.29). Planner data: https://maxroll.gg/poe/planner/ef5hj0rf (profile saved 2026-11-07). PoBs: https://maxroll.gg/poe/pob/gm7x80au (SC), https://maxroll.gg/poe/pob/5ny70a8p (HC), https://maxroll.gg/poe/pob/z94730yo (min-max) |
| Hoffen's forum thread (links to the Maxroll guide) | Necromancer | Not in the post | Posters say it was their first build to finish the atlas and kill ubers. Covenant plus poison jewels "more than double damage" vs a 6-link rare. | https://www.pathofexile.com/forum/view-thread/3788773 (titled [3.29], last edited 2026-07-19) |
| Odealo, "[3.29] AWoRA Necromancer" | Necromancer: Mindless Aggression → Unnatural Strength → Bone Barrier → Mistress of Sacrifice | Absolution or SRS. Switch once you have the transfigured gem plus Bladefall. | Pantheon Lunaris / Gruthkul. Endgame: Covenant, Darkness Enthroned, Jinxed Juju, Rumi's. Cons: re-summoning; clunky before Bladefall of Trarthus. | https://odealo.com/articles/animate-weapon-of-ranged-arms-necromancer-build (updated 2026-07-23) |
| Corak_de, "[3.28 Update] Poison/Chaos ranged Animate Weapon" | Necromancer (Unnatural Strength, Mindless Aggression, Mistress of Sacrifice, Bone Barrier) | Absolution until Unleash (end of Act 4), then the *melee* Animate Weapon until you get the ranged gem. Uses Phys to Lightning (Library) while leveling. | Budgets of about 8 / 50 / 300 div. Kill all bandits. Pantheon Brine King / Ryslatha. Warns that temporary minions vanish on zone change and death, and that 3.28 re-summoning hurt mapping speed. | https://www.pathofexile.com/forum/view-thread/3897244 (posted 2025-12-23, edited 2026-04-04) |
| GhazzyTV (PoE Vault), Poison AW Necromancer | Necromancer | Rolling Magma → SRS/Holy Flame Totem → Absolution or SRS. **Melee AW from level 28** (Bladefall bought after Gravicius in Act 3), then ranged once you have the gem. | **Marked "Out Of Date"; GhazzyTV "no longer recommends this build"** and calls it "Not a recommended league starter" because the transfigured gem may be hard to get. | https://www.poe-vault.com/guides/animate-weapon-necromancer-build-guide (header 2025-10-28, 3.26 content) |
| ExFluent's poe.ninja showcase, 3.29 lvl 90 | Necromancer | n/a | Bandit Alira, Pantheon Brine King / Abberath. Covenant, Darkness Enthroned, Amanamu's Gaze, Envy from a Foulborn United in Dream. | https://www.poebuilds.cc/poe1/build/X6FWOUcI8z0 (Jul 27, 2026) |
| Mobalytics "Poison AWoRA – Better than Holy Relic" | Necromancer | Not read (the page returned 403) | Patch 3.27, updated 2025-11-25 (per search snippet) | https://mobalytics.gg/poe/builds/poison-animate-weapon-of-ranged-arms |

**Why Necromancer:**
- Unnatural Strength gives +2 minion gem levels and Wither on hit (it multiplies chaos and poison damage).
- Mindless Aggression adds minion damage and life.
- Bone Barrier gives defence plus minion energy shield (ES).
- Mistress of Sacrifice / Commander of Darkness provide offering and aura value.
- Odealo: Necromancer "offers the most complete package"; Maxroll says the build "needs all of the current four Necromancer Ascendancy nodes".

No current guide uses Guardian or Elementalist for AWoRA. PoB Archives lists a WIP Gladiator aurabot (search snippet, not verified).

**Scaling:** chaos and poison. Key pieces:
- "Minions have #% chance to Poison on hit" Ghastly Eye jewels;
- Unnatural Strength (Wither);
- The Covenant (7-link);
- Darkness Enthroned;
- Amanamu's Gaze;
- Ashes of the Stars;
- +minion gem levels.

Source: Maxroll Build Info tab (2026-11-05).

---

## 3. Leveling: how people actually get to AWoRA

### 3a. Mechanic, exactly [3.29-confirmed]

- AWoRA needs a **target on the ground**: an identified ranged weapon item with fewer than 6 sockets, or a **Lingering Blade**. It does **not** create its own weapon. (poedb gem text, above.)
- Lingering Blades come from **Bladefall**, or from **Bladefall of Trarthus**, which "keeps spawning new blades as long as the skill is active at the cost of 10% mana per second". **Blood Magic** removes that cost. When animated, the blades "become Bows". (Maxroll Build Info, 2026-11-05.)
- So no corpses are needed. The bow and wand drops are irrelevant in practice: guides never animate dropped items, and Ghazzy notes the old item-based version was a problem in boss arenas. (PoE Vault, 2025-10-28.)
- **"Ranged weapon item" probably includes bows and wands [inference]**, but the gem text only says "Ranged Weapon Item".
- Keep **Bladefall / Bladefall of Trarthus and Desecrate at gem level 1** (mana cost and Dex requirement). (Maxroll FAQ.)
- Weapons last about 85 s and disappear on zone change and on death, so you re-summon each map, boss or zone. The **Unleash** support exists to make summoning faster. (Maxroll; Corak.)

### 3b. Getting the gems

- **Base Animate Weapon:** Act 1 quest "Breaking Some Eggs" (Nessa) for Scion, Shadow and Witch. (poedb; Corak 2025-12-23.)
- **AWoRA (transfigured):**
  - Divine Font at the end of the Labyrinth, using the crafting option "Transform a non-Transfigured Skill Gem to be a random Transfigured version". Maxroll says "Lord's Labyrinth", or trade.
  - Ghazzy's 3.29 Necro leveling guide says to "bring a copy of your intended main gem" to the third (Merciless) lab for transfigure odds. (https://www.poe-vault.com/guides/necromancer-levelling-guide, 2026-07-23.)
  - **[inference]** Animate Weapon has two transfigured variants (of Self Reflection, of Ranged Arms), so each font transform is roughly a coin flip. Bring 2–3 Animate Weapon gems to the Merciless lab and, if needed, Uber Lab.
- **Bladefall:** buyable after Gravicius in Act 3 (Ghazzy, PoE Vault). Bladefall is a level-28 gem; it can also be bought from Lilly Roth from Act 6. [general knowledge]
- **Bladefall of Trarthus:** "can be found from Mercenaries or you can buy it from other players". Use plain Bladefall if it is expensive. (Maxroll.) **Whether Mercenaries are in 3.30 is [3.30-unconfirmed].**
- **Unleash:** end of Act 4. (Corak.)
- **Chance to Poison:** optional "Mercy Mission" quest reward as Witch, or mule it from a Shadow after Hillock. (Maxroll tips.)
- **Library (Siosa, Act 3):** many level-31 gems, e.g. Feeding Frenzy, Convocation, Physical to Lightning. (Maxroll tips; Ghazzy.)
- **Lilly Roth (Act 6 onward):** nearly every gem. GMP, Pierce, Void Manipulation, Vile Toxins and Unbound Ailments are bought here or post-campaign. [general knowledge; Ghazzy mentions Lilly Roth]

### 3c. The Maxroll campaign gem plan (Absolution route)

Source: Maxroll planner "Leveling skills", profile ef5hj0rf, saved 2026-11-07 (guide updated 2026-11-05). Gem groups are separated by "|". Act mapping is approximate **[inference]** from normal leveling pace.

| Level (≈ act) | Setups |
|---|---|
| **2 (A1)** | Rolling Magma + Arcane Surge \| Raise Zombie + Chance to Poison |
| **4 (A1)** | SRS + Chance to Poison \| Raise Zombie \| Holy Flame Totem + Summon Phantasm \| Frostblink \| Flame Wall |
| **8 (A1)** | SRS + Chance to Poison + Added Lightning \| Raise Zombie \| Holy Flame Totem + Added Lightning + Summon Phantasm \| Frostblink + Flame Wall \| Shield Charge + Faster Attacks |
| **10 (A1–A2)** | Same as level 8, plus Flame Dash instead of Frostblink, plus Vitality + Clarity |
| **12 (A2)**, Absolution starts | **Absolution + Minion Damage + Added Lightning** \| Raise Zombie + Chance to Poison \| Flesh Offering + Flame Dash \| Shield Charge + Faster Attacks \| Vitality + Clarity \| Holy Flame Totem + Added Lightning + Summon Phantasm |
| **16 (A2)** | Absolution + Minion Damage + Added Lightning \| Raise Zombie + Summon Phantasm + Chance to Poison \| … \| **Herald of Purity** + Added Lightning |
| **18 (A2–A3)** | Absolution + Faster Casting + Added Lightning \| Raise Zombie + Minion Life + Summon Phantasm \| Herald of Purity + Minion Speed + Minion Damage \| … |
| **24 (A3)**, 4-link | Absolution + Faster Casting + Added Lightning + **Controlled Destruction** \| Vitality + **Conductivity** + Clarity \| … |
| **28 (A3–A4)** | Adds **Raise Spectre** (to the Zombie link) and **Desecrate** (to the Offering link) |
| **31 (A4)**, Library gems | Absolution + Added Lightning + **Physical to Lightning** + Faster Casting \| Zombie + Minion Life + Spectre + Phantasm \| Flesh Offering + **Convocation** + Flame Dash \| Herald of Purity + **Added Chaos** + **Feeding Frenzy** \| … |
| **34 (A4–A5)** | Adds **Summon Stone Golem** + Feeding Frenzy; Herald of Purity + Minion Speed + Added Chaos |
| **38 (A5–A6)** | Absolution + Phys to Lightning + **Spell Echo** + Faster Casting |
| **46 (A7)** | Adds **Purity of Elements** (with Clarity + Conductivity) |
| **68 (A10 / end)** | Absolution + Spell Echo + Added Chaos + Controlled Destruction + Faster Casting (5-link) \| Zombie + Minion Life + Spectre + Phantasm \| Desecrate + Clarity + Flesh Offering \| Convocation + **Despair** + Purity of Elements + Flame Dash \| Vitality \| Herald of Purity + Chance to Poison + Faster Attacks + Shield Charge \| Stone Golem + Feeding Frenzy |

**Post-campaign skill setups** (Maxroll "Skill progression" embed, same date):

1. **Early Abso Maps:** Vaal Absolution + Spell Echo + Controlled Destruction + Added Chaos + Faster Casting + Minion Damage.
2. **Early AW 6-link** (the switch).
   - Bossing: AWoRA + Added Chaos + Void Manipulation + Chance to Poison + Unleash + Minion Damage.
   - Mapping: AWoRA + Added Chaos + GMP + Pierce + Unleash + Chance to Poison.
   - Utility:
     - Raise Spectre + Animate Guardian + Minion Life + Flame Dash;
     - Raise Zombie + Feeding Frenzy + Summon Phantasm + **Bladefall**;
     - Shield Charge + Faster Attacks + Purity of Elements + Eternal Blessing;
     - Steelskin + Automation + Convocation;
     - Desecrate + Bone Offering + Stone Golem of Safeguarding (in the trigger wand);
     - Despair.
3. **Early Covenant (Blood Magic).** Bladefall becomes Bladefall of Trarthus.
   - Bossing: AWoRA + Void Manipulation + Vile Toxins + Minion Damage + Unleash + Unbound Ailments.
   - Mapping: AWoRA + Unleash + GMP + Minion Damage + Pierce + Void Manipulation.
4. **Mid:** same as Early Covenant.
5. **Late:** Unleash becomes Greater Unleash; Congregation is added to the Spectres.

**Gem swap rules** (Maxroll Build Info):
- When mapping, swap Unbound Ailments + Vile Toxins out for Pierce + GMP.
- Optionally, for pinnacle bosses, swap Unleash for Faster Attacks after the first wave of weapons.
- For Blight or Delve: GMP becomes Chain and Pierce becomes Vile Toxins.

**Leveling tips** (Maxroll "Tips & Tricks", 2026-11-05):
- Equip a Sapphire Ring for Merveil.
- Vendor recipe: an Iron Ring plus an R/G/B gem gives a Ruby, Topaz or Sapphire ring.
- Use an Amber Amulet for Strength.
- Bench-craft resistances for 1 Orb of Transmutation; this also works on white items.
- Buy a magic **Calling Wand with minion damage** from the wand and gem vendor.
- Don't level Clarity or Vitality too high (reservation).
- Zombies die easily before the level-24 Minion Defence Mastery ("recover 5% of life on minion death"); level the gem but summon them later.
- Wear Two-Stone Rings after level 20 and push resistances toward 75%.
- **Act 2 Vaal Ruins corruption altar:** corrupt Absolution for a chance at Vaal Absolution.
- At Raise Spectre, use Desecrate in **Act 2 Old Fields** for **Carnage Chieftain** spectres. Hold A to target a specific corpse.
- Keep extra Raise Spectre and Animate Guardian gems leveling in weapon swap.

**Alternative campaign route:**
- Follow Maxroll's Poison SRS guide through the acts and then switch. (Maxroll intro: https://maxroll.gg/poe/build-guides/poison-srs-necromancer-league-starter)
- Ghazzy/Corak variant: play the melee Animate Weapon + Bladefall from level 28–38 (after Unleash) until the ranged gem drops. This is clunkier, and the Ghazzy guide is out of date.

### 3d. Switch point and respec [3.29-confirmed, Maxroll milestones]

- "I recommend to reach level 80 before swapping to the Animate Weapon of Ranged Arms skill gem."
- "When you have a level 15+ Animate Weapon of Ranged Arms gem, reached level 80 and a 5-link rare body armour, remove Absolution and its support gems."
- Use all Gemcutter's Prisms on AWoRA, since quality means more weapons. Put at least one green socket in the body armour for +10% quality (a Covenant / Vestigial feature).
- **Respec at about 80 + Uber Lab:**
  - "You need around 18 refund points… By completing the campaign you have gained 18 refund points, you can use Orb of Regret or gold."
  - Respec Commander of Darkness into Mistress of Sacrifice ("10 respec points in total"). Cap resistances first, because Commander gives +30% elemental resistance.
  - Take **Blood Magic**. Then remove Clarity and link Eternal Blessing to Purity of Elements.
  - Planner diff of the respec: removes Spiritual Aid, Sovereignty, two Reservation Efficiency nodes, Aura AoE and the Mana Mastery; adds Barbarism, Juggernaut, Life and Armour, Strength nodes and Blood Magic.
- **Further respecs:**
  - Large cluster and poison jewels: about 18 points.
  - "Mid" tree: about 18 points; adds Glancing Blows, Mistress of Sacrifice, Barbarism and Juggernaut, and drops Practical Application.
- **Gold respec:** in 3.29 Faustus in Kingsmarch "sells respecs for gold" (PoE Vault Necro leveling guide, 2026-07-23). **Whether Kingsmarch and gold respec are unchanged in 3.30 is [3.30-unconfirmed].**
- No source mentions the Book of Regrets for this build.

---

## 4. Links, auras, tree, bandit, pantheon, lab

### 4a. Links by stage

Act timing is **[inference]**; the setups are Maxroll's, as in section 3c.

- **A1, 2–3 links:** Rolling Magma + Arcane Surge → SRS + Chance to Poison + Added Lightning.
- **A2, 3 links:** Absolution + Minion Damage + Added Lightning (Faster Casting from about level 18).
- **A3, 4 links:** Absolution + Faster Casting + Added Lightning + Controlled Destruction. Physical to Lightning comes in at about level 31 after the Library.
- **A5–A6 onward:** Spell Echo replaces Added Lightning.
- **End of campaign, 5 links:** Absolution + Spell Echo + Added Chaos + Controlled Destruction + Faster Casting.
- **Auras and buffs:**
  - Vitality and Clarity (keep them low level), Herald of Purity (from 16), Purity of Elements (from about 46, the Act 3 Maramoa reward per Ghazzy).
  - Conductivity, later replaced by Despair after the 3rd lab / Unnatural Strength.
  - Flesh Offering, later replaced by Bone Offering post-campaign.
  - Feeding Frenzy on Zombies; Stone Golem.
- **Skitterbots / Zealotry:** used in Ghazzy's generic Necro route, not in Maxroll's.
- **Movement:** Shield Charge + Faster Attacks (main), plus Flame Dash / Frostblink for ledges.

### 4b. Leveling tree order (Maxroll planner "Leveling" variant, 101 points, tree version 3290)

Notables and masteries in the order they are allocated. "pt N" is the N-th point spent; the level is roughly N minus quest points earned. Act numbers are **[inference]**.

1. pt 8: **Enduring Bond**
2. pt 9: Minion Offence Mastery
3. pt 10: **Arcanist's Dominion**
4. pt 12: **Lord of the Dead**
5. pt 14: **Heart and Soul**
6. pt 16: **Practical Application**
7. pt 20: **Retribution**
8. pt 22: **Discipline and Training**
9. pt 25: **Sacrifice**
10. pt 26: Minion Defence Mastery (recover life on minion death)
11. pt 28: **Spiritual Command**
12. pt 34: **Purity of Flesh**
13. pt 39: **Redemption**
14. pt 41: Commander of Darkness (Lab 1)
15. pt 42: Life Mastery
16. pt 44: **Spiritual Aid**
17. pt 46: **Righteous Army**
18. pt 49: **Quick Recovery**
19. pt 53: **Sovereignty**
20. pt 56: **Mystic Bulwark**
21. pt 57: Mana Mastery
22. pt 59: **Sanctity**
23. pt 66: **Safeguard**
24. pt 67: Block Mastery
25. pt 75: **Tireless**
26. pt 77: Mindless Aggression (Lab 2)
27. pt 80: **Sanctuary**
28. pt 81–82: Shield Mastery, Life Mastery
29. pt 87: **Gravepact**
30. pt 90: **Cruel Preparation**
31. pt 93: **Devotion**
32. pt 95: Unnatural Strength (Lab 3)
33. pt 99: **Nomadic Teachings**

**After the campaign:**
- **70–80:** + jewel socket, + Bone Barrier (Lab 4 / Uber), then the level-80 respec (section 3d).
- **80–92:** + Large Jewel Socket, extra jewel sockets, **Divine Shield** keystone (added 2026-11-05), Endurance / Stamina.

**Exact pixel paths:** a static guide cannot reproduce them. The overlay should import the planner or PoB (https://maxroll.gg/poe/pob/gm7x80au) for node-level paths.

### 4c. Ascendancy / lab order (Maxroll planner)

| Lab | Node |
|---|---|
| Normal (Act 3–4) | **Commander of Darkness** |
| Cruel (Act 7) | **Mindless Aggression** |
| Merciless (Act 10) | **Unnatural Strength** |
| Uber (about level 75–80) | **Bone Barrier**, then respec Commander of Darkness into **Mistress of Sacrifice** |

Odealo prefers a different order: Mindless Aggression → Unnatural Strength → Bone Barrier → Mistress of Sacrifice.

### 4d. Bandit and pantheon

- **Bandit:** kill all. ("Kill all, no mercy exile." Maxroll FAQ; Corak and Odealo agree.)
  - Odealo says killing all gives "1 additional Passive Point". **[3.30-unconfirmed]**; check the in-game reward text.
  - A minority choice is Alira (ExFluent's showcase).
- **Pantheon:** major **Soul of Lunaris** (immune to chained projectiles), minor **Soul of Gruthkul**. (Maxroll planner; Odealo.)
  - Corak uses Brine King + Ryslatha; ExFluent uses Brine King + Abberath.

### 4e. Leveling uniques and items

- No guide requires leveling uniques: Maxroll leveling tips name none, and poe327 says "No mandatory uniques".
- Gear reminders for the overlay:
  - magic Calling Wand with minion damage (Act 1–2 vendor);
  - Sapphire Ring for Merveil;
  - Amber Amulet;
  - Two-Stone Rings after level 20;
  - shield for Shield Charge;
  - +minion-level wand before maps.
- **Act 9 Refinery hidden drain:** unlocks the "Trigger a Socketed Spell when you Use a Skill" wand craft, used to automate Desecrate + Bone Offering. (Maxroll; Ghazzy.)

---

## 5. Into maps: budget targets, first upgrades, pitfalls

### 5a. Upgrade order from the Maxroll "Early Game" milestones (3.29, 2026-11-05)

1. **Gear:** life, minion modifiers and resistances on every slot.
   - Minion damage and attack speed only roll on wands, Bone Rings and shields (shields can't roll attack speed).
   - Over-cap elemental resistances by 15% or more against exposure. Use Screaming Essence of Envy for chaos resistance.
2. **Stay on Absolution / Vaal Absolution** through white and yellow maps.
3. **Get the AWoRA gem, at level 15 or higher.** Also needed:
   - Steelskin + Automation;
   - Bone Offering;
   - Bladefall of Trarthus (plain Bladefall if it is expensive);
   - Stone Golem of Safeguarding (Divine Font);
   - Void Manipulation, Minion Damage, GMP, Pierce, Unleash.
4. **Flasks:**
   - Eternal Life flask with instant or increased recovery plus "of Sealing" (bleed immunity, from the Menagerie);
   - Rumi's or Granite, Quicksilver, Quartz, and Amethyst or Gold;
   - suffixes in priority order: reduced curse effect, armour, block/stun recovery, movement speed.
5. **Cheap anoint:** Decay Ward (Sepia, Verdant, Teal oils).
6. **Spectres:** Carnage Chieftain (Act 2 Old Fields) and Arena Master (Drox maps). Later: Forest Warrior (onslaught), Perfect Guardian Turtle, Hulking Miscreation ("animated weapons counts as constructs").
7. **Respec at 80 + Uber Lab** (Blood Magic, Mistress of Sacrifice).
8. **+minion gem levels:**
   - +1–2 helmet, +1–2 wand, +1 shield;
   - level 21 Raise Spectre and Raise Zombie, which reaches the level-25 breakpoint (an extra zombie and spectre).
   - The helmet is the Harvest minion reforge: **[3.30-unconfirmed]**, since Harvest is reworked.
9. **Minion trigger wand:** Calling, Convening or Convoking base at ilvl 60+ with +1 minion or spell gems, minion damage and minion attack/cast speed. Crafted with a Powerful Chaotic Resonator plus Shuddering, Corroded and Metallic fossils, or by Alteration spam, or with Screaming Essence of Fear.
10. **Ghastly Eye jewels:** life, **Minions have x% chance to poison on hit** (the biggest damage gain), and taunt on one jewel.
    - Fill every tree slot and the Darkness Enthroned sockets.
    - Darkness Enthroned needs 75%+ abyss jewel effect. Put the highest-poison jewels in the belt.
11. **Cluster jewels:** small with Enduring Composure (ilvl 68+); medium with Life from Death (ilvl 50+, "essential"; later add Bodyguards).
12. **Animate Guardian:** AG Gloves / Asenath's Gentle Touch, Dying Breath, Zahndethus' Cassock, Leer Cast, Windscream. It needs a total combined gem level of 15 or more before maps, and 20 for ubers.
13. **Uniques:**
    - Darkness Enthroned (75%+);
    - The Jinxed Juju (chaos resistance);
    - **The Covenant**, the best body armour. The Foulborn Covenant with Blood Magic saves 1–5 points. When you have it, swap Added Chaos for Unbound Ailments and Chance to Poison for Vile Toxins.
14. **Large minion cluster:** 10–12 passives with 2% minion attack/cast speed. Respec about 18 points.
15. **+1 minion shield:** fossil craft (Bound, Pristine, Dense).
16. **Checkpoint:** the build is now "ready to challenge all Uber bosses and T17 maps".

**Mid game:**
- 100% spell suppression (tattoos, Green Nightmare, Magebane);
- a level 21/20 AWoRA;
- a +2 trigger wand;
- Ashes of the Stars anointed with Death Attunement;
- Watcher's Eye (Determination physical damage reduction);
- Fortress Covenant;
- **Amanamu's Gaze** ("around 20% more damage");
- a corrupted Vestigial or Foulborn Covenant: +2 duration, +2 minion or +1 gems.

**Budget references:**
- Corak: about 8 / 50 / 300 div tiers.
- PoE Vault low budget: Tabula or 6-link, minion Convoking wand, Ghastly Eye poison jewels, life-on-block shield.
- Maxroll calls the early Covenant setup "more than capable of killing all of the Uber bosses".

### 5b. Common pitfalls (multiple sources)

- **Forgetting to re-summon.** Weapons last about 85 s and vanish on zone change and death. Trigger the Ritual mechanic, or pause, to resummon. Unleash is there for summon speed. (Maxroll; Corak.)
- **Mana.** Bladefall and summon spam drain mana. Run 1–2 mana flasks or pay the cost with Blood Magic. Keep Bladefall and Desecrate at level 1. (PoE Vault; Maxroll.)
- **Low-level minion gems.** "Buying low level Minion gems and trying to do maps with them" is a listed mistake: minion damage and life scale with gem level. Do not buy 1/20 minion gems. (Maxroll.)
- **Mapping setup on bosses.** Low single-target damage usually means you forgot to swap to the bossing gems. (Maxroll FAQ.)
- **Losing spectres.** Swapping weapon sets or gear, or moving the Spectre gem, can kill them; Bone Offering can destroy corpses. Change gear in town. (Maxroll.)
- **Map mods.**
  - Reduced aura effect "bricks the build".
  - No regen is fatal without Blood Magic.
  - Avoid -max res, less armour/block, charge steal, less recovery and extra projectiles.
  - Regex: `"te of|m resistances$|r, f|ur$|ills$|t reg"`. (Maxroll.)
- **Accuracy:** no guide mentions minion accuracy as an issue. Poison and chaos damage scaling is via chance to poison, so there is no crit dependency. **[inference]**
- **Minion life:** survivability comes from gem levels, Bone Barrier (40% of life as extra ES), Summon Phantasm + Life from Death, and Decay Ward / Bone Offering block. Animated weapons have about 17k life in the early Covenant setup and about 34k in the mid setup. Early uber or T17 bosses can kill them. (Maxroll FAQ.)
- **Visual clarity** is listed as a weakness. (Maxroll.)

---

## 6. League-starter strength and alternatives

**For it:**
- Maxroll rates it Difficulty Low, Budget Moderate, Mapping Great, Bossing Excellent, Defence Excellent, and "HC viable". (2026-11-05.)
- A PoB Archives description calls it "arguably the best budget league starter". (Search snippet, 3.27, not verified.)
- A 3.29 tier list puts an "Animate Weapon Necromancer" in Tier A. (playerauctions/aggregator via search, low reliability.)
- Mobalytics title: "Better than Holy Relic". (3.27.)

**Against / caveats:**
- GhazzyTV: no longer recommended, and "not a recommended league starter" because of gem access. (PoE Vault, 2025-10-28, out of date.)
- Sportskeeda (3.28): "you cannot League start with it", transition at about 70–75. (Search snippet only; the page returned 405.)
- Corak: re-summoning after the 3.28 changes "would hinder speed", so not recommended for maximum speed.

**Consensus [inference]:** it is a strong **second-phase** build. You league-start a Necromancer on Absolution or SRS and convert at about level 75–80, once you have the transfigured gem plus a 5-link. Day-1 AWoRA leveling is not what anyone does.

**Alternatives people mention:**
- Poison SRS Necromancer (Maxroll, same author; often called the best 3.29 starter overall);
- Absolution Necromancer;
- Holy Relic of Conviction;
- Poison Carrion Golems & Zombies (Helm Breaker 3.28);
- Minion Army / Spectres.

Sources: https://maxroll.gg/poe/build-guides/poison-srs-necromancer-league-starter; https://www.poebuilds.cc/poe1/author/helm-breaker/new; tier-list search results (2026-07/08).

---

## 7. What to re-verify once the 3.30.0 notes are out (target: before 2026-11-13)

1. Animate Weapon / AWoRA numbers, duration, and the Lingering Blade interaction.
2. Bladefall / Bladefall of Trarthus availability (Mercenaries).
3. Unleash, Void Manipulation, Vile Toxins, Unbound Ailments, GMP, Pierce, Minion Damage.
4. Necromancer nodes; whether the Bloodline and Vestigial/Foulborn uniques persist.
5. The Covenant, Darkness Enthroned, Ashes of the Stars, Amanamu's Gaze, Jinxed Juju.
6. Divine Font transfigure option and lab layout.
7. Harvest becoming Roots (affects the +2 helmet and cluster crafts), plus the gold respec vendor.
8. Absolution and the campaign gem rewards and vendors (zone layout changes).
9. Bandit reward amount.

Maxroll typically updates the guide for the new patch around launch. Re-pull planner profile `ef5hj0rf` (via https://maxroll.gg/poe/planner/ef5hj0rf) for the 3.30 version.
