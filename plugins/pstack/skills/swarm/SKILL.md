---
name: swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /pstack:swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
---

# Swarm

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the concurrent-agent cap.
4. For an approach race, name each arm's approach or hypothesis up front and
   give each worker a fresh context.
5. Give each writer its own worktree through `isolation: "worktree"`. Read-only workers may share the checkout. A non-repository artifact can use `/tmp/swarm-<slug>/worker-<n>/`.

## Phase B: Fan out

Spawn workers with the `Agent` tool, all in one message, in waves when N
exceeds the concurrent-subagent limit. Every writer gets `isolation:
"worktree"` and reports its worktree path and branch. Follow
`../poteto-mode/references/claude-delegation.md`.

When a worker must start from a non-default pushed branch, tell it to fetch and check out that branch in its worktree before anything else.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
