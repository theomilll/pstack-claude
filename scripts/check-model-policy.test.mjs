import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const scanner = fileURLToPath(new URL("./check-model-policy.mjs", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "pstack-model-policy-"));
after(() => rmSync(dir, { recursive: true, force: true }));

function scan(text, path = "plugins/pstack/skills/example/SKILL.md") {
	const root = mkdtempSync(join(dir, "case-"));
	const file = join(root, path);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, text);
	const result = spawnSync(process.execPath, [scanner, root], { encoding: "utf8" });
	assert.ifError(result.error);
	return { status: result.status, output: result.stdout + result.stderr };
}

test("scanner rejects model pinning, task routing and effort overrides", () => {
	for (const text of [
		'Use gpt-5.6-sol for every task.',
		'Use gpt-5.6-sol with no file edits.',
		'Spawn with model: "fast" without changing files.',
		'Do not require gpt-5.6-sol.',
		'Spawn a reviewer with model: "custom-model".',
		'codex --model custom-model',
		'Assign reasoning_effort: "high".',
		'model: custom-model',
		'reasoning_effort: high',
		'Write pstack-models.md before starting.',
		'| Subagent | Default model |',
		'Spawn multiple models to review independently.',
		'Use Sonnet for searching and Opus for reviews.',
		'Choose Gemini for review tasks.',
		'Use Composer for implementation.',
		'Use a fast, cheap model for recall.',
		'The lead may raise the reasoning effort.',
		'Check model availability before work.',
		'If the model is unavailable, stop.',
		'Do not skip review; set reasoning effort to high.',
	]) {
		const result = scan(text);
		assert.equal(result.status, 1, `Accepted runtime policy ${text}\n${result.output}`);
	}
});

test("scanner permits inherited settings, domain models and negative policy explanations", () => {
	const result = scan(`Use the model and effort selected in Claude Code.
Do not set model: "custom-model".
Omit model and reasoning_effort overrides.
No role-to-model configuration is needed.
PStack does not
check model availability or select a different model.
Older ports used pstack-models.md.
An independent review needs a fresh context, not a different model.
Model variants as discriminated unions.
Understand the data model and the mental model.
Read the dbt model from the warehouse.
Confirm the exact model name with SHOW TABLES.
Check the data model before changing the parser.
List the database models involved in this migration.
Use Composer for PHP dependencies.
Use Opus for audio encoding.
Model the domain before writing stateful logic.`);
	assert.equal(result.status, 0, result.output);
});

test("scanner rejects named examples in shipped guides and provenance", () => {
	for (const path of ["README-UPSTREAM.md", "PORTING.md"]) {
		assert.equal(scan("Use gpt-5.6-sol.", path).status, 1);
		const attribution = scan("Upstream: [PStack](https://github.com/poteto/pstack/tree/61b9c0b).", path);
		assert.equal(attribution.status, 0, attribution.output);
	}
	assert.equal(scan("Select your model in Claude Code, such as Opus 5.", "README.md").status, 1);
	assert.equal(scan("Select your model in Claude Code, such as Opus 5.", "plugins/pstack/docs/guide/01-setup.md").status, 1);
	assert.equal(scan("Use GPT-6 Astra for this task.").status, 1);
});

for (const text of [
	'Use your configured architect runners (defaults `claude-fable-5-1-thinking-max`).',
	'| Reviewer D | `claude-opus-5-thinking-xhigh` |',
	'feature, refactoring: grok-4.6-fast-xhigh',
	'Use claude-sonnet-4-6.',
	'Use claude-3-5-sonnet-20241022.',
	'Use gemini-2.5-pro.',
	'Use Fable for prose and judgment.',
	'Use Sol for code.',
	'Use Grok for mechanical edits.',
	'Use Claude for the task.',
	'Use Opus for the reviewer.',
	'Use Composer for code.',
	'Use Sonnet.',
	'The default panel is fable 5.1 / sol / grok / opus 5.',
	'Precisely specified code goes to fable 5.1.',
	'Fast mechanical code goes to grok.',
	'| Reviewer A | Fable 5.1 |',
	'| Reviewer B | Sol |',
	'Pick the runners from ~/.cursor/rules/pstack-models.mdc.',
	'Use explicit model per role.',
	'Spawn three calls with explicit `model:` on each.',
	'Delegate implementation using your configured perf-issue model.',
	'Pick the worker model from `swarm workers`.',
	'Choose one model from the `arena cross-judge pool`.',
	'Prefer a different model family from the parent.',
	'For a model race, name each arm’s model up front.',
	'Code delegates tier by model strength.',
	'Trivial mechanical edits go to your fast code model.',
	'Per-role model settings override these defaults.',
	'Do not set model: "small"; model: "large".',
	'Do not select a different model, but use Grok for code.',
	'Do not select a different model and use Grok for code.',
	'Do not select a different model, use Grok for code.',
	'Do not set model: "small" and set model: "large".',
	'Do not set model: "small", set model: "large".',
	'Select your preferred model in Claude Code, such as Astra.',
	'Pass model: sonnet on the Agent call.',
	'Use Fable for judgment and Sonnet for mechanical edits.',
	'Spawn the reviewer with model: opus.',
	'Use Grok for code after the old fields are removed.',
]) {
	test(`scanner rejects upstream policy: ${text}`, () => {
		const result = scan(text);
		assert.equal(result.status, 1, result.output);
	});
}

for (const text of [
	'Use Composer to install PHP dependencies for the implementation.',
	'Use Opus for audio encoding in the worker.',
	'Opus 1.5 is the audio codec version.',
	'The composer writes a sonnet about a fable.',
	'Grok Bot receives this webhook.',
	'Model each reviewer as a row in the database.',
	'Choose one model from the database schema.',
	'The worker model stores queue state.',
	'Per-role permissions are stored in the domain model.',
	'Use an explicit model of the domain.',
	'The configured domain model represents users.',
	'Per-role model configuration and model availability gates are removed.',
	'Do not use explicit model per role.',
	'Do not set model: "custom-model".',
	'Do not pick the worker model; inherit the selected settings.',
	'Never use Sonnet for reviews.',
	'Do not select a different model or use Grok for code.',
	'Do not select a different model, nor use Grok for code.',
	'Do not select a different model and do not use Grok for code.',
	'Do not select a model, check model availability, or write global configuration.',
	'PStack does not choose models, probe availability, or maintain a role-to-model configuration.',
	'No role-to-model configuration is needed.',
	'Install the plugin in Claude Code and invoke /pstack:poteto-mode.',
	'Run the reviewer as a pstack:read-only subagent.',
	'Omit the `model` parameter on every Agent call.',
	'Children inherit the model and effort of the session that spawned them.',
]) {
	test(`scanner permits non-policy prose: ${text}`, () => {
		const result = scan(text);
		assert.equal(result.status, 0, result.output);
	});
}
