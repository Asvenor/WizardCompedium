---
title: "D&D Beyond Builder Setup Guide"
chapter: 57
order: 57
part: "Part VIII"
partTitle: "SETUP + LIVE PLAY TOOLS"
hub: "reference"
sourceLocator: "B00919"
description: "Interface verification: checked 15.08.2026 in the logged-in D&D Beyond builder. Labels can move after site updates, so follow the function as well as the label. This chapter translates Chapter 4 and the build chapters into a repeatable setup audit."
---
<!-- source:B00920 -->
<aside class="callout" data-source-locator="B00920"><strong>BUILDER GREEN-LIGHT</strong><p>The active character builder is the campaign-legality engine: if the exact option is selectable under the agreed source settings, it is green-lit. Record the chosen version when duplicate entries exist; the active entry—not this guide—controls exact rules text. See <a href="/chapters/51-source-version-conflict-rules/">Chapter 51</a> for the version rules.</p></aside>

<!-- source:B00921 -->
Interface verification: checked 15.08.2026 in the logged-in D&D Beyond builder. Labels can move after site updates, so follow the function as well as the label. This chapter translates Chapter 4 and the build chapters into a repeatable setup audit.

<!-- source:B00922 -->
## A. Set the campaign legality profile

<!-- source:B00923 -->
<div class="table-wrap" data-source-locator="B00923" tabindex="0"><table><thead><tr><th scope="col">SOURCE SWITCH</th><th scope="col">PROFILE</th><th scope="col">HANDLING</th></tr></thead><tbody><tr><td>5.5e Core Rules</td><td>ON</td><td>Current core chassis and current core options.</td></tr><tr><td>5.5e Expanded Rules</td><td>ON</td><td>Supplementary current-rules options.</td></tr><tr><td>5e Core Rules</td><td>ON</td><td>Older core entries still allowed by the campaign.</td></tr><tr><td>5e Expanded Rules</td><td>ON</td><td>Expanded older material, including supported Wizard options.</td></tr><tr><td>Partnered Content</td><td>ON when owned</td><td>All purchased partner options are green-lit under this campaign rule.</td></tr><tr><td>Homebrew</td><td>OFF by default</td><td>Enable only as an explicit campaign change; record author/version.</td></tr><tr><td>D&amp;D Beyond Drops</td><td>OFF by default</td><td>Enable only when the campaign deliberately adds the subscription library.</td></tr><tr><td>Legacy/Noncore</td><td>OFF by default</td><td>Enable only when the campaign deliberately admits legacy/noncore entries.</td></tr></tbody></table></div>

<!-- source:B00924 -->
<aside class="callout callout--note"><p>Keep Feat and Multiclass Requirements enabled so the builder catches prerequisites. Treat Optional Class Features and any later source switch as a campaign setting: record the choice, then re-run <a href="/chapters/44-universal-level-up-audit/">Chapter 44</a>.</p></aside>

<!-- source:B00925 -->
## B. Build in the order the sheet validates

<!-- source:B00926 -->
<div class="table-wrap" data-source-locator="B00926" tabindex="0"><table><thead><tr><th scope="col">STAGE</th><th scope="col">VERIFY</th><th scope="col">PASS CONDITION</th></tr></thead><tbody><tr><td>1 · Home</td><td>Sources, prerequisites, advancement, HP method, encumbrance</td><td>Match the campaign profile before choosing any build option.</td></tr><tr><td>2 · Class</td><td>Starting class, class order, subclass, class-specific spells</td><td>Confirm the starting-class badge and the final level split.</td></tr><tr><td>3 · Background</td><td>Background entry, ability improvements, skills/tools/feat</td><td>Use the active background version and check every granted choice.</td></tr><tr><td>4 · Species</td><td>Species entry and granted choices</td><td>Record the exact version when the builder exposes alternatives.</td></tr><tr><td>5 · Abilities</td><td>Generation method, final scores, feat/ASI effects</td><td>Compare the displayed totals with <a href="/chapters/04-build-selection-and-priority-matrix/">Chapter 4</a>'s route.</td></tr><tr><td>6 · Equipment</td><td>Starting equipment, current inventory, worn/in-use state</td><td>Armor, Shield, focus, tools, and containers must be set—not merely owned.</td></tr><tr><td>7 · What's Next</td><td>Unresolved choices and route completion</td><td>Clear every warning before treating the character as locked.</td></tr><tr><td>8 · Character Sheet</td><td>Actions, Spells, Inventory, Features, Notes, Extras</td><td>Add reminders/custom actions only after the legal character is correct.</td></tr></tbody></table></div>

<!-- source:B00927 -->
## C. Route-specific class audit

<!-- source:B00928 -->
<div class="table-wrap" data-source-locator="B00928" tabindex="0"><table><thead><tr><th scope="col">ROUTE</th><th scope="col">CLASS ORDER</th><th scope="col">FIRST FAILURE TO CATCH</th></tr></thead><tbody><tr><td>CORE</td><td>Artificer 1 → Wizard 19</td><td>Artificer is marked Starting Class; Wizard spell access is one character level later.</td></tr><tr><td>CHRON / DIV / ILL</td><td>Wizard 1 → 20</td><td>Subclass is the intended selectable entry; Wizard timing equals character level.</td></tr><tr><td>BLADE</td><td>Wizard 1 → 20</td><td>Exact Bladesinger version is recorded; armor/weapon state matches that entry.</td></tr><tr><td>TANK</td><td>Artificer 1 → defensive Wizard 19</td><td>Armor, Shield, saves, ward/defense route, and delayed Wizard timing all display correctly.</td></tr><tr><td>FIGHTER</td><td>Fighter 1 → Wizard 19</td><td>Fighter is Starting Class; Fighting Style/armor state is correct; no Artificer features remain.</td></tr></tbody></table></div>

<!-- source:B00929 -->
## D. Keep class spells, spellbook, and preparation separate

<!-- source:B00930 -->
<div class="table-wrap" data-source-locator="B00930" tabindex="0"><table><thead><tr><th scope="col">BUILDER AREA</th><th scope="col">WHAT IT REPRESENTS</th><th scope="col">DO NOT MIX IT WITH</th></tr></thead><tbody><tr><td>Artificer class panel</td><td>Artificer choices only</td><td>Do not count them as Wizard spellbook entries or Wizard preparations.</td></tr><tr><td>Wizard · Prepared Spells</td><td>Current prepared Wizard package</td><td>Compare to <a href="/chapters/13-prepared-spell-packages/">Chapter 13</a> and the mission; cantrips and always-available entries are displayed separately by the interface.</td></tr><tr><td>Wizard · Ritual Spells</td><td>Ritual-access view</td><td>Keep ritual access distinct from the prepared combat package.</td></tr><tr><td>Wizard · Spellbook</td><td>Recorded Wizard spellbook</td><td>This is the ownership/copying ledger; reconcile it with <a href="/chapters/31-spellbook-operations-and-copy-priority/">Chapter 31</a>.</td></tr><tr><td>Wizard · Add Spells</td><td>Level-up and copied additions</td><td>Confirm source/version and acquisition method before adding the entry.</td></tr><tr><td>FINAL BUILDER AUDIT</td><td></td><td></td></tr><tr><td>Pass only when class order, subclass, displayed saves/AC, feats, spellbook, prepared spells, rituals, worn equipment, focus/tools, attunement, actions, and unresolved choices agree with the route. Then run <a href="/chapters/44-universal-level-up-audit/">Chapter 44</a> after every level and <a href="/chapters/55-actual-play-validation-standard/">Chapter 55</a> after play.</td><td></td><td></td></tr></tbody></table></div>
