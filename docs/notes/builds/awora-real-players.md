# AWoRA: how real players started their league (poe.ninja ladder data)

Collected 2026-11-07 by reading the poe.ninja website (poe1/builds, experience ladder) in a headless browser.
No API calls, no logins. Leagues: **Allflame (3.29, passive tree 3.29, ends 2026-11-09)** and **Mirage (3.28)**.
"AWoRA" = Animate Weapon of Ranged Arms. "Main skill" is poe.ninja's per-character main-skill pick.

How to read the traces: poe.ninja's time machine has snapshots Hour 3/6/12/18, Day 1-6, Week 1-15.
For each character I filtered the ladder by exact name in each snapshot. "absent" means the character was
not on the poe.ninja ladder in that snapshot. That can mean it did not exist yet, was below the ladder cut-off,
or its profile was private. It does not prove the character was created later.

## 1. Counts (latest snapshot)

### Allflame (3.29), latest: 1,226 characters with AWoRA as main skill

| Ascendancy | Count |
|---|---|
| Necromancer | 1,202 (98%) |
| Luminary | 15 |
| Gladiator | 5 |
| Chieftain | 1 (CanWeGetMuchDeeper) |
| Elementalist | 1 (Jazz_Allflame) |
| Guardian | 1 (srsoutotem) |
| Reliquarian | 1 (AmogusBigdickus) |
| Occultist / unascended Witch | 0 |

Second ascendancy (bloodline) among all 1,226: none 87%, Abyssal Bloodline 11%, Catarina 2%, Lycia/Chaos/Farrul 0.2% each.

Luminary characters: おひさいおん, autobot_dg, All_The_Small_Things, Underwater_Lumi_Snake, Phantom_Bot, ЕгорСильныйЛук,
Dajizhan_AWFIRE, LuminaryRangedArms, Некромурр, DietSupport, SCMIN, BigBuffBunnygirlEnjoyer, CAMZEE_LULU, COCAGS, Laipen.
Gladiator characters: Магний, RustyOldBoatMan, BlagoBlock, Allflame_Killed_PoeOne, NoDeathKaos.
The traces suggest Luminary is a Scion ascendancy: Некромурр was an unascended Scion at Hour 12, and autobot_dg was an Ascendant in Week 4.

AWoRA main-skill count over the league (all ascendancies):

| Snapshot | Allflame 3.29 | Mirage 3.28 |
|---|---|---|
| Hour 6 | 14 | n/a |
| Hour 12 | 100 | 103 |
| Day 1 | 348 | 330 |
| Day 2 | 738 | 726 |
| Day 3 | 979 | 971 |
| Day 6 | 1,403 | 1,256 |
| Week 1 | 1,482 | 1,328 |
| Week 2 | 1,678 (peak) | 1,231 |
| Week 4 | 1,528 | 982 |
| Latest | 1,226 | 1,061 |

In every snapshot the AWoRA ascendancy split was 96-99% Necromancer. At Hour 12 Allflame it was 96% Necromancer and 2% unascended Witch.

### Mirage (3.28), latest: 1,061 characters
Necromancer 1,044, Guardian 6, Gladiator 4, Elementalist 2 (ура_девять, terree), Reliquarian 2, Assassin 1 (Dark_Night),
Deadeye 1, Occultist 1 (ЭйДораТыГотова).

## 2. Per-character traces, Allflame 3.29 (characters that are AWoRA in the latest snapshot)

Format: snapshot, level, ascendancy, main skill. **Bold** = ascendancy change within the class.

### Necromancers: sample A (every 5th of the top 100, all level 100)

| Character | Earliest seen | Pre-AWoRA (snapshot, level, ascendancy, skill) | First AWoRA snapshot (level) |
|---|---|---|---|
| NoPP_Miku | H12 | H12/D1 L70 Necro, Summon Raging Spirit | D2 (95) |
| LightXIII_NoLuckVI | H12 | H12 L57 Necro, Absolution | D1 (92) |
| Elwen_LeBlanc | H12 | H12 L47 / D1 L80 Necro, Absolution | D2 (89) |
| LululemonGirlieMatcha | D2 | none seen | D2 (95) |
| HenkLikesQueues | D3 | none seen | D3 (94) |
| Corpseoortwo | D2 | none seen | D2 (93) |
| **Kevezor** | D6 | D6 L80 **Elementalist** (no main skill) / W1 L95 **Elementalist**, Penance Brand | W2 (100) as Necro |
| weleasedquacken | H12 | H12 L58 to D3 L94 Necro, Summon Raging Spirit | D6 (98) |
| SilverWolf | D3 | D3 L92 to W1 L99 Necro, Summon Holy Relic of Conviction | W2 (100) |
| EssohNecro | D1 | D1 L71 Necro, Absolution | D2 (91) |
| BardDeathFire | D3 | none seen | D3 (95) |
| **redblitzerworb** | H12 | H12 L40 Witch, Winter Orb / D1 L88 and D2 L93 **Elementalist**, Winter Orb | D3 (94) as Necro |
| JackBlackMamba | D1 | D1 L84 Necro, Absolution | D3 (95) |
| ミネラルウォーターあくあ | D3 | none seen | D3 (95) |
| CursedAnimeWeapon | W2 | none seen | W2 (100) |
| CoucouCJulien | W2 | none seen | W2 (100) |
| Tinchojuegapoetwo | H12 | H12 L38 Witch, Absolution / D1 L55 Necro, Absolution | D2 (89) |
| YEAH_BUDDY_LIGHTWEIGHT | H12 | H12 L43 to D2 L89 Necro, Summon Raging Spirit | D3 (92) |
| YawgzMin | D6 | none seen | D6 (97) |
| CrabSgorel | D2 | D2 L55 Necro, Absolution / D3 L80 Necro, Summon Carrion Golem of Hordes | D6 (97) |

### Necromancers: sample C (top 100, offset sample, all level 100; one name was cut off when the run was stopped)

| Character | Earliest seen | Pre-AWoRA | First AWoRA (level) |
|---|---|---|---|
| Zookerz | H3 | H3/H6 L40 Necro, Absolution | H12 (86) |
| AllflimatedWeapoison | D6 | none seen | D6 (100) |
| Emberzilla | H12 | H12 L68 Necro, Absolution | D1 (77) |
| Beehaul_aw | D2 | none seen | D2 (94) |
| CKN | D3 | D3 L95 Necro, Summon Stone Golem | D6 (98) |
| Blobble | D6 | none seen | D6 (98) |
| Meridias_Summoner | H12 | H12 L79 / D1 L80 Necro, Absolution | D2 (94) |
| **Bathosphussy** | H12 | H12 L75 / D1 L83 **Elementalist**, Explosive Arrow | D2 (94) as Necro |
| zero_allnec | H12 | none seen | H12 (80) |
| Horo_Peak_Yaoi | D2 | none seen | D2 (69) |
| **RanniColdDoT** | D6 | D6 L96 **Elementalist**, Creeping Frost of Floes / W1 L97 Wintertide Brand / W2 L100 Elementalist | W4 (100) as Necro |
| Crobee | W2 | none seen | W2 (100) |
| BEBEALLFLAME | H12 | H12/D1 L68 Necro, Absolution | D2 (95) |
| PipapiPoison | H12 | H12 L56 Necro, Absolution | D1 (91) |
| DargonsOceanGate | D6 | none seen | D6 (98) |
| BugbogKaiAJ | H12 | H12 L23 Witch / D1 L66 Necro, Absolution | D2 (93) |
| poison_vodolaz | H12 | none seen | H12 (63) |
| **ToxicallyRed** | H12 | H12 L70 to W1 L97 **Elementalist**, Eviscerate | W2 (100) as Necro |
| éssiérriéssi | W2 | W2/W4 L100 Necro, Summon Raging Spirit | after W4 |
| anflame | H12 | H12 L71 / D1 L82 Necro, Absolution | D2 (94) |

### Necromancers: low-level end (every 8th of the 100 lowest, levels 80-90)

| Character | Trace |
|---|---|
| 我坐戏子楼台前怎将情话递心间, TheWitcherthesecenth | not in any checked snapshot up to W14 (late characters) |
| PRAWnEater | first W2 L81 AWoRA |
| SureShotStook | first W14 L84 AWoRA |
| Neto_AWR | first W10 L85 AWoRA |
| **GosselinCold** | H12-D2 L56 **Elementalist**, Wintertide Brand; absent D3-W2; W4 L86 **Necro AWoRA** |
| teesttttt | first W8 L87 AWoRA |
| **blightedones** | D3 L70 **Occultist**, Frenzy; D6/W1 L85 Occultist, Blight of Contagion; absent W2-W12; W14 L88 **Necro AWoRA** |
| First_UBERS_attempt | first W3 L86 AWoRA |
| AliothAllFlame | first D2 L66 AWoRA (AWoRA by level 66) |
| Desp_Anime / Cry_Range | first W6 L89 / L90 AWoRA |
| mementorr | first W12 L90 AWoRA |

### AWoRA characters at Hour 12, traced back (sample of the 100 shown at H12)

| Character | H3 | H6 | H12 | Latest |
|---|---|---|---|---|
| Zookerz | L40 Necro, Absolution | L40 Absolution | L86 AWoRA | L100 AWoRA |
| RawLaker | absent | L65 Necro, Absolution | L84 AWoRA | absent |
| XelMed | absent | L64 Absolution | L73 AWoRA | L100 AWoRA |
| MudUnderDaSea | absent | L53 Necro, Summon Skeletons | L83 AWoRA | **L100 Elementalist, Blade Vortex** (left AWoRA) |
| Glech | L39 Necro, Animate Weapon (melee) | L39 Animate Weapon | L82 AWoRA | n/a |
| TombHolland | absent | L61 Absolution | L79 AWoRA | absent |
| AnimatedAnchor | absent | L50 Absolution | L69 AWoRA | absent |
| Galvanix | absent | L50 Absolution | L95 (no skill shown) | absent |
| Count_Dykeula / FedExOfDeath / ImbaQQ / Kala_Allflame | absent | absent | L82 / L67 / L64 / L66 AWoRA | L100 / L96 AWoRA / absent / absent |

Caveat: the H3 and H6 values are sometimes identical (Zookerz L40 in both). Those early snapshots may lag.

### Non-Necromancer AWoRA characters (Allflame, latest)

| Character (latest) | Trace |
|---|---|
| Магний (Gladiator) | H12 L34 Duelist; D2-D3 L65 Gladiator, Lacerate; D6 L90 Bladestorm; W1 L92 Lacerate; W2 L95 Blade Blast; **W4 L99 AWoRA** |
| Allflame_Killed_PoeOne (Gladiator) | H12 L21 Duelist; D1 L69 Gladiator, **Absolution**; **D2 L78 AWoRA** |
| RustyOldBoatMan / NoDeathKaos (Gladiator) | first W4 L94 / L90, already AWoRA |
| BlagoBlock (Gladiator) | not found in any checked snapshot |
| srsoutotem (Guardian) | D2-W1 L79-88 Guardian, **Animate Weapon (melee)**; W2 L95 Animate Weapon; **W4 L97 AWoRA** |
| CanWeGetMuchDeeper (Chieftain) | H12 L32 Marauder, RF; D1-D6 Chieftain, RF / Fire Trap; **W1-W4 Juggernaut, Molten Strike**; latest **Chieftain AWoRA** (two ascendancy swaps) |
| Jazz_Allflame (Elementalist) | D1 L58 to W2 L95 Elementalist, Ice Nova; W4 L96 Glacial Cascade; AWoRA only in latest (still Elementalist) |
| Некромурр (Luminary) | H12 L28 Scion; D3-W1 Luminary (no skill); W2 L91 Caustic Arrow; **W4 L92 AWoRA** |
| おひさいおん (Luminary) | W2 L100 Luminary (no skill); W4 AWoRA |
| autobot_dg (Luminary) | W4 L98 **Ascendant**, Penance Brand of Dissipation; latest Luminary AWoRA |
| Underwater_Lumi_Snake (Luminary) | W2 L97 Luminary, SRS; latest AWoRA |
| CAMZEE_LULU / Phantom_Bot / Dajizhan_AWFIRE / DietSupport | first seen D6 / W4 / W4 / W4, already AWoRA |
| AmogusBigdickus (Reliquarian) + 6 other Luminaries | not found in checked snapshots (late characters) |

## 3. Mirage 3.28 traces (sample)

In Mirage snapshots poe.ninja usually shows no main skill on AWoRA rows. Where needed I opened the character page
to check whether the AWoRA gem was equipped.

| Character (latest) | Trace |
|---|---|
| LightXIII_NoLuckV (Necro) | D1 L92, AWoRA equipped (AWoRA by Day 1) |
| TiltoshiGasGas (Necro) | D1 L84, AWoRA equipped |
| MirageLeckMeinArsch (Necro) | first D2 L96, AWoRA |
| Gilgamesh_from_Wish (Necro) | D1 L87 Absolution (Vaal Absolution, zombies, spectres); **D2 L95 AWoRA** |
| CarryOnJolems (Necro) | D1 L81 Absolution; D2 L95, no skill shown (probably AWoRA) |
| Smelllikefeet (Necro) | D1-W1 L81-98 **Lancing Steel of Spraying + Holy Relic**; **W2 L100 AWoRA** |
| **grungusbungus** (Necro) | D1-D3 L78-93 **Elementalist, Explosive Arrow**; **D6 L97 Necro AWoRA** |
| ZooksterStupidIdiot, MirageDave, Avoneli, Spixel_Mirage, Kringe_weapon | first seen D1-D6 as Necro, no skill shown (AWoRA from first sighting) |
| MEMIONS / Mi_Waltsu / AnimatedOne | first W1 / W1 / W2, Necro |
| WeArentVerificated (Necro) | D1-D3 L68 Absolution (stalled) |
| ChrisAnimate (Necro) | D2 L69, no skill shown |
| ура_девять (Elementalist) | D2 L61 Witch, Glacial Cascade; D3-W1 L84 Elementalist GC; **W4 L95 Occultist**, Ice Trap; latest **Elementalist** AWoRA (two swaps) |
| Dark_Night (Assassin) | D3-W2 **Trickster**, Flicker / Blight / Reap; W4 L94 **Assassin** |
| ГоризонтНаМираже (Guardian) | D1-W1 L68-93 Guardian, **Absolution**; W2 L97 |
| HolyShtSmthing (Guardian) | D1-D2 L79-88 Guardian, Absolution |
| XupaLongNeck (Guardian) | D6-W2 L94-98 Guardian |

The Mirage character-page run was stopped early (system low on memory) after 8 characters.
Mirage Necro skills for snapshots without a shown main skill are therefore partly inferred.

## 4. AWoRA links at the earliest AWoRA snapshot (character page, Allflame)

| Character | Snapshot | Lvl / Asc | AWoRA links |
|---|---|---|---|
| NoPP_Miku | D2 | 95 Necro | Minion Dmg, GMP, Pierce, Unleash, Added Chaos (item) |
| LightXIII_NoLuckVI | D1 | 92 Necro | Chance to Poison, Added Chaos, Void Manipulation, Pierce, GMP |
| Zookerz | D1 | 93 Necro | Minion Dmg, Unleash, GMP, Pierce, Void Manip, Added Chaos (item) |
| Elwen_LeBlanc | D2 | 89 Necro | GMP, Unleash, Pierce, Void Manip, Added Chaos (item) |
| LululemonGirlieMatcha | D2 | 95 Necro | Unbound Ailments, Unleash, Vile Toxins, Void Manip, Minion Dmg, Added Chaos (item) |
| Corpseoortwo | D2 | 93 Necro | Void Manip, Pierce, GMP, Unleash, Minion Dmg, Added Chaos (item) |
| EssohNecro | D2 | 91 Necro | Minion Dmg, Unleash, Chance to Poison, GMP, Pierce, Added Chaos (item) |
| Tinchojuegapoetwo | D2 | 89 Necro | Unleash, GMP, Chance to Poison, Pierce, Minion Dmg |
| AliothAllFlame | D2 | 66 Necro | Chance to Poison, Unleash, Minion Dmg, Pierce, (lesser) Multiple Projectiles |
| redblitzerworb | D3 | 94 Necro | Void Manip, Minion Dmg, Pierce, GMP, Unleash, Added Chaos (item) |
| YEAH_BUDDY_LIGHTWEIGHT | D3 | 92 Necro | Minion Dmg, Void Manip, Faster Attacks, Vile Toxins, Unbound Ailments, Added Chaos (item) |
| weleasedquacken | D6 | 98 Necro | Minion Dmg, GMP, Unleash, Pierce, Void Manip, Added Chaos (item) |
| CrabSgorel | D6 | 97 Necro | Unbound Ailments, Minion Dmg, Vile Toxins, Void Manip, Unleash, Added Chaos (item) |
| Kevezor | W2 | 100 Necro | Minion Dmg, Void Manip, Vile Toxins, Pierce, Greater Unleash, Added Chaos (item) |
| SilverWolf | W2 | 100 Necro | Void Manip, GMP, Pierce, Unbound Ailments, Minion Dmg, Greater Unleash, Added Chaos (item) |
| Allflame_Killed_PoeOne | D2 | 78 Gladiator | Minion Dmg, Volley, Vile Toxins, Unleash, Chance to Poison (item) |
| srsoutotem | W4 | 97 Guardian | Unbound Ailments, Minion Dmg, Momentum, Faster Attacks, Vicious Projectiles, Added Chaos (item) |

"Added Chaos (item)" means the Added Chaos Damage support came from an item, typically The Covenant body armour.
At the first switch the setup is already the full poison/chaos build. The most common early links are GMP + Pierce + Unleash + Minion Damage,
plus Void Manipulation or Chance to Poison. The late-league links swap in Vile Toxins / Unbound Ailments / Greater Unleash.

## 5. Aggregate (Allflame Necro samples A + C + low-level + H12 sample: 63 AWoRA Necro characters)

**Pre-AWoRA main skill (where an earlier non-AWoRA snapshot exists, n = 33):**
- Absolution (Necro or unascended Witch): **18**. LightXIII, Elwen, EssohNecro, JackBlackMamba, Tinchojuegapoetwo, CrabSgorel,
  Emberzilla, Meridias, BEBEALLFLAME, PipapiPoison, BugbogKaiAJ, anflame, Zookerz, RawLaker, XelMed, TombHolland, AnimatedAnchor, Galvanix
- Summon Raging Spirit: 4 (NoPP_Miku, weleasedquacken, YEAH_BUDDY_LIGHTWEIGHT, éssiérriéssi)
- Other Necro minion skills: Holy Relic (SilverWolf), Stone Golem (CKN), Summon Skeletons (MudUnderDaSea), Animate Weapon melee (Glech), Carrion Golem (CrabSgorel, after Absolution)
- **Different Witch ascendancy first: 7.** All are Elementalist or Occultist, and none had an AWoRA predecessor skill:
  redblitzerworb (Elem Winter Orb, D3 L94), Bathosphussy (Elem Explosive Arrow, D2 L94), Kevezor (Elem Penance Brand, W2 L100),
  ToxicallyRed (Elem Eviscerate, W2 L100), RanniColdDoT (Elem Creeping Frost/Wintertide, W4 L100), GosselinCold (Elem Wintertide, by W4 L86),
  blightedones (Occultist Frenzy/Blight, between W1 and W14).
- First seen already as AWoRA: about 27 (including zero_allnec and poison_vodolaz at H12, AliothAllFlame at D2 L66, Horo_Peak_Yaoi at D2 L69).
  Most of the rest only appear from D2 onward, already at level 90+. Late characters appear from W2 to W14 at levels 81-90 and were never anything else.

**Changed ascendancy vs Necro from the start:** in the top-100 samples (40 characters), 5 were Elementalist first (12%). 35 were Necro (or unascended Witch)
the whole time they were visible. In the low-level sample, 2 of 13 were Elementalist/Occultist first. Mirage sample: 1 of ~20 Necros (grungusbungus, Elem Explosive Arrow, switched by D6).
No sampled character was ever a bloodline or Occultist→Necro at the top end. Witch is the base class: 3 Witches were unascended at H12, then Necro on D1.

**Switch timing (Necro league starters):** Absolution/SRS until about level 55-85. Switch to AWoRA between Hour 12 and Day 2 (median about Day 2),
first seen as AWoRA at level 73-95 (median about 92). A second group switches around Day 3-6 (SRS/Golem starters, level 94-98).
Ascendancy swappers from Elementalist do it either on Day 2-3 (level 93-94) or in Week 2-4 at level 95-100, as a second-build respec.
The earliest observed AWoRA is about 14 characters at Hour 6 and 100 at Hour 12 (levels 63-86), so a small group plays AWoRA from the first maps.

## 6. Data gaps / not accessed
- poe.ninja: the website could be read only through the headless browser. A direct fetch of the site's internal search endpoint was blocked by the session's permission policy, so I did not use it.
  The ladder table caps at 100 rows per filter, so only the top 100 and the bottom 100 (by level) could be sampled. I found no URL level filter.
- No separate "starter" view exists on poe.ninja. The time machine (Hour 3 to Week 15) was used instead.
- Two runs were killed when the system ran low on memory: the Mirage character-page run (8 of 19 done) and the second Allflame sample (1 of 20 names cut off). They were not restarted.
- Mirage rows mostly lack a main skill for AWoRA, so some Mirage entries are inferred.
- pobarchives.com: blocked by a Cloudflare bot check (not bypassed). pobb.in has no public search. No PoBs with leveling sets were collected.
- "Absent" in a snapshot is ambiguous (did not exist yet, below the ladder cut-off, or private profile).
