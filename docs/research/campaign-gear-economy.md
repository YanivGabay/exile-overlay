# PoE1 leveling gear research (3.29 "Curse of the Allflame", researched 2026-11-02)

Labels: **VERIFIED** = primary/game-data source (GGG patch notes, poedb game data, poe.ninja API, poe.re source code) or 2+ independent reputable guides agree. **UNVERIFIED** = single weak/third-party source or memory.
poewiki.net and Reddit were not fetched (bot-blocked). mobalytics.gg returned HTTP 403 to WebFetch, so mobalytics facts below come from search snippets only and are marked UNVERIFIED.

Key primary source: GGG 3.29.0 patch notes: https://www.pathofexile.com/forum/view-thread/3985332 (read in full in two passes).
League timeline: 3.29 launched 2026-07-24 (first poe.ninja data point is 2026-07-24); poe.ninja league id is `Allflame`, passive tree `PassiveTree-3.29` (https://poe.ninja/poe1/api/data/index-state).

---

## 0. 3.29 socket changes (they affect every topic below)

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| "Gems can now be Socketed into any Equipment Socket, even if the Gem Colour does not match the Socket Colour." | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| "Item Sockets are now always White by default." Matching R/G/B socket gives the gem +10% quality. | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| Chromatic Orbs now force one socket to be non-white; the rest roll colours normally. | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| Jeweller's / Tainted Jeweller's / Orb of Binding always add White sockets. | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| Chromatic Orbs are rarer and **no longer sold by town vendors for Jeweller's Orbs**. | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| Bench R/G/B socket-colour crafts removed; new bench "at least N non-white sockets": 2 = 5 chrome, 3 = 20 chrome, 4 = 75 chrome (patch notes quote the 3-socket/20 chrome line; the 5 and 75 come from guides). | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 ; https://timesaver.gg/blog/poe-6-link-6-socket-vendor-recipe-3-29 ; https://www.u4gm.com/es/poe/blog-path-of-exile-patch-3.29-socket-changes | VERIFIED (20). UNVERIFIED (5/75: third-party only) |
| Bestiary "stack of 8 Chromatic Orbs" craft now makes a Rare Four-Linked Helmet (endgame, not campaign). | 3.29.0+ | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| 3.29.2 fixed chrome not guaranteeing a non-white socket on items with abyssal sockets. | 3.29.2 | https://www.playnews.gg/en/guides/path-of-exile-3-29-the-guide-to-white-sockets-quality-bonuses-and-chromatic-orbs | UNVERIFIED |
| **Overlay impact:** "chrome your 4L to RGB" advice no longer applies; any 4L/5L works for any gems; links are the only thing that matters. Treat old colour-based guides as outdated. | 3.29 | derived from patch notes above | VERIFIED (derived) |

---

## 1. Getting a 5-link / 6-link during the campaign or first hours (ranked)

| Rank | Fact | Applies to | Source URL | Label |
|---|---|---|---|---|
| 1 | **Tabula Rasa** (unique Simple Robe): six linked **white** sockets, level req 3, no defences. The cheapest and most reliable 6L at league start: buy it from trade as soon as you have a few chaos. poe.ninja Allflame price now (2026-11-02, late league) is **5 chaos, 1322 listings**. White sockets already worked with any gem, so 3.29 did not change it much. | all leagues; price 3.29 late | https://poedb.tw/us/Tabula_Rasa ; https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=Allflame&type=UniqueArmour | VERIFIED (item). Price VERIFIED (poe.ninja); day-1 price not available |
| 1a | Tabula div cards: **Humility** (9 cards, drop level 23, listed drop area Forking River, a map); **Vanity** also listed. Humility trades at ~9c per card on poe.ninja, so buying the Tabula directly is far cheaper. **Sambodhi's Wisdom** (re-enabled 3.26) gives a corrupted 2-implicit Tabula. | 3.26+ | https://poedb.tw/us/Humility ; https://poedb.tw/us/Tabula_Rasa ; https://poe.ninja/poe1/api/economy/exchange/current/overview?league=Allflame&type=DivinationCard | VERIFIED |
| 2 | **Orb of Fusing on a 5- or 6-socket item**: the bench price sets the yardstick. The bench charges 150 fusings for a 5L, about the average spend by hand. Per-orb 5L odds are roughly 0.6-0.8% (old community log), and quality raises the odds. Fusings were about 0.05c on day 1 and 0.12c now, so a 5L costs ~8-20c of fusings early. | odds are old data; prices 3.29 | https://www.pathofexile.com/forum/view-thread/203971 ; https://www.pathofexile.com/forum/view-thread/48053 ; https://poedb.tw/us/Crafting_Bench ; poe.ninja details API (see §4) | UNVERIFIED (odds: old forum data, GGG has never published them); bench cost VERIFIED |
| 3 | **Crafting bench link crafts** (hideout bench; the recipe must be found in the listed area): Two/Three/Four Linked Sockets cost 1/3/5 Fusing, **unlocked in Kaom's Stronghold (Act 4)**. Five Linked = 150 Fusing, unlocked in **Plaza** (poedb) or **Infested Valley** map (vhpg, older). Six Linked = 1500 Fusing, unlocked in Grotto (map). **The 5L and 6L crafts are endgame-only. In the campaign the bench gives a guaranteed 4L only.** | current poedb data (3.29) | https://poedb.tw/us/Crafting_Bench ; https://www.vhpg.com/poe-4-link/ ; https://www.vhpg.com/poe-5-link/ | VERIFIED for 2-4L (Kaom's Stronghold) and the costs. 5L unlock area disputed (UNVERIFIED) |
| 3a | **Bench socket crafts**: 2/3/4 sockets cost 1/3/10 Jeweller's (The Grand Arena, Act 3). 5 sockets cost 70 Jeweller's (Pit, map). 6 sockets cost 350 Jeweller's (Arid Lake, map). The bench overrides item-level socket limits. 3.29 bench sockets come out white. | 3.29 | https://poedb.tw/us/Crafting_Bench ; https://timesaver.gg/blog/poe-6-link-6-socket-vendor-recipe-3-29 | VERIFIED |
| 4 | **Mercenaries** (3.29 core feature, from Act 3): you wager gold in a duel to win an item the mercenary carries, and lose the gold if you lose. Mercenary gear *can* include linked items, but no source confirms 5L availability. | 3.26 mechanic, 3.29 return | https://www.pcgamesn.com/path-of-exile/3-29-curse-of-the-allflame ; https://neonsect.com/path-of-exile/poe-329-mercenaries-guide/ | UNVERIFIED (5L angle); duel/wager VERIFIED (2 sources) |
| 5 | **Divination cards giving linked items** (none drop in the campaign at useful odds): **The Chains that Bind**: 11 cards for a 6L normal body armour (corrupted), drop level 38, drop areas Cells and Hallowed Ground (maps). **The Jeweller's Boon**: 5 cards for an influenced 6-socket 5L body armour, drop level 68. **Immortal Resolve**: 6 cards for an influenced 6L. A Mobalytics snippet says Chains that Bind can come "from Tasuni in the acts". | current | https://poedb.tw/us/The_Chains_that_Bind ; https://poedb.tw/us/The_Jewellers_Boon ; https://mobalytics.gg/poe/guides/6-link-early-game-methods (snippet via search; 403 on fetch) | VERIFIED (cards/drop levels via poedb). Tasuni claim UNVERIFIED |
| 6 | **Vendor recipes do NOT create links.** They only convert links into currency: 6-socket item = 7 Jeweller's; 6-linked item = 20 Fusing (takes priority; the 3.19 change); R-G-B linked item = 1 Chromatic. Timesaver says 3.29 left all three unchanged, but RGB-linked items are now much rarer because sockets default to white. | 3.19+/3.29 | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes ; https://timesaver.gg/blog/poe-6-link-6-socket-vendor-recipe-3-29 | VERIFIED |
| 7 | **Town vendors** sometimes stock linked items (3L/4L are common). No guaranteed 5L vendor exists, and Lilly Roth sells gems, not gear. | general | memory; poedb Lilly page shows no gear inventory https://poedb.tw/us/Lilly_Roth | UNVERIFIED |
| 8 | **Other 6L uniques** cost far more (e.g. Skin of the Loyal 6L at ~3691c on poe.ninja now) and are not a leveling option. | 3.29 | https://poe.ninja/poe1/api/economy/stash/current/item/overview?league=Allflame&type=UniqueArmour | VERIFIED |
| 9 | **The league mechanic (Allflame: Bathysphere, Lanterns, Charts, Voyages; Vesper's Allflame crafting with Dead Man's Sulphur/Ducats)** has no confirmed campaign link source. One guide calls it level 67+ content. | 3.29 | https://www.pcgamesn.com/path-of-exile/3-29-curse-of-the-allflame ; https://www.tribality.com/?p=37900 | UNVERIFIED |
| 10 | **Harvest** (reforge links / colours) is endgame only. 3.29 removed the Horticrafting "reforge a random socket to White" option. | 3.29 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| — | **Older-league only:** chromes bought from vendors (3:1 for Jeweller's) were removed in 3.29. The bench R/G/B colour crafts were removed in 3.29. | pre-3.29 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |

**Practical ranking at league start:** (1) buy a Tabula Rasa early (from Act 1-2, as soon as you can trade). (2) Bench a guaranteed 4L once Kaom's Stronghold (A4) is unlocked. (3) Fuse a 5-6-socket body armour you find once you have ~100-150 fusings. (4) Everything else is luck or endgame.

---

## 2. Leveling vendor recipes (still valid in 3.29: none are mentioned as changed in the patch notes)

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| **Movement speed boots:** Normal Boots + Quicksilver Flask + Orb of Augmentation gives Magic Boots with **10%** MS. | current | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| **MS upgrade:** Magic or Rare Boots with X% MS + Quicksilver Flask + Orb of Augmentation gives Magic Boots with (X+5)% MS, repeatable to 30%. The output is always Magic, so a rare loses its other mods. | current | https://poedb.tw/us/VendorRecipes ; https://poedb.tw/Quicksilver_Flask | VERIFIED |
| **Phys weapon:** Weapon + Rustic Sash (Magic, Rare or Unique) + Blacksmith's Whetstone gives a Magic weapon with increased Physical Damage. Magic sash: 40-49% (Heavy). Rare: 50-69% (Serrated). Unique: 65-84% (Wicked). | current | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| **Spell damage weapon:** Dagger/Sceptre/Staff/Wand + Chain Belt (Magic/Rare/Unique) + Blacksmith's Whetstone gives a Magic weapon with 10-59% increased Spell Damage. | current | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| **Added elemental damage (attack weapons):** a Normal weapon (lowest tier), or a Magic/Rare weapon with that added-damage mod, + Orb of Augmentation + **Ruby Flask (fire) / Sapphire Flask (cold) / Topaz Flask (lightning) / Granite Flask (phys)** gives a Magic weapon with added X damage **one tier higher**. Repeatable. | current | https://poedb.tw/us/VendorRecipes | VERIFIED (poedb game data; one source) |
| **OUTDATED:** Magic Sceptre/Wand/Rune Dagger + Ruby/Sapphire/Topaz **Ring** + Orb of Alteration ("added X damage to spells") was **removed in 3.21**. Many old guides still list it. | removed 3.21 | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes (changelog: deprecated wand recipe removed 2023-11-22) | VERIFIED |
| **+1 spell skill gems weapon:** a **Normal** Rune Dagger/Sceptre/Staff/Wand + 2 or more quality skill gems with **combined 40% quality** sharing the tag (fire/cold/lightning/physical/chaos) gives a weapon with "+1 to Level of all X Spell Skill Gems". Maxroll says staves roll +1-2. | 3.14+ | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| **+1 minion helmet:** a Normal Helmet + 2 or more quality Minion gems (combined 40% quality) gives a Helmet with "+1 to Level of Minion Gems in this item". | current | https://poedb.tw/us/VendorRecipes | VERIFIED (one source, game data) |
| **Ring bases:** Iron Ring + red/green/blue skill gem gives a Ruby/Topaz/Sapphire Ring. | current | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| **Currency recipes:** 3 Armourer's Scrap = 1 Blacksmith's Whetstone. Selling a quality gem or flask returns a Gemcutter's Prism or Glassblower's Bauble (quality items; the usual threshold is 20% on one item or 40% total). | current | https://poedb.tw/us/VendorRecipes | VERIFIED (recipe exists); 40%-total threshold UNVERIFIED (memory, not quoted on poedb) |
| **Flasks:** 3 Life (or Mana) flasks of the same tier give 1 of the next tier. Life Flask + Mana Flask + Orb of Fusing gives a Hybrid Flask. | current | https://poedb.tw/us/VendorRecipes ; https://maxroll.gg/poe/resources/vendor-recipes | VERIFIED |
| Level 20 support gem + Gemcutter's Prism gives a 20% quality (level 1) support gem. | current | https://poedb.tw/us/VendorRecipes | VERIFIED |

---

## 3. Flasks while leveling

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| Life flask tiers by **required level** (≈ drop level): Small (1), Medium 3, Large 6, Greater 12, Grand 18, Giant 24, Colossal 30, Sacred 36, Hallowed 42, Sanctified 50, Divine 60, Eternal 65. | current | https://poedb.tw/us/Life_Flasks | VERIFIED |
| Life recovered per flask: 70 / 150 / 250 / 360 / 640 / 830 / 1000 / 1200 / 1990 / 1460 (fast, 1.5 s) / 2400 / 2080 (2 s). Overlay rule of thumb: upgrade as soon as a new tier is buyable or drops, or use the 3-to-1 recipe. | current | https://poedb.tw/us/Life_Flasks ; https://maxroll.gg/poe/getting-started/flasks-for-beginners | VERIFIED |
| A town vendor sells flasks for your level range. | current | https://maxroll.gg/poe/getting-started/flasks-for-beginners | UNVERIFIED (single guide; matches common knowledge) |
| Utility flask required levels: Quicksilver 4, Bismuth 8, Ruby/Sapphire/Topaz/Amethyst 18, Granite/Jade/Silver/Quartz/Basalt/Stibnite/Aquamarine/Sulphur/Gold/Iron 27. | current | https://poedb.tw/us/Utility_Flasks | VERIFIED |
| **Quicksilver** is a quest reward from **Mercy Mission (Act 1, Nessa, after Hailrake)**, offered to all classes alongside Medium Life and Medium Mana. A second one comes from **The Great White Beast (Act 2)**. | current | https://poedb.tw/us/Mercy_Mission ; https://maxroll.gg/poe/getting-started/flasks-for-beginners | VERIFIED |
| Granite, Ruby, Topaz and Sapphire are quest rewards from **The Key to Freedom (Act 5)**. Jade comes from **The Silver Locket (Act 7)** and Quartz from **Safe Passage (Act 10)**. Buy Granite/Jade from vendors at level 27+ if wanted earlier. | current | https://maxroll.gg/poe/getting-started/flasks-for-beginners ; https://poedb.tw/us/Utility_Flasks | UNVERIFIED (quest mapping from one guide; level reqs VERIFIED) |
| Flask quality: sell a flask with quality to get a Glassblower's Bauble. Baubles were 0.25c on day 1, 1.39c on day 3 and 0.26c now. | 3.29 prices | https://poedb.tw/us/VendorRecipes ; poe.ninja details API (§4) | VERIFIED |
| Use the life flask under ~50% life. Look for Bleed immunity (of Sealing / Staunching) and Freeze immunity (of the Deer / Heat). | general | https://maxroll.gg/poe/getting-started/flasks-for-beginners | UNVERIFIED (single guide) |
| No flask changes in the 3.29 patch notes (only Sanctum charges). | 3.29 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |

---

## 4. Currency during the campaign (poe.ninja Allflame exchange data, chaos value)

Endpoint used: `https://poe.ninja/poe1/api/economy/exchange/current/details?league=Allflame&type=Currency&id=<id>` (history), and `.../exchange/current/overview?league=Allflame&type=Currency` (current).

| Currency | Day 1 (2026-07-24) | Day 2 | Day 3 | Day 4 | Now (2026-11-02) | Label |
|---|---|---|---|---|---|---|
| Divine Orb | 27.8 | 80.4 | 101.1 | 115.8 | 410.1 | VERIFIED |
| **Chromatic Orb** | 0.44 | 0.82 | 1.23 | 1.42 | **4.02** | VERIFIED |
| Orb of Fusing | 0.053 | 0.158 | 0.236 | 0.188 | 0.124 | VERIFIED |
| Jeweller's Orb | 0.048 | 0.041 | 0.053 | 0.043 | 0.013 | VERIFIED |
| Gemcutter's Prism | 0.52 | 0.92 | 1.94 | 2.43 | 2.16 | VERIFIED |
| Orb of Alteration | 0.049 | 0.076 | 0.124 | 0.141 | 0.086 | VERIFIED |
| Vaal Orb | 0.26 | 0.57 | 0.60 | 0.46 | 0.32 | VERIFIED |
| Orb of Scouring | 0.22 | 0.38 | 0.36 | 0.31 | 0.48 | VERIFIED |
| Glassblower's Bauble | 0.25 | 0.75 | 1.39 | 1.33 | 0.26 | VERIFIED |
| Orb of Regret | 0.29 | 0.80 | 0.76 | 0.64 | 1.59 | VERIFIED |

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| **Chromatic Orbs are worth more than Chaos in 3.29** (4c now; rose 10x over the league) because vendors no longer sell them and drops were cut. **Keep or sell chromes; never spend them while leveling.** You don't need them now that gems fit any socket. | 3.29 | poe.ninja (above) ; https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |
| Gemcutter's Prism rose from 0.5c to ~2.4c by day 4. **Keep or sell GCPs; don't vendor quality gems for them unless you need the GCP.** | 3.29 | poe.ninja (above) | VERIFIED |
| Divine Orbs are cheapest in chaos on day 1 (~28c, versus 115c on day 4). Day-1 chaos buys the most leveling uniques and gear. | 3.29 | poe.ninja (above) | VERIFIED |
| Keep Fusings (for your own 5L), Alterations and Augmentations (MS-boot recipe and flask rolling), Jeweller's (bench sockets), Armourer's Scrap and Whetstones (recipes). Sell surplus fusings early: they peaked on day 3. | 3.29 | derived from poe.ninja + recipes above | UNVERIFIED (strategy, derived) |
| Fusings can be bought 4:1 for Jeweller's from a town vendor (Maxroll). It is unclear whether 3.29 kept this exchange (3.29 removed only the chrome-for-jeweller exchange). | pre-3.29; 3.29 unclear | https://maxroll.gg/poe/resources/vendor-recipes | UNVERIFIED |

---

## 5. Vendor search regex, gem vendors, gem buying

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| **poe.re** (repo veiset/poe-vendor-string, still updated 2026-10-31) generates PoE1 search strings for: Vendor, Map mods, Boat, Items (flasks, jewels), Expedition, Heist, Bestiary, Scarabs, Tattoos, Runegrafts. It promises "no false positives" and query shortening. | current | https://github.com/veiset/poe-vendor-string (README) ; https://poe.re | VERIFIED (source code) |
| poe.re Vendor page options: 2-6 links (any or coloured), 6 sockets, specific link colour counts (e.g. RGB), MS boots 10%/15%, +1 gem wands/sceptres per element, weapon damage (phys, % mult), weapon base filters. | current | https://github.com/veiset/poe-vendor-string/blob/HEAD/poe/src/utils/OutputString.ts | VERIFIED |
| Example fragments from poe.re: 4L `-\w-.-`, 5L `(-\w){4}`, 6L `(-\w){5}`, 6S `(\w[ -]){5}\w`, any 3L `-[rgbw]-`, MS 10% `Runn` (Runner's), MS 15% `rint` (Sprinter's), +1 fire `me Sh`, cold `singe`, lightning `derha`, phys `Litho`, chaos `Lord`, any +1 `"ll g"`, phys dmg `d.+cal d`. Alternatives are joined with `|`, and the whole string is quoted if it contains a space or a quote. | current | https://github.com/veiset/poe-vendor-string/blob/HEAD/poe/src/utils/OutputString.ts | VERIFIED |
| **3.29 caveat for overlay:** poe.re's *coloured-link* options use `[rgb]` (e.g. `[rgb]-[rgb]`), which **will not match white sockets (`W`)**. Use the "any link" options (they use `\w` or `[rgbw]`) in 3.29. | 3.29 | same file ; patch notes | VERIFIED (code reading) |
| In-game search box limit: **250 characters**. poe.re shows "Error: N / 250 characters used - PoE client has a max limit". GGG's regex forum guide confirms a limit exists without giving the number and suggests splitting long regexes. A Reddit snippet claimed 50 for PoE2 (different game or context). | current PoE1 | https://github.com/veiset/poe-vendor-string/blob/HEAD/shared/components/RegexResultBox/RegexResultBox.tsx (`maxLength ?? 250`) ; https://www.pathofexile.com/forum/view-thread/3724296 | VERIFIED (tool constant + GGG forum confirms a limit). Exact number from the tool only |
| **Siosa (Act 3, The Library)** becomes a gem vendor after **A Fixture of Fate** (return the Golden Pages). He sells "virtually every gem available up until that point" (gems from Acts 1-3 quests, for any class). | current | https://poedb.tw/us/A_Fixture_of_Fate ; https://www.poe-vault.com/guides/path-of-exile-beginner-guide-skill-gems ; https://www.gameslearningsociety.org/wiki/where-do-you-buy-all-skill-gems-in-poe/ | VERIFIED |
| **Lilly Roth (Act 6, Lioneye's Watch)**: optional quest **Fallen from Grace** (clear the Twilight Strand). Afterwards she sells **every gem except drop-only ones** (e.g. Empower/Enlighten), at level 1. She is also available in hideouts and the epilogue. | current | https://poedb.tw/Fallen_from_Grace ; https://www.vhpg.com/?p=7354 ; https://www.poe-vault.com/guides/path-of-exile-beginner-guide-skill-gems | VERIFIED |
| Before Siosa, quest-reward vendors in each town sell the class's quest gems plus some extras. | general | memory | UNVERIFIED |
| Gem prices by required level: Scroll of Wisdom (lvl 1) → Orb of Transmutation → Orb of Alteration → Orb of Chance/Alchemy for higher ones. | general | memory | UNVERIFIED |
| Gem strategy for overlay: buy the main skill and key supports as soon as quest vendors allow; buy the rest at Siosa (A3) and Lilly (A6). In 3.29 gem colour no longer limits which socket a gem goes in. | 3.29 | derived | UNVERIFIED (strategy) |
| 3.29: all classes can buy Faster Casting from Yeena after **Sharp and Cruel** (Act 2). | 3.29.0 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED |

---

## 6. Labyrinth trials

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| **Normal lab trials (Acts 1-3):** A1 The Lower Prison (Piercing Truth, spikes); A2 The Crypt Level 1 (Swirling Fear, spinning blades); A2 The Chamber of Sins Level 2 (Crippling Grief, sawblades); A3 The Crematorium (Burning Rage, lava); A3 The Catacombs (Lingering Pain, bladed sentries); A3 The Imperial Gardens (Stinging Doubt, darts). | current | https://maxroll.gg/poe/getting-started/labyrinth-guide ; https://gamerdiscovery.com/path-of-exile-ascendancy-trial-locations-list/ ; https://www.gamepressure.com/newsroom/all-lab-trials-locations-in-poe/zf70f2 | VERIFIED |
| **Normal lab is area level 33.** Guides suggest entering at character level ~33 (most players run it right after Act 3, at ~33-36). | current | https://maxroll.gg/poe/getting-started/labyrinth-guide ; https://www.exitlag.com/blog/poe-lab | VERIFIED (area level). Recommended char level UNVERIFIED |
| **Cruel lab (level 55)** trials: A6 The Prison (Piercing Truth); A7 The Crypt (Swirling Fear); A7 The Chamber of Sins Level 2 (Crippling Grief). | current | https://maxroll.gg/poe/getting-started/labyrinth-guide ; https://gamerdiscovery.com/path-of-exile-ascendancy-trial-locations-list/ | VERIFIED |
| **Merciless lab (level 68)** trials: A8 The Bath House (Burning Rage); A9 The Tunnel (Lingering Pain); A10 The Ossuary (Stinging Doubt). | current | https://maxroll.gg/poe/getting-started/labyrinth-guide ; https://gamerdiscovery.com/path-of-exile-ascendancy-trial-locations-list/ | VERIFIED |
| Eternal lab trials spawn in maps. The patch notes list no lab or trial changes in 3.29. | 3.29 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED (absence) |

---

## 7. Resistance penalties

| Fact | Applies to | Source URL | Label |
|---|---|---|---|
| Killing Kitava at the end of Act 5 permanently gives **-30%** to all elemental and chaos resistances. Act 10 Kitava gives another **-30%**, so **-60% total** after Act 10 (Epilogue/maps). | 3.0+ | https://pathofexile.fandom.com/wiki/Kitava,_the_Insatiable ; https://west-games.com/poe-resistance-cap-calculator/ ; https://poe-vault.com/guides/quick-reference-leveling-guide-act-5 | VERIFIED |
| The 3.29.0 patch notes contain no resistance-penalty change. | 3.29 | https://www.pathofexile.com/forum/view-thread/3985332 | VERIFIED (absence; full notes read) |
| Overlay suggestion: warn before the Act 5 and Act 10 Kitava fights ("resists drop 30% after this boss"). | — | derived | — |

---

## Flags / caveats
- 3.30 (launches 2026-11-13, reveal 2026-11-07/08) may change any of this. Re-check the patch notes for vendor recipes, sockets and the bench.
- Old guides that say "chrome to RGB", "buy chromes from vendor for jewellers" or "wand + ruby ring + alt" are **outdated** (3.29 and 3.21 respectively).
- Fusing per-orb odds are not published by GGG. The figures above come from old community logs.
- The day-1 Tabula Rasa price was not retrievable (poe.ninja item history endpoint 404'd).
