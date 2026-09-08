# Cloudflare configuration audit — 2026-09-08

Scope: the existing `wizardcompedium` static-assets Worker and `Asvenor/WizardCompedium`. No other application, account-wide security, billing, credentials, bindings, domains or saved character data were changed.

## Verified baseline

- Production: [Wizard Compendium](https://wizardcompedium.edward-nyarko.workers.dev/).
- Published version at audit start: `faf3fae9-4b5a-41b0-b974-b4bb3a3ace41`, deployed from main commit `490537f4510b74cabd53c44c82b8120161543f09` on September 8.
- This is **Workers Static Assets**, not a Cloudflare Pages project. It has no application Worker module or runtime bindings. Static-only metrics and runtime-variable controls being unavailable are expected, not an outage.
- `workers.dev` and version previews were enabled. The compatibility date was `2026-09-07`, with `global_fetch_strictly_public`; logs enabled, traces disabled. These choices are preserved in the repository configuration.
- Production and non-production have separate, non-overlapping branch triggers. Builds on both branches are not duplicate production deployments.
- The last production build used Node.js `24.18.0`, which supports the repository's TypeScript test imports; GitHub validation uses Node.js 24 too.
- Live HTML returned HTTP 200 and `Cache-Control: public, max-age=0, must-revalidate`. `/play` redirected to `/play/`; a nonexistent route returned HTTP 404. Existing fingerprinted Astro files had immutable caching; additional browser-security headers were absent.

## Confirmed defects and corrections

| Finding                                                          | Evidence                                                                                                                                                                                             | Correction                                                                                                                |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Branch preview uploads always failed                             | Build `a0767d7f-6fb4-4932-b88a-04e76ec45f68` finished its site build, then failed with “Missing entry-point to Worker script or to assets directory.”                                                | Added explicit `--assets ./dist` to the existing preview command; added persistent `wrangler.jsonc` for both build paths. |
| Cloudflare published without running regression/type/link checks | Both triggers originally used only `npm run build`.                                                                                                                                                  | Production and preview publishing now require the existing checks to pass.                                                |
| Broken second hosting pipeline                                   | [GitHub run 34174504216](https://github.com/Asvenor/WizardCompedium/actions/runs/34174504216) failed at **Setup Pages**. Its workflow would upload the entire source repository, not an Astro build. | Replaced that workflow with validation-only CI. Cloudflare remains the only production publisher.                         |
| Deployment configuration depended on automatic discovery         | No tracked Wrangler config or pinned Wrangler dependency; production auto-detected Astro while `versions upload` did not.                                                                            | Pinned Wrangler `4.129.1` (verified current registry version) and added explicit static asset routing.                    |
| Production built the site twice                                  | Build `286518ab-983f-4443-b3db-21089d55e478` built Astro, then Wrangler auto-configured an adapter and ran `npm run build` again.                                                                    | Explicit static-assets configuration removes framework auto-configuration and its redundant second build.                 |
| Browser security policy missing                                  | Live HTML had none of the new headers listed below.                                                                                                                                                  | Added `public/_headers`, to take effect with the next site deployment.                                                    |

## Remote settings saved and re-read

Cloudflare's connector could read but returned authentication error `10000` on the first attempted trigger update. A read-back confirmed no partial changes. The same scoped corrections were then saved through the existing authenticated Cloudflare dashboard and independently re-read through the API.

| Existing trigger       | Before                         | Saved setting                                                                                            |
| ---------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Production build       | `npm run build`                | `npm run check && npm test && npm run build && npm run validate:build`                                   |
| Production deploy      | `npx wrangler deploy`          | Unchanged                                                                                                |
| Preview build          | `npm run build`                | Unchanged; the dashboard exposes one shared-looking build field but updates the production trigger only. |
| Preview version upload | `npx wrangler versions upload` | `npm run check && npm test && npm run validate:build && npx wrangler versions upload --assets ./dist`    |

The preview checks therefore run **after its build and before its upload**. Production includes only `main`; previews include `*` and exclude `main`. Root `/`, watch paths `*`, empty path exclusions, build caching, existing build token and repository connection were verified unchanged. No deployment was triggered by this settings edit. The internal production trigger label was left unchanged because the dashboard offers no separate label control; it does not affect behavior.

## Repository delivery policy

- `wrangler.jsonc` uses only `dist/`, direct static asset serving, trailing slashes matching Astro, and the site's own `404.html`. It does not add a SPA fallback that would hide broken links.
- `keep_vars` prevents accidental removal of future dashboard variables. This site currently has none. Existing preview availability, runtime compatibility and logging settings are retained.
- `public/_headers` preserves long caching for fingerprinted `/_astro/` resources only. HTML, Pagefind/search manifests and unversioned PDF/OCR resources retain revalidation, so deploying a new parser does not strand visitors on an old copy.
- Security headers add `nosniff`, same-origin framing, an origin-only cross-site referrer, and disable unused camera/microphone/geolocation features. The CSP restricts objects, base URLs and framing. It deliberately does not block inline scripts, blob workers or WebAssembly required by search/PDF/OCR.
- No blanket CORS, new authentication layer, custom domain, plan upgrade, KV/D1/R2 storage, cache purge or credential rotation was added.
- `.gitignore` now excludes local Wrangler state and conventional local secret files.

## Verification and release boundary

- Wrangler `4.129.1` deployment dry-run succeeds with no bindings and explicit assets. No pre-existing locked dependency version changed; installing Wrangler reported zero known package vulnerabilities.
- Run `node --test scripts/test-cloudflare-config.mjs` to check the pinned schema, routing, cache policy, compatible security headers and validation workflow.
- All five configuration regression tests passed. The consolidated build was also served by local Wrangler: both header rules parsed successfully, homepage/import/search returned the expected security headers, HTML and unversioned resources revalidated, fingerprinted JavaScript received immutable caching, slash redirects preserved query parameters, and unknown routes returned the branded page with HTTP 404.
- Local HTTP verification compared OCR worker, language data and WebAssembly response hashes against built files and confirmed the correct content types. PDF.js worker files, standard fonts, character maps and image-decoding WebAssembly were also checked. Search-index conditional revalidation returned HTTP 304.
- Run the full build and its validation before publishing. Then verify live HTML/security headers, a fingerprinted asset's cache policy, the custom 404, search and PDF import against the newly deployed version.
- The remote build-command fixes are already saved. Repository config, headers and GitHub workflow changes are **not live until committed/pushed and Cloudflare finishes a successful build**. A dry-run alone is not evidence of publication.

## Primary references

- [Workers static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/)
- [HTML and trailing-slash handling](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)
- [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Workers Builds branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)
- [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

Configuration fields were also validated against the installed Wrangler `4.129.1` JSON schema rather than copied from older examples.
