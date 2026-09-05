# Wizard Compendium website

This is the Astro website for the complete Ultimate Wizard Compendium. It combines fast play tools with the original 61-chapter reference.

## Run the website

Open a terminal in this folder, then run:

```sh
npm install
npm run dev
```

Open the local address printed in the terminal. Stop the server with `Ctrl+C`.

Create the same production files Cloudflare receives with:

```sh
npm run build
```

The finished static site is written to `dist/`.

## Where to edit things

- **Edit a chapter:** open the matching numbered file in `src/content/chapters/`.
- **Edit a spell:** open its JSON record under `src/content/spells/level-*` or `src/content/spells/cantrips/`.
- **Add a spell:** copy a nearby spell JSON file into the correct level folder, give it a unique `id`, and replace every field with the new spell’s verified information. The database, search, tools, and detail route update automatically.
- **Change the homepage:** edit `src/pages/index.astro`.
- **Change navigation:** edit the `nav` list in `src/components/layout/BaseLayout.astro`.
- **Change global colors:** edit the variables at the top of `src/styles/global.css`. Tier and build colors are labeled there.
- **Add a simple tool:** add a page under `src/pages/tools/`, or add a focused component under `src/components/` and include it from `src/pages/tools/index.astro`.

`src/data/` contains small navigation and cockpit datasets. `src/features/my-wizard/profile.ts` owns the localStorage profile format. There is no database or account system.

## Test before pushing

Run all of these:

```sh
npm run check
npm run validate:content
npm run audit:fidelity
npm run build
npm run validate:build
```

Then check the homepage, Search, Play, Spells, Compare, My Wizard, Level Up, Prepare, Tools, Learn, and Full Compendium in the browser.

## How deployment works

The normal path is:

1. Make and test a local change.
2. Commit it with Git.
3. Push the commit to GitHub.
4. Cloudflare detects the configured production branch, builds the Astro project, and publishes the new version.

Live site: <https://wizardcompedium.edward-nyarko.workers.dev/>

## Important content rule

The original Compendium remains the authority for optimization conclusions. Do not delete chapter material or invent missing spell metadata. Update the canonical chapter or spell record, then let the reusable views consume it.
