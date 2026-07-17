#!/usr/bin/env node
// Structural linter for this marketplace.
//
// Covers what `claude plugin validate` does not. Verified against Claude Code
// v2.1.212: the official validator passes clean (even with --strict) on a
// catalog with a reserved marketplace name, non-kebab-case names, and a
// `source` pointing at a directory that does not exist. It also stops at the
// first class of errors, so a green run does not mean everything was checked.
//
// Usage:  node scripts/validate-marketplace.mjs [--base <git-ref>]
// Exits non-zero on any error.

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const MANIFEST = join(ROOT, '.claude-plugin', 'marketplace.json');
const PLUGINS_DIR = join(ROOT, 'plugins');

const errors = [];
const err = (msg) => errors.push(msg);

// Reserved by Anthropic. Claude Code re-checks these on every load, not only on
// add, so a name that becomes reserved later breaks the catalog for everyone.
// Source: https://code.claude.com/docs/en/plugin-marketplaces
const RESERVED_NAMES = new Set([
  'claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official',
  'claude-plugins-community', 'claude-community', 'anthropic-marketplace',
  'anthropic-plugins', 'agent-skills', 'anthropic-agent-skills',
  'knowledge-work-plugins', 'life-sciences', 'claude-for-legal',
  'claude-for-financial-services', 'financial-services-plugins',
  'first-party-plugins', 'healthcare',
]);
const IMPERSONATING = /^(official-|anthropic-|claude-).*(plugins|marketplace)|(plugins|marketplace).*(-official|-anthropic)/;

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z-.]+)?(\+[0-9A-Za-z-.]+)?$/;

const SECRET_PATTERNS = [
  [/\/Users\//, 'absolute macOS home path (/Users/)'],
  [/\/home\/[a-z]/i, 'absolute Linux home path (/home/)'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key id (AKIA…)'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key block'],
  [/-----BEGIN /, 'PEM block (-----BEGIN)'],
  [/\btoken\s*=\s*['"]?[A-Za-z0-9_\-]{16,}/, 'hardcoded token='],
  [/\b(sk|ghp|gho|ghs|github_pat)_[A-Za-z0-9_]{20,}/, 'provider secret token'],
];

const SCANNABLE = /\.(md|json|mjs|js|ts|sh|bash|zsh|ya?ml|toml|txt)$/;
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(`${label}: cannot parse JSON — ${e.message}`);
    return null;
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.claude-plugin') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------- 1. manifest

if (!existsSync(MANIFEST)) {
  err('.claude-plugin/marketplace.json: file not found');
  report();
}

const mp = readJson(MANIFEST, 'marketplace.json');
if (!mp) report();

if (typeof mp.name !== 'string' || !mp.name) err('marketplace.json: `name` is required and must be a string');
if (!mp.owner || typeof mp.owner.name !== 'string' || !mp.owner.name) {
  err('marketplace.json: `owner.name` is required and must be a string');
}
if (!Array.isArray(mp.plugins)) err('marketplace.json: `plugins` must be an array');

// ------------------------------------------------- 2. marketplace name policy

if (typeof mp.name === 'string') {
  if (!KEBAB.test(mp.name)) {
    err(`marketplace.json: \`name\` "${mp.name}" is not kebab-case. Claude Code tolerates it, but the claude.ai marketplace sync rejects it`);
  }
  if (RESERVED_NAMES.has(mp.name)) {
    err(`marketplace.json: \`name\` "${mp.name}" is reserved for Anthropic and will stop loading with an "untrusted source" error`);
  } else if (IMPERSONATING.test(mp.name)) {
    err(`marketplace.json: \`name\` "${mp.name}" looks like it impersonates an official Anthropic marketplace and is blocked`);
  }
}

// ------------------------------------------------------------ 3. plugin entries

const entries = Array.isArray(mp.plugins) ? mp.plugins : [];

for (const [i, entry] of entries.entries()) {
  const at = `plugins[${i}]`;
  const name = entry?.name;

  if (typeof name !== 'string' || !name) {
    err(`${at}.name: required and must be a string`);
    continue;
  }
  if (!KEBAB.test(name)) err(`${at}.name: "${name}" is not kebab-case`);

  if (typeof entry.description !== 'string' || !entry.description.trim()) {
    err(`${at} ("${name}"): \`description\` is required in the catalog entry`);
  }
  if (typeof entry.category !== 'string' || !entry.category.trim()) {
    err(`${at} ("${name}"): \`category\` is required in the catalog entry`);
  }
  if ('repository' in entry && typeof entry.repository !== 'string') {
    err(`${at} ("${name}"): \`repository\` must be a string`);
  }

  const source = entry.source;
  if (source === undefined) {
    err(`${at} ("${name}"): \`source\` is required`);
    continue;
  }

  // External sources must be pinned to an exact commit. Tags move; commits don't.
  if (typeof source === 'object' && source !== null) {
    const kind = source.source;
    if (['github', 'url', 'git-subdir'].includes(kind)) {
      if (typeof source.sha !== 'string' || !/^[0-9a-f]{40}$/.test(source.sha)) {
        err(`${at} ("${name}"): external \`source\` must be pinned with a full 40-char \`sha\` — tags and branches move`);
      }
    }
    continue; // remaining checks are for local plugins only
  }

  if (typeof source !== 'string') {
    err(`${at} ("${name}"): \`source\` must be a string path or an object`);
    continue;
  }
  if (!source.startsWith('./')) {
    err(`${at} ("${name}"): local \`source\` "${source}" must start with "./"`);
    continue;
  }
  if (source.split('/').includes('..')) {
    err(`${at} ("${name}"): \`source\` "${source}" must not contain ".."`);
    continue;
  }

  // The official validator does NOT catch a source pointing at nothing.
  const dir = join(ROOT, source);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    err(`${at} ("${name}"): \`source\` "${source}" does not exist — the catalog is broken and only breaks at install time`);
    continue;
  }

  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) {
    err(`${at} ("${name}"): missing ${relative(ROOT, manifestPath)}`);
    continue;
  }

  const pj = readJson(manifestPath, `${at} plugin.json`);
  if (!pj) continue;

  if (pj.name !== name) {
    err(`${at} ("${name}"): plugin.json \`name\` is "${pj.name}" but the catalog entry says "${name}". Claude Code silently prefers the catalog entry — keep them identical`);
  }
  if (typeof pj.version !== 'string' || !SEMVER.test(pj.version)) {
    err(`${at} ("${name}"): plugin.json \`version\` must be a semver string (e.g. "1.0.0"), got ${JSON.stringify(pj.version)}`);
  }
  if (typeof pj.description !== 'string' || !pj.description.trim()) {
    err(`${at} ("${name}"): plugin.json \`description\` is required`);
  }
  // plugin.json always wins over the catalog entry, without a warning.
  if ('version' in entry) {
    err(`${at} ("${name}"): do not set \`version\` in the catalog entry — plugin.json wins silently and masks it. Keep the version in plugin.json only`);
  }
}

// ------------------------------------------------------------- 4. CODEOWNERS

const codeownersPath = ['CODEOWNERS', '.github/CODEOWNERS', 'docs/CODEOWNERS']
  .map((p) => join(ROOT, p))
  .find(existsSync);

if (!codeownersPath) {
  err('CODEOWNERS: file not found');
} else {
  const lines = readFileSync(codeownersPath, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  const hasCatchAll = lines.some((l) => l.split(/\s+/)[0] === '*');
  if (!hasCatchAll) {
    for (const entry of entries) {
      if (typeof entry?.source !== 'string' || !entry.name) continue;
      const target = `/plugins/${entry.name}/`;
      const covered = lines.some((l) => {
        const pattern = l.split(/\s+/)[0];
        return pattern === target || pattern === target.slice(0, -1) || pattern === `plugins/${entry.name}/`;
      });
      if (!covered) err(`CODEOWNERS: no owner for plugins/${entry.name}/ (and no catch-all "*" rule)`);
    }
  }
}

// --------------------------------------------------- 5. secrets / abs paths

if (existsSync(PLUGINS_DIR)) {
  for (const file of walk(PLUGINS_DIR)) {
    if (!SCANNABLE.test(file)) continue;
    const rel = relative(ROOT, file);
    const lines = readFileSync(file, 'utf8').split('\n');
    for (const [n, line] of lines.entries()) {
      for (const [pattern, label] of SECRET_PATTERNS) {
        if (pattern.test(line)) {
          err(`${rel}:${n + 1}: ${label} — plugins are copied to a cache dir, absolute paths break and secrets leak to every installer`);
          break;
        }
      }
    }
  }
}

// ------------------------------------------------------------ 6. version bump

const baseIdx = process.argv.indexOf('--base');
const baseRef = baseIdx !== -1 ? process.argv[baseIdx + 1] : process.env.GITHUB_BASE_REF;

if (baseRef) {
  const git = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
  let base;
  try {
    base = git(['merge-base', 'HEAD', `origin/${baseRef}`]);
  } catch {
    try {
      base = git(['merge-base', 'HEAD', baseRef]);
    } catch {
      base = null;
      console.warn(`⚠ version-bump check skipped: cannot resolve base ref "${baseRef}"`);
    }
  }

  if (base) {
    let changed = [];
    try {
      changed = git(['diff', '--name-only', base, 'HEAD']).split('\n').filter(Boolean);
    } catch (e) {
      console.warn(`⚠ version-bump check skipped: ${e.message}`);
    }

    const touched = new Set();
    for (const f of changed) {
      const m = f.match(/^plugins\/([^/]+)\//);
      if (m) touched.add(m[1]);
    }

    for (const dirName of touched) {
      const manifestRel = `plugins/${dirName}/.claude-plugin/plugin.json`;
      if (!existsSync(join(ROOT, manifestRel))) continue; // deleted plugin
      const current = readJson(join(ROOT, manifestRel), manifestRel)?.version;

      let baseVersion = null;
      try {
        baseVersion = JSON.parse(git(['show', `${base}:${manifestRel}`])).version;
      } catch {
        continue; // new plugin — nothing to bump against
      }

      if (current && baseVersion && current === baseVersion) {
        err(`${manifestRel}: files under plugins/${dirName}/ changed but \`version\` is still "${current}". Bump it, or users silently never get the update`);
      }
    }
  }
}

// ------------------------------------------------------------------- report

function report() {
  if (errors.length) {
    console.error(`\n✘ ${errors.length} error${errors.length === 1 ? '' : 's'}:\n`);
    for (const e of errors) console.error(`  ❯ ${e}`);
    console.error('');
    process.exit(1);
  }
  console.log(`✔ marketplace structure OK (${entries.length} plugin${entries.length === 1 ? '' : 's'})`);
  process.exit(0);
}

report();
