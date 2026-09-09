# Claude Code state contract

## Plugin-owned state

Use `~/.claude/pstack/<project-slug>/` as the durable store, "the store".
`docs/` holds plans and notes. `orchestrate/` holds queue state, receipts,
inbox files, and ledgers. Create it on first use.

`<project-slug>` is the repository's main worktree path with every character
that is not a letter or digit turned into `-`, leading dash kept
(`/Users/you/proj` becomes `-Users-you-proj`). It is the same slug Claude Code
uses for transcripts, so one name finds both.

## Transcript policy

Claude Code writes every session to
`~/.claude/projects/<project-slug>/<session-id>.jsonl`. Subagent transcripts
sit under `<project-slug>/<session-id>/subagents/agent-<id>.jsonl`. Every line
is one JSON record; chat messages carry `"type":"user"` or
`"type":"assistant"`.

1. Stay inside the active project's slug. Never read another project's
   transcripts without being asked.
2. For the current session, resolve exactly `<session-id>.jsonl`. Inside a
   skill body the id is available as `${CLAUDE_SESSION_ID}`. Verify the
   opening user message matches the task before trusting the file.
3. Skills that mine history (`recall`, `automate-me`, the worktree audit) may
   read other sessions in the same slug, ordered by modification time, within
   the window the user named.
4. Keep the raw transcripts in subagents. The main thread gets findings.

`claude --resume <session-id>` reopens a session. `/tasks` lists background
work in the current one.

## Wake policy

`/loop` is Claude Code's built-in wake mechanism. Omit the interval to let the
agent self-pace, or give one (`/loop 30m`) for a fixed cadence. Use the
`Monitor` tool for an event wake such as the PR watcher's output or a CI
predicate, with a long `/loop` heartbeat as the fallback. The wake mechanism
exists to re-evaluate a state change, not to replace a finish condition.
