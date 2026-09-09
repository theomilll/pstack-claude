#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Scan shipped instructions, provenance and configuration, not these regression
// fixtures. These checks catch known regressions, not every
// possible natural-language directive. Domain/data/mental models are valid.
const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), ".."));
const sources = ["README.md", "README-UPSTREAM.md", "PORTING.md", "plugins/pstack"].map(path => join(root, path));
const extensions = /\.(?:md|json|mjs|js|ts|sh|toml|ya?ml)$/;
const identifiers = /\b(?:gpt[- ]?\d+(?:\.\d+)*(?:[- ][a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)?|claude-(?:\d|(?:fable|opus|sonnet|haiku)-)[a-z0-9.-]+|(?:grok|gemini)-\d[a-z0-9.-]*)\b/i;
const modelNames = "(?:Claude(?: +(?:Fable|Opus|Sonnet|Haiku))?|Fable|Opus|Sonnet|Haiku|Gemini|Composer|Grok|Sol|Astra)";
const namedModel = `${modelNames}(?:[ -]\\d+(?:\\.\\d+)*)?`;
const configuredRoles = "(?:architect|arena|swarm|interrogate|reflect|how|why)(?:-[a-z]+)?|feature|refactoring|perf-issue|bug-fix|hillclimb";
const runtimeRules = [
	// Match the model's immediate role, not distant words such as "worker" in
	// "Use Opus for audio encoding in the worker" or PHP Composer instructions.
	[new RegExp(`\\b(?:use|choose|select|assign|run|switch to)\\s+${namedModel}\\b(?=\\s*(?:[.!?,;]|$)|\\s+(?:for|as|to)\\s+(?:the |a |an )?(?:model|agent|worker|review\\w*|search\\w*|cod\\w*|implementation|task\\w*|prose|judgment|mechanical)\\b)`, "i"), "alternate-model routing"],
	[new RegExp(`\\b(?:go(?:es)? to|default panel is|default model is)\\s+${namedModel}\\b`, "i"), "alternate-model routing"],
	[new RegExp(`\\bmodel\\b[^.\\n]{0,40}\\bsuch as\\s+${namedModel}\\b`, "i"), "named model example"],
	[new RegExp(`\\|\\s*[^|\\n]+\\|\\s*\`?${namedModel}\\s*\`?\\s*\\|`, "i"), "named model settings table"],
	[/\b(?:model|reasoning_effort|reasoningEffort|thinking)\s*["'`]?\s*[:=]\s*(?:["'`][^"'`]+["'`]|[a-z0-9_.-]+)/i, "explicit execution override"],
	[/--(?:model|reasoning-effort)\b/i, "explicit execution override"],
	[/\b(?:pstack-models?\.(?:mdc?|json|toml|ya?ml)|model-to-task|role-to-model)\b/i, "role model configuration"],
	[/\b(?:explicit\s+`?model:|per-role\s+model\b|model\s+per\s+role\b)/i, "role model configuration"],
	[new RegExp(`\\bconfigured\\s+(?:${configuredRoles})\\s+model\\b`, "i"), "role model configuration"],
	[/\b(?:pick|choose|select)\s+(?:the\s+)?(?:worker|reviewer|runner)\s+model\b/i, "role model configuration"],
	[/\bmodel\s+from\s+the\s+`?arena cross-judge pool\b|\bmodel race\b|\btier by model strength\b|\b(?:fast code|strongest judgment) model\b/i, "model routing"],
	[/\|\s*`?(?:default model|model|model role|reasoning effort)`?\s*\|/i, "role execution settings table"],
	[/\b(?:fast,? cheap|cheap,? fast|different|multiple|diverse) models?\b|\b(?:cross-model|multi-model|model diversity)\b/i, "model routing"],
	[/\b(?:raise|increase|lower|set|adjust|override|change)\b[^.\n]{0,55}\b(?:reasoning effort|reasoning_effort)\b/i, "reasoning effort override"],
	[/\b(?:confirm|check|probe)\b[^.\n]{0,40}\bmodel availability\b|\b(?:enumerate|list)\s+(?:available\s+)?(?:Codex\s+)?models\b/i, "model availability gate"],
	[/\bmodel\b[^.\n]{0,40}\b(?:unavailable|not available)\b[^.\n]{0,30}\bstop\b/i, "model availability gate"],
];

function* files(path) {
	if (!existsSync(path)) return;
	if (statSync(path).isFile()) { yield path; return; }
	for (const entry of readdirSync(path, { withFileTypes: true })) {
		if (entry.name === "node_modules" || entry.name === ".git") continue;
		const child = join(path, entry.name);
		if (entry.isDirectory()) yield* files(child);
		else if (extensions.test(entry.name)) yield child;
	}
}

function paragraphs(text) {
	const blocks = [];
	for (const [index, line] of text.split(/\r?\n/).entries()) {
		const previous = blocks.at(-1);
		if (previous && line.trim() && previous.text.trim() &&
			!/[.!?]$/.test(previous.text) && !/^\s*(?:#|[-*] |```|\|)/.test(line)) {
			previous.text += " " + line.trim();
		} else blocks.push({ line: index + 1, text: line });
	}
	return blocks;
}

// An additive imperative starts a new directive. Comma lists ending in "or"
// or "nor" keep their shared negation, as in "Do not select, check, or set".
const imperative = "(?:do not|don't|never|use|choose|select|assign|run|switch|set|raise|increase|lower|adjust|override|change|spawn|check|confirm|probe|enumerate|list|pick)\\b";
const sentenceBreak = new RegExp(`;|\\.\\s+|,?\\s+but\\s+|,?\\s+and\\s+(?=${imperative})`, "i");
const imperativeComma = new RegExp(`,\\s*(?=${imperative})`, "i");
function clauses(text) {
	return text.split(sentenceBreak).flatMap(clause =>
		/,\s+(?:or|nor)\s+/i.test(clause) ? [clause] : clause.split(imperativeComma));
}

let failures = 0;
for (const source of sources) for (const file of files(source)) {
	const name = relative(root, file);
	for (const { line, text } of paragraphs(readFileSync(file, "utf8"))) {
		// Explicit denials and migration history explain the policy rather than
		// configure it. Keep this exemption clause-local, so a later directive
		// on the same line is still inspected. Split coordinated imperatives too,
		// while leaving noun lists and negative "or"/"nor" lists together.
		for (const clause of clauses(text)) {
			const pinned = identifiers.test(clause);
			const rule = runtimeRules.find(([pattern]) => {
				const match = pattern.exec(clause);
				if (!match) return false;
				const prefix = clause.slice(0, match.index).trim();
				return !/^(?:[-*] )?(?:do not|don't|never|omit|older ports used|(?:pstack|it|this port) does not)\b/i.test(prefix)
					&& !/^(?:no|not)$|\bnot a$/i.test(prefix)
					&& !/^\s*(?:[-*] )?(?:per-role model|role-to-model|model availability)\b[^.]*\b(?:is|are|was|were|has been|have been) removed[.!]?\s*$/i.test(clause);
			});
			if (!pinned && !rule) continue;
			console.error(`${name}:${line}: ${pinned ? "pinned model identifier" : rule[1]}: ${clause.trim()}`);
			failures++;
		}
	}
}
if (failures) process.exit(1);
console.log("check-model-policy: no known model-policy regressions found");
