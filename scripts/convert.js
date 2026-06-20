const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCES_FILE = path.join(ROOT, "sources.json");
const USER_AGENT = "Surge iOS/2980";

const SUPPORTED_RULE_RE =
  /^(AND|OR|NOT|DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD|DOMAIN-REGEX|IP-CIDR|IP-CIDR6|IP-ASN|GEOIP|GEOSITE|PROCESS-NAME),/i;

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
  }

  return response.text();
}

function normalizeRules(text) {
  const rules = [];
  const unsupported = [];

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();

    if (!line || line.startsWith("#") || line.startsWith("//")) {
      continue;
    }

    if (!SUPPORTED_RULE_RE.test(line)) {
      unsupported.push(line);
      continue;
    }

    line = line.replace(/^([A-Z0-9-]+),\s+/, "$1,");
    rules.push(line);
  }

  return { rules, unsupported };
}

function buildClashYaml(source, rules, unsupportedCount) {
  const updated = new Date().toISOString();
  const lines = [
    `# NAME: ${source.name}`,
    `# SOURCE: ${source.url}`,
    `# UPDATED: ${updated}`,
    "# FORMAT: Clash classical rule-provider",
    `# RULES: ${rules.length}`,
    `# UNSUPPORTED: ${unsupportedCount}`,
    "",
    "payload:"
  ];

  for (const rule of rules) {
    lines.push(`  - ${JSON.stringify(rule)}`);
  }

  return `${lines.join("\n")}\n`;
}

async function convertSource(source) {
  const text = await fetchText(source.url);
  const { rules, unsupported } = normalizeRules(text);

  if (rules.length === 0) {
    throw new Error(`No supported rules found for ${source.name}`);
  }

  const outputPath = path.join(ROOT, source.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buildClashYaml(source, rules, unsupported.length), "utf8");

  console.log(
    `${source.name}: wrote ${rules.length} rules to ${source.output}` +
      (unsupported.length ? `, skipped ${unsupported.length}` : "")
  );
}

async function main() {
  const sources = JSON.parse(fs.readFileSync(SOURCES_FILE, "utf8"));

  for (const source of sources) {
    await convertSource(source);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
