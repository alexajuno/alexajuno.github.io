import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { load, dump } from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "src", "content", "reading", "links.yaml");

const [rawUrl, ...summaryParts] = process.argv.slice(2);
const note = summaryParts.join(" ").trim() || undefined;

if (!rawUrl) {
  console.error("Usage: reading add <url> [summary...]");
  process.exit(1);
}

function normalizeUrl(input) {
  try {
    return new URL(input).toString();
  } catch {
    return new URL(`https://${input}`).toString();
  }
}

const url = normalizeUrl(rawUrl);

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  mdash: "—", ndash: "–", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};

function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name.toLowerCase()] ?? m);
}

async function fetchTitle(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(6000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; reading-list-bot/1.0)" },
    });
    const html = await res.text();
    const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match ? decodeEntities(match[1].trim()) : null;
  } catch {
    return null;
  }
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

let title = await fetchTitle(url);
let usedFallbackTitle = false;
if (!title) {
  usedFallbackTitle = true;
  title = new URL(url).hostname.replace(/^www\./, "");
}

let entries = [];
try {
  entries = load(readFileSync(DATA_FILE, "utf-8")) ?? [];
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

// js-yaml parses bare dates as Date objects; flatten back to plain
// YYYY-MM-DD strings so re-dumping doesn't expand them into full
// ISO timestamps and drift existing entries' formatting.
entries = entries.map((e) =>
  e.date instanceof Date ? { ...e, date: e.date.toISOString().slice(0, 10) } : e
);

const baseId = slugify(title) || slugify(new URL(url).hostname);
let id = baseId;
let n = 2;
while (entries.some((e) => e.id === id)) {
  id = `${baseId}-${n++}`;
}

const today = new Date().toISOString().slice(0, 10);

const entry = { id, title, url, ...(note ? { note } : {}), date: today };
entries.unshift(entry);

writeFileSync(DATA_FILE, dump(entries, { sortKeys: false, lineWidth: -1 }));

console.log(`Added "${title}" (${id})`);
if (usedFallbackTitle) {
  console.log(`Couldn't fetch a page title — used the hostname instead. Edit the title in ${path.relative(process.cwd(), DATA_FILE)} if you want something better.`);
}
