#!/usr/bin/env node
// Builds the static JSON the marketplace UI (site/) reads at runtime.
//
// Reads the same two file shapes scripts/validate-marketplace.mjs already
// parses (.claude-plugin/marketplace.json + each plugin's plugin.json),
// plus each plugin's skills/agents/commands/hooks/mcp docs and CHANGELOG.md,
// and emits site/public/data/{search-index,plugins,changelog-feed,meta}.json.
//
// Must succeed with zero plugins (emits valid empty output) — this repo
// starts with an empty plugins/ directory and the site has to build anyway.
//
// Usage: node scripts/build-site-data.mjs [--source <dir>] [--out <dir>]

import { readFileSync, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();

function argValue(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : fallback;
}

const SOURCE = join(ROOT, argValue('--source', '.'));
const OUT = join(ROOT, argValue('--out', 'site/public/data'));

const MANIFEST = join(SOURCE, '.claude-plugin', 'marketplace.json');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.warn(`⚠ cannot parse JSON at ${relative(ROOT, path)}: ${e.message}`);
    return null;
  }
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : null;
}

// ------------------------------------------------------ frontmatter parsing
//
// Skills/agents/commands are "plain Markdown + YAML frontmatter" per
// docs/PLUGIN-GUIDELINES.md. We only need a handful of scalar/array/simple
// fields, so a hand-rolled parser avoids adding a YAML dependency to a
// zero-dependency build script.

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { meta: {}, body: raw.trim() };

  const [, fmText, body] = match;
  const meta = {};
  for (const line of fmText.split('\n')) {
    const m = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, rawValue] = m;
    const value = rawValue.trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      meta[key] = inner
        ? inner.split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : [];
    } else {
      meta[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }
  return { meta, body: body.trim() };
}

function firstLine(text, fallback) {
  const line = (text || '').split('\n').find((l) => l.trim());
  return line ? line.trim().replace(/^#+\s*/, '') : fallback;
}

// --------------------------------------------------------- changelog parsing

function parseChangelog(text) {
  if (!text) return [];
  const entries = [];
  const re = /^##\s+([0-9][^\s—-]*)\s*(?:[—-]\s*(\d{4}-\d{2}-\d{2}))?\s*$/gm;
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const [full, version, date] = matches[i];
    const start = matches[i].index + full.length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    const summary = body
      .split('\n')
      .map((l) => l.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
      .join(' ');
    entries.push({ version, date: date || null, summary: summary || '(no summary)' });
  }
  return entries;
}

// -------------------------------------------------------------- git remote

function detectRepoUrl() {
  try {
    const url = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (!url) return null;
    if (url.startsWith('git@github.com:')) {
      return 'https://github.com/' + url.slice('git@github.com:'.length).replace(/\.git$/, '');
    }
    return url.replace(/\.git$/, '');
  } catch {
    return null;
  }
}

// ----------------------------------------------------------- artifact scans

function listDirs(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
}

function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(ext))
    .map((e) => e.name);
}

function collectSkills(pluginDir) {
  const dir = join(pluginDir, 'skills');
  return listDirs(dir).map((name) => {
    const raw = readText(join(dir, name, 'SKILL.md')) || '';
    const { meta, body } = parseFrontmatter(raw);
    return {
      kind: 'skill',
      name,
      displayName: meta.displayName || titleCase(name),
      description: meta.description || firstLine(body, `Skill ${name}`),
      invocation: meta.invocation || `/${name}`,
      tools: Array.isArray(meta.tools) ? meta.tools : [],
      content: body,
    };
  });
}

function collectFlatMd(pluginDir, subdir, kind, invocationPrefix) {
  const dir = join(pluginDir, subdir);
  return listFiles(dir, '.md').map((file) => {
    const name = basename(file, '.md');
    const raw = readText(join(dir, file)) || '';
    const { meta, body } = parseFrontmatter(raw);
    return {
      kind,
      name,
      displayName: meta.displayName || titleCase(name),
      description: meta.description || firstLine(body, `${kind} ${name}`),
      invocation: meta.invocation || (invocationPrefix ? invocationPrefix + name : ''),
      tools: Array.isArray(meta.tools) ? meta.tools : [],
      content: body,
    };
  });
}

function collectHooks(pluginDir) {
  const config = readJson(join(pluginDir, 'hooks', 'hooks.json'));
  if (!config || typeof config.hooks !== 'object') return [];
  const out = [];
  for (const [event, list] of Object.entries(config.hooks)) {
    if (!Array.isArray(list)) continue;
    for (const hook of list) {
      const name = hook.name || `${event}-${hook.matcher || 'hook'}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      out.push({
        kind: 'hook',
        name,
        displayName: titleCase(name),
        description: hook.description || `Hook triggered on ${event}${hook.matcher ? ` (matcher: ${hook.matcher})` : ''}`,
        invocation: '',
        tools: [],
        content: `Event: ${event}${hook.matcher ? `\nMatcher: ${hook.matcher}` : ''}`,
      });
    }
  }
  return out;
}

function collectMcp(pluginDir) {
  // Convention for this repo (not part of Claude Code's core mcpServers
  // runtime config): an optional mcp/<server-name>.md doc per server, same
  // frontmatter shape as skills/agents, purely for indexing/documentation.
  const dir = join(pluginDir, 'mcp');
  return listFiles(dir, '.md').map((file) => {
    const name = basename(file, '.md');
    const raw = readText(join(dir, file)) || '';
    const { meta, body } = parseFrontmatter(raw);
    return {
      kind: 'mcp',
      name,
      displayName: meta.displayName || titleCase(name),
      description: meta.description || firstLine(body, `MCP server ${name}`),
      invocation: '',
      tools: Array.isArray(meta.tools) ? meta.tools : [],
      content: body,
    };
  });
}

function titleCase(slug) {
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// External sources (github/url/git-subdir/npm) have no local directory to
// scan — vendored third-party skills (see docs/PLUGIN-GUIDELINES.md
// "Third-party skills") are referenced, not copied into plugins/. They
// still need a plugin card in the catalog, built from the entry's own
// fields only (no artifacts, no changelog — there's nothing local to read).
function describeExternalSource(source) {
  if (!source || typeof source !== 'object') return null;
  switch (source.source) {
    case 'github':
      return `github:${source.repo}`;
    case 'git-subdir':
      return `${source.url}#${source.path}`;
    case 'url':
      return source.url;
    case 'npm':
      return `npm:${source.package}`;
    default:
      return source.url || null;
  }
}

// ------------------------------------------------------------------- build

function build() {
  const mp = readJson(MANIFEST);
  const marketplaceName = mp?.name || 'seasoned-ai-marketplace';
  const catalogEntries = Array.isArray(mp?.plugins) ? mp.plugins : [];
  const repoUrl = detectRepoUrl();

  const entries = [];
  const plugins = {};
  const changelog = [];

  for (const entry of catalogEntries) {
    if (!entry?.name) continue;

    if (entry.source && typeof entry.source === 'object') {
      const name = entry.name;
      const displayName = entry.displayName || titleCase(name);
      const author = entry.author || { name: 'Unknown' };
      const sourceLabel = describeExternalSource(entry.source);

      entries.push({
        id: `plugin:${name}`,
        kind: 'plugin',
        pluginName: name,
        name,
        displayName,
        description: entry.description || '',
        category: entry.category || null,
        keywords: entry.keywords || [],
        tags: entry.tags || [],
        author: { name: author.name || 'Unknown', email: author.email || null, url: author.url || null },
        version: null,
        updated: null,
        compatibility: null,
        license: entry.license || null,
        homepage: entry.homepage || null,
        repository: entry.repository || null,
        source: sourceLabel,
        invocation: '',
        tools: [],
        content: entry.description || '',
        route: `/plugin/${name}`,
      });

      plugins[name] = {
        name,
        displayName,
        description: entry.description || '',
        version: null,
        compatibility: null,
        author: { name: author.name || 'Unknown', email: author.email || null, url: author.url || null },
        updated: null,
        license: entry.license || null,
        homepage: entry.homepage || null,
        repository: entry.repository || null,
        githubUrl: entry.homepage || (typeof entry.source.url === 'string' ? entry.source.url : null),
        installText: `/plugin install ${name}@${marketplaceName}`,
        readme: '',
        dependencies: [],
        artifactsByKind: {},
        changelog: [],
      };
      continue;
    }

    if (typeof entry.source !== 'string') continue;
    const pluginDir = join(SOURCE, entry.source);
    if (!existsSync(pluginDir)) {
      console.warn(`⚠ ${entry.name}: source "${entry.source}" not found, skipping`);
      continue;
    }

    const pj = readJson(join(pluginDir, '.claude-plugin', 'plugin.json')) || {};
    const name = pj.name || entry.name;
    const displayName = pj.displayName || entry.displayName || titleCase(name);
    const author = pj.author || { name: 'Unknown' };
    const keywords = pj.keywords || entry.keywords || [];
    const changelogText = readText(join(pluginDir, 'CHANGELOG.md'));
    const changes = parseChangelog(changelogText);
    const updated = changes[0]?.date || null;
    const readme = readText(join(pluginDir, 'README.md')) || '';

    const artifacts = [
      ...collectSkills(pluginDir),
      ...collectFlatMd(pluginDir, 'agents', 'agent', '@'),
      ...collectFlatMd(pluginDir, 'commands', 'command', '/'),
      ...collectHooks(pluginDir),
      ...collectMcp(pluginDir),
    ];

    const pluginRoute = `/plugin/${name}`;
    entries.push({
      id: `plugin:${name}`,
      kind: 'plugin',
      pluginName: name,
      name,
      displayName,
      description: entry.description || pj.description || '',
      category: entry.category || null,
      keywords,
      tags: entry.tags || [],
      author: { name: author.name || 'Unknown', email: author.email || null, url: author.url || null },
      version: pj.version || null,
      updated,
      compatibility: pj.compatibility || null,
      license: pj.license || null,
      homepage: pj.homepage || null,
      repository: pj.repository || null,
      source: entry.source,
      invocation: '',
      tools: [],
      content: readme || entry.description || pj.description || '',
      route: pluginRoute,
    });

    const artifactsByKind = {};
    for (const art of artifacts) {
      const route = `/artifact/${art.kind}/${name}/${art.name}`;
      entries.push({
        id: `${art.kind}:${name}/${art.name}`,
        kind: art.kind,
        pluginName: name,
        name: art.name,
        displayName: art.displayName,
        description: art.description,
        category: entry.category || null,
        keywords,
        tags: entry.tags || [],
        author: { name: author.name || 'Unknown', email: author.email || null, url: author.url || null },
        version: pj.version || null,
        updated,
        compatibility: null,
        license: pj.license || null,
        homepage: pj.homepage || null,
        repository: pj.repository || null,
        source: entry.source,
        invocation: art.invocation,
        tools: art.tools,
        content: art.content,
        route,
      });
      (artifactsByKind[art.kind] ||= []).push({
        kind: art.kind,
        name: art.name,
        displayName: art.displayName,
        description: art.description,
        invocation: art.invocation,
      });
    }

    plugins[name] = {
      name,
      displayName,
      description: entry.description || pj.description || '',
      version: pj.version || null,
      compatibility: pj.compatibility || null,
      author: { name: author.name || 'Unknown', email: author.email || null, url: author.url || null },
      updated,
      license: pj.license || null,
      homepage: pj.homepage || null,
      repository: pj.repository || null,
      githubUrl: repoUrl ? `${repoUrl}/tree/main/plugins/${name}` : null,
      installText: `/plugin install ${name}@${marketplaceName}`,
      readme,
      dependencies: Array.isArray(pj.dependencies)
        ? pj.dependencies.map((d) => (typeof d === 'string' ? d : d.name)).filter(Boolean)
        : [],
      artifactsByKind,
      changelog: changes.map((c) => ({ pluginName: name, displayName, version: c.version, date: c.date, summary: c.summary })),
    };

    for (const c of changes) {
      changelog.push({ pluginName: name, displayName, version: c.version, date: c.date, summary: c.summary });
    }
  }

  changelog.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(entries, null, 2));
  writeFileSync(join(OUT, 'plugins.json'), JSON.stringify(plugins, null, 2));
  writeFileSync(join(OUT, 'changelog-feed.json'), JSON.stringify(changelog, null, 2));
  writeFileSync(join(OUT, 'meta.json'), JSON.stringify({ marketplaceName, repoUrl }, null, 2));

  console.log(
    `✔ site data built: ${catalogEntries.length} plugin(s), ${entries.length} indexed artifact(s) → ${relative(ROOT, OUT)}`,
  );
}

build();
