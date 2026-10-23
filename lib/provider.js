/**
 * Skill provider for the bundled Laravel packs.
 *
 * DeepSeek Harness discovers skills through providers registered on
 * `ctx.skills`. This one reads `<assetRoot>/<name>/SKILL.md` at startup, exposes
 * the parsed frontmatter as catalog entries, and returns the body on demand so
 * a 28-skill pack costs one line of catalog per skill instead of its full text.
 *
 * The contract mirrors the first-party `@deepseek-ai/dsh-skill-office` provider:
 * `list()` returns summaries, `get()` resolves one body, and both stay cheap.
 */

import { readFile, readdir } from 'node:fs/promises';
import { isAbsolute, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

/** Cordis plugin identity. */
export const name = 'laravel-skills';

/** Registry this plugin contributes to. */
export const inject = ['skills'];

/** Provider name surfaced in catalog diagnostics. */
export const PROVIDER_NAME = 'dsh-laravel-skills';

/**
 * Bundled skills sit above project (100-200) and user (400-500) roots but below
 * nothing else, matching the rank the harness assigns to shipped packs.
 */
export const BUNDLED_SKILL_RANK = 600;

const DEFAULT_ASSET_ROOT = fileURLToPath(new URL('../skills/', import.meta.url));
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/** Accept the same truthy spellings the harness accepts for invocation flags. */
function asBoolean(value, field, path) {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 1 || value === '1') return true;
  if (value === 0 || value === '0') return false;
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['true', 'yes', 'on'].includes(lowered)) return true;
    if (['false', 'no', 'off'].includes(lowered)) return false;
  }
  throw new Error(`${path}: frontmatter field "${field}" must be a boolean`);
}

/**
 * Parse one skill file into a catalog-ready summary plus its body.
 * @param {string} raw - File contents.
 * @param {string} path - Path used in diagnostics.
 */
export function parseSkill(raw, path) {
  const match = FRONTMATTER.exec(raw);
  if (!match) throw new Error(`${path}: missing YAML frontmatter`);

  let data;
  try {
    data = parse(match[1]);
  } catch (error) {
    throw new Error(`${path}: invalid YAML frontmatter: ${error.message}`);
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${path}: frontmatter must be a mapping`);
  }

  const skillName = typeof data.name === 'string' ? data.name.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  if (!skillName) throw new Error(`${path}: frontmatter requires "name"`);
  if (!description) throw new Error(`${path}: frontmatter requires "description"`);
  if (!SKILL_NAME.test(skillName)) throw new Error(`${path}: invalid skill name "${skillName}"`);

  const disableModelInvocation = asBoolean(data['disable-model-invocation'], 'disable-model-invocation', path);
  const userInvocable = asBoolean(data['user-invocable'], 'user-invocable', path);

  return {
    name: skillName,
    description,
    invocation: {
      modelInvocable: disableModelInvocation !== true,
      userInvocable: userInvocable !== false,
    },
    content: raw.slice(match[0].length).trim(),
  };
}

/**
 * Read every `<dir>/SKILL.md` under `assetRoot` into catalog candidates.
 * Unreadable or invalid entries are skipped rather than failing the bundle.
 * @param {string} assetRoot - Absolute skills directory.
 * @param {{ warn?: (message: string) => void }} [log]
 */
export async function readCandidateList(assetRoot, log) {
  const entries = await readdir(assetRoot, { withFileTypes: true });
  const candidates = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;

    const directory = join(assetRoot, entry.name);
    const locator = join(directory, 'SKILL.md');

    let raw;
    try {
      raw = await readFile(locator, 'utf8');
    } catch {
      continue; // no SKILL.md in this directory: not a skill
    }

    let parsed;
    try {
      parsed = parseSkill(raw, locator);
    } catch (error) {
      log?.warn?.(`laravel-skills: ${error.message}`);
      continue;
    }
    if (parsed.name !== entry.name) {
      log?.warn?.(`laravel-skills: ${locator}: name "${parsed.name}" does not match directory "${entry.name}"`);
      continue;
    }

    candidates.push({
      name: parsed.name,
      description: parsed.description,
      invocation: parsed.invocation,
      provider: PROVIDER_NAME,
      source: 'bundled',
      rank: BUNDLED_SKILL_RANK,
      resourceBase: { kind: 'directory', path: directory.split(sep).join('/') },
      locator,
    });
  }

  return candidates;
}

/**
 * Mount the provider.
 * @param {any} ctx - Cordis context carrying the skill registry.
 * @param {{ assetRoot?: string }} [config]
 */
export function apply(ctx, config = {}) {
  const assetRoot = config.assetRoot ?? DEFAULT_ASSET_ROOT;
  if (!isAbsolute(assetRoot)) {
    throw new Error(`laravel-skills: assetRoot must be an absolute directory, got "${assetRoot}"`);
  }

  let cached;
  const provider = {
    name: PROVIDER_NAME,
    list() {
      cached ??= readCandidateList(assetRoot, ctx.logger);
      return cached;
    },
    async get(candidate, options) {
      const { rank: _rank, locator, ...summary } = candidate;
      const raw = await readFile(locator, { encoding: 'utf8', signal: options?.signal });
      return { ...summary, content: parseSkill(raw, locator).content };
    },
  };

  ctx.skills.registerProvider(() => provider);
}
