# pstack for Claude Code

Claude Code port of [poteto](https://x.com/poteto)'s
[pstack](https://github.com/cursor/plugins/tree/main/pstack) (upstream
v0.15.0, `cursor/plugins@71ed0d1`), ported from the
[Codex port](https://github.com/theomilll/pstack-codex)
(`pstack-codex@b017d7b`). The 23 playbooks and 23 principles are poteto's.
This repository ports the harness to Claude Code's plugin, skill, hook, and
subagent tools. [Upstream provenance](./README-UPSTREAM.md) links to the
original distribution. MIT, same as upstream.

> if you want to go fast, go deep first. pstack helps you write less, but
> higher quality code. rigorous agent workflows you can parallelize with
> confidence.

## Install

Published repo:

```text
/plugin marketplace add theomilll/pstack-claude
/plugin install pstack@pstack-claude
```

Local checkout:

```text
/plugin marketplace add /path/to/pstack-claude
/plugin install pstack@pstack-claude
```

## Get started

1. Use your preferred Claude Code model and effort.
2. Use `/pstack:poteto-mode` for tasks that need its coding and verification
   workflow.

`/pstack:setup-pstack` is optional. It checks skill discovery and the tools
needed for your task, and can help you find or create a project verification
skill.

New here? The [guide](./plugins/pstack/docs/guide/README.md) walks through a
first real task. Every `/pstack:name` in the guide is a Claude Code skill.
Claude also picks the skills implicitly when your request matches their
descriptions.

pstack inherits the model and effort selected in Claude Code. It does not
choose models, assign execution settings by role, check model availability, or
write settings. Independent reviewers use fresh context and different review
briefs. Any subagent default you configured yourself stays yours; pstack does
not override it.

## What changed from the Codex port

- Codex's native subagent tools become the `Agent` tool. Read-only lanes run
  as `pstack:read-only`, the one agent this plugin installs. Writing lanes run
  as `general-purpose` and invoke `/pstack:poteto-mode` first.
- Coordinator-created worktrees become `isolation: "worktree"` on the spawn.
- `.codex-plugin/` becomes `.claude-plugin/`. The repo is a marketplace with
  one plugin at `plugins/pstack/`.
- `.agents/skills/verify-<app>/` becomes `.claude/skills/verify-<app>/`.
- Codex's heartbeat and watcher wake mechanisms become Claude Code's `/loop`
  and the `Monitor` tool.
- Codex session lookup by exact thread id becomes
  `~/.claude/projects/<project-slug>/<session-id>.jsonl`. Claude Code
  partitions transcripts by project, so `recall`, `automate-me`, and the
  worktree audit mine the active project's history again, as upstream does.
- The deliberate simplification pass becomes the built-in `/simplify`.
- `agents/openai.yaml` on `unslop` becomes `disable-model-invocation: true`.
- The 23 `principle-*` leaves are `user-invocable: false`: hidden from the
  slash menu, loadable by the model. `typescript-best-practices` gets its
  upstream `paths` scope back.
- The plugin logo is not shipped. Claude Code manifests have no logo field.

Everything else, including the playbook and principle content, is preserved as
closely as the runtime allows. The exact mapping lives in
[plugins/pstack/HARNESS.md](./plugins/pstack/HARNESS.md). The
[porting record](./PORTING.md) names the source, deliberate changes, and
acceptance checks.

Run the complete local verification with:

```text
./scripts/verify-port.sh
```

## Versioning

Version 2.0.0 replaces the earlier Claude port, which routed roles to named
models. This line tracks upstream 0.15.0 through the Codex port and ships no
model specifications. The plugin version in
`plugins/pstack/.claude-plugin/plugin.json` and the marketplace entry are this
port's own line. Bump both whenever installed copies should pick up a change;
`claude plugin update` skips when the number is unchanged.

## Skills

| skill | for |
|---|---|
| `poteto-mode` | The entry point. Picks a playbook and runs the rest. |
| `how`, `why`, `teach`, `recall` | Understand the code before touching it. |
| `architect`, `arena`, `swarm`, `interrogate`, `blast-radius` | Design and stress the change. |
| `tdd`, `no-comments`, `unslop`, `technical-writing`, `typescript-best-practices` | Build and clean it. |
| `create-verification-skill`, `maintain-verification-skill`, `show-me-your-work` | Prove it. |
| `figure-it-out`, `reflect`, `automate-me`, `setup-pstack`, `bro` | The rest. |
| `principle-*` | The 23 principles, one leaf skill each. Hidden from the slash menu; steer with their names. |

Agents: `read-only` (panels, explorers, judges, verifiers). Nothing else is installed.
