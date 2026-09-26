// Unit tests for the generator's pure functions: the version stamp, the
// upstream derivation, the agents list, and the validators. The end-to-end
// contract (regenerate, then git diff --exit-code) lives in CI.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertChangesHeading,
  deriveSkill,
  pluginAgentPaths,
  promptStub,
  publicSkills,
  slashCommands,
  stampAgentPaths,
  stampVersion,
  tableRows,
  validateCodexMarketplace,
  validateHooks,
} from "../tools/generate.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const lines = (text) => text.split("\n");

describe("tableRows", () => {
  test("spans the consecutive rows with the prefix after the separator", () => {
    const doc = lines("| command | use it when |\n| --- | --- |\n| `/a` | x |\n| `/b` | y |\n\ntext");
    expect(tableRows("| command | use it when |", "|")(doc)).toEqual([2, 4]);
    expect(tableRows("| Other |", "|")(doc)).toBeNull();
  });
});

describe("stampVersion", () => {
  test("rewrites the single version field and keeps formatting", () => {
    const text = '{\n  "name": "x",\n  "version":   "0.1.0",\n  "keywords": []\n}\n';
    expect(stampVersion(text, "0.2.0", "m.json")).toBe(
      '{\n  "name": "x",\n  "version":   "0.2.0",\n  "keywords": []\n}\n',
    );
  });

  test("refuses a manifest with zero or two version fields", () => {
    expect(() => stampVersion('{"name":"x"}', "1.0.0", "m.json")).toThrow('m.json: expected exactly 1 "version" field, found 0');
    expect(() => stampVersion('{"version":"1","dep":{"version":"2"}}', "1.0.0", "m.json")).toThrow("found 2");
  });
});

describe("assertChangesHeading", () => {
  test("requires the current version's heading and one shape for every release heading", () => {
    expect(() => assertChangesHeading("## 0.9.1 - title\n## 0.9.0 - older\n", "0.9.1")).not.toThrow();
    expect(() => assertChangesHeading("## 0.9.10 - title\n", "0.9.1")).toThrow('no "## 0.9.1 - <title>" heading');
    expect(() => assertChangesHeading("## 0.9.1 - title\n## 0.9.0 — em dash\n## 0.8.9\n", "0.9.1")).toThrow(
      'read "## <version> - <title>":\n## 0.9.0 — em dash\n## 0.8.9',
    );
  });
});

describe("validateCodexMarketplace", () => {
  const manifest = (plugins) => JSON.stringify({ plugins });
  test("needs one entry whose name matches and whose path exists", () => {
    const ok = { name: "pstack", source: { path: "./plugins/pstack" } };
    expect(() =>
      validateCodexMarketplace(manifest([ok]), { expectedName: "pstack", pathExists: () => true }),
    ).not.toThrow();
    expect(() => validateCodexMarketplace(manifest([]), { expectedName: "pstack", pathExists: () => true })).toThrow(
      "expected 1 plugin entry, found 0",
    );
    expect(() =>
      validateCodexMarketplace(manifest([{ ...ok, name: "other" }]), { expectedName: "pstack", pathExists: () => true }),
    ).toThrow('plugin name "other" != Codex manifest name "pstack"');
    expect(() => validateCodexMarketplace(manifest([ok]), { expectedName: "pstack", pathExists: () => false })).toThrow(
      "does not resolve to a directory",
    );
  });
});

describe("validateHooks", () => {
  const hooks = (command) =>
    JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command }] }] } });
  const exec = { mode: 0o755 };
  const plain = { mode: 0o644 };

  test("accepts an executable script under the plugin root", () => {
    const statOf = (rel) => (rel === "hooks/session-start" ? exec : null);
    expect(() => validateHooks(hooks('"${CLAUDE_PLUGIN_ROOT}/hooks/session-start"'), { statOf })).not.toThrow();
  });

  test("names a missing or non-executable target", () => {
    expect(() => validateHooks(hooks('"${CLAUDE_PLUGIN_ROOT}/hooks/nope"'), { statOf: () => null })).toThrow(
      "SessionStart: hooks/nope does not exist",
    );
    expect(() => validateHooks(hooks('"${CLAUDE_PLUGIN_ROOT}/hooks/session-start"'), { statOf: () => plain })).toThrow(
      "hooks/session-start is not executable",
    );
  });

  test("a file the command reads only has to exist", () => {
    const cmd = hooks('cat "${CLAUDE_PLUGIN_ROOT}/hooks/session-start-context.md"');
    expect(() => validateHooks(cmd, { statOf: () => plain })).not.toThrow();
    expect(() => validateHooks(cmd, { statOf: () => null })).toThrow(
      "SessionStart: hooks/session-start-context.md does not exist",
    );
  });

  test("rejects a command that does not go through the plugin root", () => {
    expect(() => validateHooks(hooks("cat /etc/motd"), { statOf: () => exec })).toThrow(
      "does not reference ${CLAUDE_PLUGIN_ROOT}",
    );
  });
});

describe("slashCommands", () => {
  const reference = (rows) => `# R\n\n| command | use it when |\n| --- | --- |\n${rows.join("\n")}\n\nafter\n`;

  test("reads name and menu text in row order", () => {
    const text = reference(["| `/b` | second thing |", "| `/a` | first thing |"]);
    expect(slashCommands(text, ["a", "b"])).toEqual([
      { name: "b", menu: "second thing" },
      { name: "a", menu: "first thing" },
    ]);
  });

  test("names a skill without a row and a row without a skill", () => {
    expect(() => slashCommands(reference(["| `/a` | x |", "| `/gone` | y |"]), ["a", "new"])).toThrow(
      "row without a skill: gone; skill without a row: new",
    );
  });

  test("rejects a malformed row and a missing table", () => {
    expect(() => slashCommands(reference(["| /a | x |"]), ["a"])).toThrow("row 1 is not");
    expect(() => slashCommands("# R\n\nno table\n", ["a"])).toThrow("table header not found");
  });

  test("rejects menu text that the prompt's YAML frontmatter would not read back, naming file and row", () => {
    expect(() => slashCommands(reference(["| `/a` | fine |", "| `/b` | fix CI: then ship |"]), ["a", "b"])).toThrow(
      "docs/reference.md: slash-command row 2 text is not a plain YAML value",
    );
    const samples = [
      "fix CI: then ship",
      "run it # carefully",
      "ends with colon:",
      "`/x` first",
      "*star",
      "[a] b",
      "- item",
      "a:b ratio, issue#12, [x] {y}",
      "-mode skill",
      "monitor an open PR, fix CI/comments, keep it merge-ready",
    ];
    for (const menu of samples) {
      let parsed;
      try {
        parsed = Bun.YAML.parse(promptStub({ name: "b", menu }).split("---\n")[1]).description;
      } catch {}
      let accepted = true;
      try {
        slashCommands(reference([`| \`/b\` | ${menu} |`]), ["b"]);
      } catch {
        accepted = false;
      }
      expect({ menu, accepted }).toEqual({ menu, accepted: parsed === menu });
    }
  });

  test("the live reference names exactly the public skills and matches the generated prompts", () => {
    const text = readFileSync(join(repoRoot, "docs/reference.md"), "utf8");
    const rows = slashCommands(text, publicSkills(join(repoRoot, "plugins/pstack/skills")));
    expect(rows[0].name).toBe("poteto-mode");
    for (const row of rows) {
      const prompt = readFileSync(join(repoRoot, "plugins/pstack/.codex-plugin/prompts", `${row.name}.md`), "utf8");
      expect(prompt).toBe(promptStub(row));
    }
  });
});

describe("deriveSkill", () => {
  const front = (flags) => `---\nname: x\ndescription: d\n${flags}---\n\nbody\n`;

  test("drops disable-model-invocation on a public skill and swaps it on a principle leaf", () => {
    expect(deriveSkill("plugins/pstack/skills/tdd/SKILL.md", front("disable-model-invocation: true\n"))).toBe(front(""));
    expect(deriveSkill("plugins/pstack/skills/principle-x/SKILL.md", front("disable-model-invocation: true\n"))).toBe(
      front("user-invocable: false\n"),
    );
  });

  test("leaves a prose mention of the flag alone", () => {
    const text = front("") + "Never write `disable-model-invocation: true` on a skill.\n";
    expect(deriveSkill("plugins/pstack/skills/automate-me/SKILL.md", text)).toBe(text);
  });

  test("appends no section to a skill", () => {
    const out = deriveSkill("plugins/pstack/skills/how/SKILL.md", front("disable-model-invocation: true\n"));
    expect(out).toBe(front(""));
  });

  test("a file that is not a SKILL.md passes through", () => {
    const text = "---\ndisable-model-invocation: true\n---\n\nreference text\n";
    expect(deriveSkill("plugins/pstack/skills/how/references/x.md", text)).toBe(text);
  });
});

describe("plugin agents", () => {
  const pluginRoot = join(repoRoot, "plugins/pstack");

  test("plugin.json lists exactly the agent files", () => {
    const listed = JSON.parse(readFileSync(join(pluginRoot, ".claude-plugin/plugin.json"), "utf8")).agents;
    expect(listed).toEqual(pluginAgentPaths(pluginRoot));
    expect(listed).toEqual(["./agents/comment-sicko.md", "./agents/poteto-agent.md"]);
  });

  test("stamping the agents list keeps every other manifest field", () => {
    const text = '{\n  "name": "pstack",\n  "version": "1.0.0"\n}\n';
    const out = stampAgentPaths(text, ["./agents/a.md"]);
    expect(JSON.parse(out)).toEqual({ name: "pstack", version: "1.0.0", agents: ["./agents/a.md"] });
    expect(stampAgentPaths(out, ["./agents/a.md"])).toBe(out);
  });
});
