---
name: arena
description: "Spawn N parallel candidates at the same task, pick a base, graft the strongest parts of the losers into it. Use for /pstack:arena, 'arena this', 'throw it in the arena', or when one attempt at a non-trivial artifact would lock in the wrong shape."
---

# Arena

Fan out N parallel attempts at the same task. Read every candidate end to end. Pick the strongest as the base. Graft the best ideas from the others into it. Verify the synthesized result.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Blind judge
4. Pick
5. Graft
6. Verify

## Phase A: Frame

The N candidates share a task contract, with a distinct exploration direction when useful.

1. State the artifact each candidate is producing.
2. Derive the rubric. State what success looks like for *this* task, then turn it into 3-6 concrete gradeable criteria. The rubric is the picker's tool in Phase D. Candidates only see the task.
3. Choose enough runners to explore the relevant design directions. Give every
   runner a fresh context and the same task contract. When directions need
   deliberate coverage, assign a distinct hypothesis or structural constraint
   to each runner without changing the shared requirements.
4. Assign output paths. Each candidate writes to its own location (its own worktree via `isolation: "worktree"` where possible, otherwise `/tmp/arena-<slug>/candidate-<n>/`), per the **separate-before-serializing-shared-state** principle skill.

## Phase B: Fan out

Spawn the N subagents in one message with the `Agent` tool, up to the concurrent-subagent limit, using additional waves as needed. Give each repository writer `isolation: "worktree"` and have it report its worktree path and branch. Each child gets the task, the path to shared grounding, its own output path, and instructions to produce both the artifact and a short rationale. Read-only candidates can share a checkout. Follow `../poteto-mode/references/claude-delegation.md`.

Each rationale names the alternatives the candidate considered and what it rejected.

If a candidate fails to produce output, proceed with N-1 and note the dropout in the synthesis record.

## Phase C: Blind judge

After all Phase B candidates complete, spawn one `pstack:read-only` judge in
a fresh, self-contained context. It sees the rubric and the candidates by
anonymous path label, without runner identities or the parent's preferred
answer. It scores each criterion and recommends a base with
rationale. It runs in parallel with the parent's reading in Phase D, not with
the candidates themselves. Do not spawn the judge while candidates are still writing.

## Phase D: Pick a base

Read every candidate end to end before picking.

Score each candidate against the rubric criterion by criterion, not on holistic feel. Compare against the blind judge. Agreement on the base confirms the pick. Disagreement means one of you is biased or the rubric was ambiguous. Read both rationales before deciding.

Pick the base on which candidate a future maintainer can extend most easily without breaking invariants. Prefer the cleaner boundary or smaller API when two feel tied, per the Laziness Protocol.

Record the pick and the reason in a short synthesis note alongside the base artifact, including the blind judge's verdict.

## Phase E: Graft

Walk each losing candidate once more and identify what is worth porting into the base. The signal is usually one or two things per candidate, not most of it.

Fold each graft in by hand, per the **redesign-from-first-principles** principle skill. Don't paste mechanically. The result has to remain coherent under one mental model.

Record what was grafted, from which candidate, and what was rejected and why.

When candidates converge on the same shape, record that agreement and verify the shared assumptions; repeated agreement is not proof. No graft is needed when the best result is already coherent. When candidates diverge, compare the tradeoffs against the contract. Reframe and re-run only if the requirements were too ambiguous to judge.

## Phase F: Verify

The synthesized artifact has to hold up under the same scrutiny as any other output, per the **prove-it-works** principle skill.

If verification surfaces a problem the arena did not catch, either Phase A was wrong (re-frame and re-run) or one candidate caught it and you missed the graft (go back to Phase E). Don't paper over.

## Outputs

One synthesized artifact. One short synthesis note alongside, naming the base, the grafts (with source candidate), the rejections, the dropouts if any, and the verification result.
