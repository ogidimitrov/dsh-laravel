import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'yaml';

import {
  BUNDLED_SKILL_RANK,
  PROVIDER_NAME,
  apply,
  parseSkill,
  readCandidateList,
} from '../lib/provider.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const skillsDir = join(root, 'skills');

const stubContext = () => {
  const captured = [];
  return {
    captured,
    logger: { warn() {} },
    skills: { registerProvider: (factory) => captured.push(factory()) },
  };
};

test('every skill directory is discovered', async () => {
  const entries = await readdir(skillsDir, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const candidates = await readCandidateList(skillsDir);

  assert.equal(candidates.length, directories.length);
  assert.deepEqual(
    candidates.map((candidate) => candidate.name).sort(),
    directories.sort(),
  );
});

test('catalog entries are shaped for the registry', async () => {
  const candidates = await readCandidateList(skillsDir);
  assert.ok(candidates.length >= 28, `expected at least 28 skills, found ${candidates.length}`);

  for (const candidate of candidates) {
    assert.match(candidate.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, candidate.name);
    assert.ok(candidate.description.length > 0, candidate.name);
    assert.equal(candidate.rank, BUNDLED_SKILL_RANK);
    assert.equal(candidate.provider, PROVIDER_NAME);
    assert.equal(candidate.source, 'bundled');
    assert.equal(candidate.resourceBase.kind, 'directory');
    assert.ok(candidate.locator.endsWith('SKILL.md'), candidate.locator);
    assert.deepEqual(candidate.invocation, { modelInvocable: true, userInvocable: true });
  }

  const names = new Set(candidates.map((candidate) => candidate.name));
  assert.equal(names.size, candidates.length, 'skill names must be unique');
});

test('frontmatter contract is enforced', () => {
  assert.throws(() => parseSkill('no frontmatter here', 'x/SKILL.md'), /missing YAML frontmatter/);
  assert.throws(
    () => parseSkill('---\nname: ok-name\n---\n', 'x/SKILL.md'),
    /requires "description"/,
  );
  assert.throws(
    () => parseSkill('---\nname: Bad_Name\ndescription: d\n---\n', 'x/SKILL.md'),
    /invalid skill name/,
  );

  const parsed = parseSkill(
    '---\nname: alpha\ndescription: d\ndisable-model-invocation: true\nuser-invocable: false\n---\nBody\n',
    'alpha/SKILL.md',
  );
  assert.deepEqual(parsed.invocation, { modelInvocable: false, userInvocable: false });
  assert.equal(parsed.content, 'Body');
});

test('apply registers a provider that resolves every body', async () => {
  const ctx = stubContext();
  apply(ctx, { assetRoot: skillsDir });
  assert.equal(ctx.captured.length, 1);

  const provider = ctx.captured[0];
  assert.equal(provider.name, PROVIDER_NAME);

  const candidates = await provider.list();
  assert.equal(candidates.length, (await readdir(skillsDir, { withFileTypes: true })).filter((e) => e.isDirectory()).length);

  for (const candidate of candidates) {
    const skill = await provider.get(candidate, {});
    assert.ok(skill.content.length > 0, candidate.name);
    assert.equal(skill.rank, undefined, 'rank is registry metadata, not body payload');
    assert.equal(skill.locator, undefined, 'locator stays internal');
  }
});

test('the bundle patch mounts the provider subpath', async () => {
  const { readFile } = await import('node:fs/promises');
  const patch = parse(await readFile(join(root, 'cordis.patch.yml'), 'utf8'));
  const row = patch[0].insert[0];

  assert.equal(row.id, 'laravel-skills');
  assert.equal(row.name, 'dsh-laravel-skills/provider');
});
