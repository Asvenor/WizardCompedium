import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const v2 = resolve(root, '../Wizard_Compendium_V2');
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const manifest = read(
  resolve(root, 'src/data/core-spell-metadata-projection.json'),
);
const pointer = (value, path) =>
  path
    .slice(1)
    .split('/')
    .reduce((entry, key) => entry[key], value);
const sorted = (value) =>
  Array.isArray(value)
    ? value.map(sorted)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, sorted(value[key])]),
        )
      : value;
const digest = (value) =>
  createHash('sha256')
    .update(JSON.stringify(sorted(value)))
    .digest('hex');
const ids = [
  'shield',
  'web',
  'misty-step',
  'counterspell',
  'fireball',
  'detect-magic',
  'find-familiar',
];

test('the metadata fill stays limited to seven existing 2024 spells and dated primary claims', () => {
  assert.deepEqual(
    manifest.records.map((record) => record.spellId),
    ids,
  );
  assert.equal(manifest.source.edition, '5.2.1');
  assert.equal(manifest.source.verifiedAt, '2026-09-05');
  assert.equal(
    manifest.records.reduce((count, record) => count + record.fields.length, 0),
    36,
  );
  for (const record of manifest.records) {
    const card = read(resolve(root, record.websitePath));
    assert.equal(card.source.rulesVersion, '2024');
    assert.equal(card.source.review.date, manifest.source.verifiedAt);
    assert.match(card.source.review.scope, /not a new full-rule verification/);
    assert.ok(
      card.sourceLocator.startsWith('B'),
      'Original migration locator is preserved',
    );
    for (const field of record.fields) {
      assert.deepEqual(
        pointer(card, field.pointer),
        field.value,
        `${record.spellId} ${field.pointer}`,
      );
      assert.ok(
        [
          '/school',
          '/rules/duration',
          '/rules/components/verbal',
          '/rules/components/somatic',
          '/rules/components/material',
          '/rules/components/gpCost',
          '/rules/components/description',
        ].includes(field.pointer),
      );
      if (field.previousValue !== null) {
        assert.equal(record.spellId, 'find-familiar');
        assert.equal(field.pointer, '/rules/components/description');
      }
      const claim = record.claims.find((claim) => claim.id === field.claimId);
      assert.ok(claim, 'Every projected field has a retained claim');
      assert.equal(claim.status, 'verified_primary');
      assert.equal(claim.verifiedAt, '2026-09-05');
      assert.match(claim.ownerValueSha256, /^[a-f0-9]{64}$/);
      assert.ok(claim.evidence.length > 0);
    }
  }
});

test('Find Familiar uses one coherent 2024 requirement and other missing material pricing stays unknown', () => {
  const familiar = read(
    resolve(root, 'src/content/spells/level-1/find-familiar.json'),
  );
  assert.equal(familiar.rules.components.gpCost, 10);
  assert.equal(familiar.rules.components.consumed, true);
  assert.match(familiar.rules.components.description, /Burning incense/);
  assert.doesNotMatch(
    familiar.rules.components.description,
    /charcoal|herbs|vessel/,
  );
  for (const [level, id] of [
    [2, 'web'],
    [3, 'fireball'],
  ]) {
    const card = read(
      resolve(root, `src/content/spells/level-${level}/${id}.json`),
    );
    assert.equal(card.rules.components.description, null);
    assert.equal(card.rules.components.gpCost, null);
    assert.equal(card.rules.components.consumed, null);
  }
  const wall = read(
    resolve(root, 'src/content/spells/level-5/wall-of-force.json'),
  );
  assert.equal(wall.school, null);
  assert.equal(wall.rules.duration, null);
});

test(
  'projected fields still match read-only V2 owner values and evidence locks',
  {
    skip:
      !existsSync(resolve(v2, 'canonical/spells')) &&
      'The standalone website checkout has no V2 source registry',
  },
  () => {
    for (const record of manifest.records) {
      const owner = read(resolve(v2, record.ownerPath));
      assert.equal(owner.rules_identity.generation, '2024');
      assert.equal(owner.lifecycle, record.ownerLifecycle);
      assert.ok(['approved', 'review'].includes(owner.lifecycle));
      for (const evidence of record.claims) {
        const claim = read(
          resolve(v2, 'canonical/claims', `${evidence.id}.json`),
        );
        assert.equal(claim.owner.target_id, owner.id);
        assert.equal(claim.owner.pointer, evidence.pointer);
        assert.equal(claim.verification_status, 'verified_primary');
        assert.equal(claim.last_verified_at, evidence.verifiedAt);
        assert.equal(
          digest(pointer(owner, evidence.pointer)),
          evidence.ownerValueSha256,
        );
        assert.equal(claim.verified_owner_hash, evidence.ownerValueSha256);
        for (const source of evidence.evidence) {
          const revision = read(
            resolve(
              v2,
              'canonical/source_revisions',
              `${source.sourceRevisionId}.json`,
            ),
          );
          assert.equal(digest(revision), source.revisionSha256);
          assert.equal(
            claim.verified_evidence_hashes[source.sourceRevisionId],
            source.revisionSha256,
          );
        }
      }
      for (const field of record.fields) {
        const source = pointer(owner, field.sourcePointer);
        if (field.pointer === '/rules/duration') {
          const expected =
            source.kind === 'instantaneous'
              ? 'Instantaneous'
              : source.kind === 'until_start_of_next_turn'
                ? 'Until the start of your next turn'
                : `${source.kind === 'up_to' || owner.concentration ? 'Up to ' : ''}${source.value} ${source.unit}`;
          assert.equal(field.value, expected);
        } else if (field.pointer === '/rules/components/description') {
          assert.equal(
            source,
            'brennender Weihrauch im Wert von mindestens 10 GP',
          );
          assert.equal(owner.material_costs[0].value, 10);
          assert.equal(owner.material_costs[0].consumed, true);
        } else assert.deepEqual(field.value, source);
      }
    }
    const cachedPdf = readFileSync(
      resolve(v2, 'operations/reference_cache/SRD_CC_v5.2.1.pdf'),
    );
    assert.equal(
      createHash('sha256').update(cachedPdf).digest('hex'),
      manifest.source.cachedPdfSha256,
    );
  },
);
