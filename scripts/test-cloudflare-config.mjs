import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Ajv from "ajv";
import { experimental_readRawConfig } from "wrangler";

// Use the pinned Wrangler reader so valid JSONC comments/trailing commas are
// handled exactly as deployment handles them.
const { rawConfig: config } = experimental_readRawConfig({
  config: fileURLToPath(new URL("../wrangler.jsonc", import.meta.url)),
});
const headers = await readFile(
  new URL("../public/_headers", import.meta.url),
  "utf8",
);
const workflow = await readFile(
  new URL("../.github/workflows/static.yml", import.meta.url),
  "utf8",
);

test("Cloudflare configuration matches the pinned deployment tool schema", async () => {
  const schema = JSON.parse(
    await readFile(
      new URL("../node_modules/wrangler/config-schema.json", import.meta.url),
      "utf8",
    ),
  );
  const validate = new Ajv({ strict: false, allErrors: true }).compile(schema);
  assert.ok(validate(config), JSON.stringify(validate.errors));
});

test("static production and preview deploys have an explicit asset root", () => {
  assert.equal(config.name, "wizardcompedium");
  assert.equal(config.assets.directory, "./dist");
  assert.equal(config.assets.run_worker_first, false);
  assert.equal(config.assets.not_found_handling, "404-page");
  assert.equal(config.assets.html_handling, "force-trailing-slash");
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, true);
  assert.equal(config.keep_vars, true);
  assert.equal(config.main, undefined);
});

test("only fingerprinted assets receive immutable browser caching", () => {
  const blocks = headers
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#")),
    );
  const cacheBlocks = blocks.filter((lines) =>
    lines.some((line) => /Cache-Control:/i.test(line)),
  );
  assert.equal(cacheBlocks.length, 1);
  assert.equal(cacheBlocks[0][0], "/_astro/*");
  assert.match(cacheBlocks[0][1], /max-age=31536000, immutable/);
});

test("security headers preserve inline scripts, local workers and WebAssembly", () => {
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: SAMEORIGIN/);
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(
    headers,
    /Content-Security-Policy: object-src 'none'; base-uri 'self'; frame-ancestors 'self'/,
  );
  // Search and PDF/OCR use WebAssembly and same-origin/blob workers. A stricter
  // script/worker policy needs browser coverage before it can be introduced.
  assert.doesNotMatch(headers, /(?:default|script|worker)-src/);
});

test("GitHub validates the built site without publishing raw repository files", () => {
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run check && npm test/);
  assert.match(workflow, /npm run build && npm run validate:build/);
  assert.match(workflow, /wrangler deploy --dry-run/);
  assert.doesNotMatch(
    workflow,
    /actions\/(?:upload-pages-artifact|deploy-pages|configure-pages)/,
  );
  assert.doesNotMatch(workflow, /pages: write|id-token: write/);
});
