import { readFile, mkdir, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { triageHistory, redactText } from "./lib/history";
const [input, out, ...options] = process.argv.slice(2);
if (!input || !out)
  throw new Error(
    "Usage: npm run import:history -- conversations.json /private/output [--until=ISO_EXPORT_DATE] [--since=ISO_START] [--existing=/private/case-inventory.json]",
  );
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const destination = path.resolve(out);
const relative = path.relative(root, destination);
if (
  !relative.startsWith(`..${path.sep}`) &&
  relative !== ".." &&
  !path.isAbsolute(relative)
)
  throw new Error(
    "Private raw exports must be stored outside the source repository",
  );
const option = (name: string) =>
  options.find((s) => s.startsWith(`--${name}=`))?.slice(name.length + 3);
const existingPath = option("existing");
const existing = JSON.parse(
  await readFile(
    existingPath || new URL("../content/case-inventory.json", import.meta.url),
    "utf8",
  ),
);
if (!Array.isArray(existing))
  throw new Error("Existing case inventory must be an array");
const result = triageHistory(
  JSON.parse(await readFile(input, "utf8")),
  existing,
  option("until"),
  option("since"),
);
await mkdir(destination, { recursive: true, mode: 0o700 });
await chmod(destination, 0o700);
async function save(name: string, value: unknown) {
  const target = path.join(destination, name);
  await writeFile(target, JSON.stringify(value, null, 2), { mode: 0o600 });
  await chmod(target, 0o600);
}
const inventory = [];
for (const candidate of result.candidates) {
  const { messages, ...summary } = candidate;
  await save(`case-${candidate.key}.json`, {
    ...candidate,
    privacy:
      "PRIVATE RAW SOURCE: all branches retained; inspect outcomes and redact before publication",
  });
  const pointers = new Set<string>();
  function collect(value: unknown, key = "") {
    if (
      typeof value === "string" &&
      /asset_pointer|file_id|file_name|image_url/.test(key)
    )
      pointers.add(value);
    else if (Array.isArray(value)) value.forEach((v) => collect(v, key));
    else if (value && typeof value === "object")
      Object.entries(value).forEach(([k, v]) => collect(v, k));
  }
  collect(messages);
  inventory.push({
    ...summary,
    title: redactText(candidate.title),
    attachment_references: [...pointers],
    source_file: `case-${candidate.key}.json`,
    editorial_review:
      "Human evidence review required; keywords and matching never authorize publication",
  });
}
await save("inventory.json", inventory);
await save("coverage.json", {
  ...result,
  candidates: undefined,
  included: inventory.length,
  keyword_candidates: inventory.filter((c) => c.technical_keyword_match).length,
  unknown_dates_require_review: result.excluded.filter(
    (c) => c.reason === "unknown_date_review_required",
  ).length,
  exhaustive_audit_complete: false,
});
console.log(
  `Prepared ${inventory.length} private conversations from ${result.since} through ${result.until}. All in-range conversations are retained, even without keyword matches. No database writes or publication occurred.`,
);
