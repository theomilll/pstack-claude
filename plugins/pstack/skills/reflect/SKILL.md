---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/pstack:reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

The parent finds its own transcript file before fanning out. Claude Code
writes it to `~/.claude/projects/<project-slug>/<session-id>.jsonl`, where
`<project-slug>` is the working directory with every character that is not a
letter or digit turned into `-` (leading dash kept) and the session id is
`${CLAUDE_SESSION_ID}`. Subagent transcripts sit beside it under
`<session-id>/subagents/`. Do not glob other sessions or other projects.

```bash
ls "$HOME/.claude/projects/$(pwd | sed 's#[^A-Za-z0-9]#-#g')/${CLAUDE_SESSION_ID}.jsonl"
```

Read the file's first `"type":"user"` line and check that `message.content` contains the conversation's opening user prompt. Take the matching path. If no path resolves, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

One message, three `Agent` calls with `subagent_type: pstack:read-only`.
Reviewers may need MCP access for context lookups; the read-only agent keeps
it. The prompt forbids file writes. The parent applies edits.

Each reviewer starts in a fresh context. Follow `../poteto-mode/references/claude-delegation.md`.

| Lens | Prompt template |
|---|---|
| Judgment | `references/judgment-reviewer.md` |
| Tooling | `references/tooling-reviewer.md` |
| Divergent | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where
marked. Reviewers return findings in the subagent response body.

### 3. Synthesize

One fresh `pstack:read-only` synthesizer subagent. The synthesizer's
quality check includes spot-verifying citations, which can require MCP access.
Use `references/synthesizer.md` verbatim, with each reviewer's full output
inlined where marked. The synthesizer returns a structured Accepted / Rejected
/ Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): draft it per the poteto-mode Authoring a skill playbook, then run the Eval playbook's draft / test / iterate loop.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): rewrite the description to say what the skill does and when to use it, then re-test the trigger with the Eval playbook.
- `new skill: <kebab-name>`: create it per the Authoring a skill playbook. Do not invent the shape ad hoc.

If your environment ships a SKILL.md validator, run it on every touched skill before declaring done. Skip this step if it doesn't.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
