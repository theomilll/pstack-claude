# Claude Code delegation contract

Use this reference whenever a pstack skill fans work out to subagents.

## Core rules

1. Claude Code owns subagent execution. Spawn with the `Agent` tool. The plugin
   installs one agent type, `pstack:read-only`, and nothing else.
2. The parent owns the result. Children explore, implement, or verify one
   bounded slice. The parent reads their work and writes the final summary.
3. Read-only lanes run as `subagent_type: "pstack:read-only"`. That agent keeps
   full context and MCP access and drops `Edit`, `Write`, and `NotebookEdit`.
   State the no-edit rule in the brief anyway.
4. No two concurrent writers share one checkout. Pass `isolation: "worktree"`
   to every writer that could touch the same tree as another. Claude Code
   creates the worktree under `.claude/worktrees/` from the default branch and
   removes it when the child leaves it unchanged.

## Spawn shape

```text
Agent
  description: <3-5 words>
  prompt: <full brief, file pointers not inlined dumps>
  subagent_type: general-purpose | pstack:read-only
  isolation: worktree            (any concurrent writer)
```

Writing lanes run as `general-purpose` and open with an instruction to read
`${CLAUDE_PLUGIN_ROOT}/skills/poteto-mode/SKILL.md`, or the routed skill's
file, and follow it before any work. Paste the resolved absolute path into
the brief. pstack skills are explicit-only, so a child cannot invoke them and
their descriptions are not in its context. Omit the
`model` parameter and any effort override. Subagents run in the background and
the parent receives a task notification when one finishes. Spawn independent
children in one message so they run concurrently.

## Brief shape

Every delegated brief should name:

- the exact goal
- the writable and forbidden paths
- the acceptance checks
- the artifacts to return
- whether the lane is read-only, writing, or verifying

Prefer file pointers over pasted dumps. A writer in a worktree reports its
worktree path and branch so the parent can read the diff.

## Inherit the session's settings

Children inherit the model and effort of the session that spawned them. pstack
does not choose models, probe availability, or maintain a role-to-model
configuration. A subagent default the user configured in their own settings
stays theirs; this plugin does not override it.

An independent review needs a fresh context and a self-contained brief, not
a different model. Keep the implementer's conclusions out of a verifier's
brief so it can check the artifact against the acceptance criteria itself.
When the concurrent-subagent limit is reached, schedule additional waves as
slots free up. When the `Agent` tool is unavailable, as for a child at the
spawn depth limit, run the bounded passes locally and disclose the loss of
independent review. Never claim a separate verifier ran when it did not.

## Steering and synthesis

- Continue or steer a running child with `SendMessage` to its name or id.
  Inspect with `ListAgents`. Stop with `TaskStop`.
- Do not trust a child's summary alone. Read its artifact, diff, or evidence.
- A second opinion is the same bounded brief in a fresh context.
- If a lane stalls or drifts, replace it with a fresh bounded lane instead of
  stacking vague follow-ups.
