# Porting record

This repository started from `pstack-codex` at commit `b017d7b`, which tracks
pstack 0.15.0 at `cursor/plugins@71ed0d1`. Port version 2.0.0 replaces the
earlier `pstack-claude` line (1.0.x), which routed roles to named models
through a rules file. That line is gone. Delegates inherit the session's
settings, setup is an optional readiness check, and the distribution contains
no model specifications.

## Source inventory

The Codex checkout was clean before the port. Its tracked distribution
contained:

- 46 skills, including 23 `principle-*` leaves
- 23 `poteto-mode` playbook files
- two delegation and state references
- 17 guide files, including six images
- 20 Bun helper and test files
- one startup hook, one Codex manifest, one logo, one `agents/openai.yaml`

The Claude Code distribution preserves the skills, playbooks, principles,
guide, and helpers. It drops the Codex manifest, the logo,
`agents/openai.yaml`, and the startup hook. It adds one agent definition and
one Claude manifest.

## Package shape

The repository is a Claude Code marketplace with one plugin:

```text
.claude-plugin/marketplace.json
plugins/pstack/
  .claude-plugin/plugin.json
  agents/read-only.md
  skills/
  docs/guide/
  HARNESS.md
scripts/
```

Claude Code discovers `skills/` and `agents/` from the
plugin root without manifest fields. The manifest carries identity only.

## Runtime mapping

| Codex contract | Claude Code port |
|---|---|
| `spawn_agent` and the native task controls | `Agent`, `SendMessage`, `ListAgents`, `TaskStop`, task notifications |
| No-edit brief | `pstack:read-only` agent (`disallowedTools: Edit, Write, NotebookEdit`) plus the brief |
| Coordinator-created worktree per writer | `isolation: "worktree"` on the spawn |
| Inherit the Codex model and reasoning effort | Inherit the session's model and effort; omit `model` on every spawn |
| Heartbeat automation or watcher task | `/loop` and `Monitor` |
| Deliberate simplification pass | Built-in `/simplify` |
| `.agents/skills` | `.claude/skills` |
| `${CODEX_HOME}/sessions/` by exact thread id | `~/.claude/projects/<project-slug>/<session-id>.jsonl` |
| `${CODEX_HOME}/pstack-codex/projects/<repo-fingerprint>/` | `~/.claude/pstack/<project-slug>/` |
| `agents/openai.yaml` `allow_implicit_invocation: false` | `disable-model-invocation: true` frontmatter |
| `$setup-pstack` readiness check | `/pstack:setup-pstack`, unchanged in intent |

The full operational table is in
[`plugins/pstack/HARNESS.md`](./plugins/pstack/HARNESS.md).

## Deliberate changes

Three Codex-motivated removals are reversed because Claude Code supports the
upstream behavior:

- The worktree audit scans `~/.claude/projects/<project-slug>/` for the newest
  chat that touched each worktree and emits the `LAST_CHAT` column and the
  `verify-recent-chat` bucket again. The Codex port dropped it because Codex
  sessions are not partitioned by repository.
- `recall` and `automate-me` mine the active project's transcript directory by
  modification time instead of a single thread id, which is what upstream
  intends and what a repo-partitioned transcript store makes safe.
- `typescript-best-practices` carries `paths: "**/*.ts,**/*.tsx"` again.

Two Claude-specific frontmatter choices are new:

- Every skill carries `disable-model-invocation: true`, the direct equivalent
  of the Codex port's explicit-only policy and what upstream ships. Claude
  Code blocks the Skill tool on such a skill even when another skill asks for
  it, so a skill that routes to a sibling reads
  `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md` instead. The startup hook
  that asked for `poteto-mode` is gone with it.
- The 23 `principle-*` leaves also carry `user-invocable: false`. The guide
  says you steer with their names rather than invoking them, so the slash
  menu hides them and `poteto-mode` reads them from disk.

The plugin installs exactly one agent, `read-only`. It pins no model and no
effort. The Codex port rejected custom agents because Codex presets carry
execution settings. A Claude Code agent definition without a `model` field
follows the session's resolution order, so it is a tool restriction, not a
setting.

The GitHub PR watcher still recognizes Cursor Bugbot comments. Those comments
are remote PR data, not a local runtime dependency.

## Acceptance checks

`scripts/verify-port.sh` checks the marketplace entry, the plugin manifest,
the agent, all 46 skill manifests and their explicit-only flags, the 23 playbooks, the 23
principles, guide and helper counts, forbidden Codex and legacy contracts, the
shell helper, Bun tests, and TypeScript types. It runs
`claude plugin validate` on the marketplace and the plugin when the CLI is
present. Regression checks reject fixed model identifiers and known model
availability, routing, and execution-override patterns in operational content.
The plan checker is exercised with a plan that uses independent verification
lanes. These checks catch known regressions; review still assesses instruction
meaning.

Local verification does not publish the plugin or update installed copies.
Installation remains an explicit user action.
