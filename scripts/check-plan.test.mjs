import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const checker = fileURLToPath(new URL("../plugins/pstack/skills/poteto-mode/scripts/check-plan.mjs", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "pstack-check-plan-"));
after(() => rmSync(dir, { recursive: true, force: true }));
const rule = "Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.";
const lanes = Array.from({ length: 10 }, (_, i) => `- [ ] Lane ${i + 1}. Exercise the delivered UI. Save \`evidence/lane-${i + 1}.png\`. Pass when the expected result appears.`).join("\n");
const plan = `# Deliver the feature
A bounded implementation with evidence at the PR head.

## How to read this
One box is one unit of work and names the evidence.
Check a box only when its evidence exists.
Use the relevant playbooks/ for each phase.
${rule}

## Program checklist
### Arm the program
- [ ] Record the standing objective and a 30-minute status message cadence.
### Spawn owners
- [ ] Assign disjoint work to owners.
### PR mechanics
- [ ] Open the implementation PR.
### Verdict and merge
- [ ] Require verification before merging.
### Boot recipe
- [ ] Run the documented application entry point.

## PR 1
**Depends on.** Nothing.
**Files.**
- [ ] Update the feature module.
**Build.**
- [ ] Implement the feature.
**You see.**
- [ ] The user can complete the feature flow.
**Verify, unit.** ${rule}
- [ ] Run the behavior test and save its output.
**Verify, live.** ${rule} Ten independent verification lanes at the PR head.
${lanes}
**Verify, perf.** ${rule}
- [ ] Metric. Response latency.
- [ ] Probe. Repeat the real feature flow.
- [ ] Baseline. Record latency before the change.
- [ ] Rule. No regression from baseline.
**Review gate.**
- [ ] Give the operator a screenshot and video of the result.
**Merge.**
- [ ] Merge after evidence and review pass.

## Close the program
- [ ] Record the delivered result.

## Appendix A. Prototype evidence
The implementation matches the reviewed prototype.
`;

function check(text) {
	const file = join(dir, "plan.md");
	writeFileSync(file, text);
	const result = spawnSync(process.execPath, [checker, file], { encoding: "utf8" });
	assert.ifError(result.error);
	return { status: result.status, output: result.stdout + result.stderr };
}

function rejects(text, diagnostic) {
	const result = check(text);
	assert.equal(result.status, 1, result.output);
	assert.match(result.output, diagnostic);
}

test("CLI accepts a plan with independent verification and no model configuration", () => {
	const result = check(plan);
	assert.equal(result.status, 0, result.output);
	assert.match(result.output, /1 PR sections, 0 problems/);
});

test("CLI requires evidence for all ten live verification lanes", () => {
	rejects(plan.replace(/^- \[ \] Lane 10\..*\n/m, ""), /expected 1 to 10/);
	rejects(plan.replace("Save `evidence/lane-1.png`.", ""), /lane 1 names no screenshot/);
	rejects(plan.replace("Pass when the expected result appears.", "The expected result appears."), /lane 1 has no pass predicate/);
});

test("CLI retains unit, performance and review gates", () => {
	rejects(plan.replace("- [ ] Run the behavior test and save its output.\n", ""), /Verify, unit\. has no box/);
	rejects(plan.replace("- [ ] Baseline. Record latency before the change.\n", ""), /perf boxes are/);
	rejects(plan.replace("**Verify, perf.** " + rule, "**Verify, perf.**"), /Verify, perf\. does not open with the rule/);
	rejects(plan.replace("- [ ] Give the operator a screenshot and video of the result.\n", ""), /Review gate has no box/);
});
