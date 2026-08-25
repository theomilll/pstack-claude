# pstack for Claude Code

Claude Code port of [poteto](https://x.com/poteto)'s [pstack](https://github.com/cursor/plugins/tree/main/pstack) (upstream v0.14.3, `cursor/plugins@bdf7aa3`). The 22 playbooks and 21 principles are poteto's. This repository swaps only the harness call layer: Cursor's `Task`, model slugs, rules directory, cloud agents, and team-kit skills become their Claude Code equivalents. The mapping is in [HARNESS.md](./HARNESS.md); the upstream README is preserved at [README-UPSTREAM.md](./README-UPSTREAM.md). MIT, same as upstream.

> if you want to go fast, go deep first. pstack helps you write less, but higher quality code. rigorous agent workflows you can parallelize with confidence.

## Install

```text
/plugin marketplace add theomoura/pstack-claude
/plugin install pstack@pstack-claude
```

Local checkout:

```text
/plugin marketplace add /path/to/pstack-claude
/plugin install pstack@pstack-claude
```

Optional, for the `gpt-5.6-sol` roles: the [Codex plugin](https://github.com/openai/codex-plugin-cc) (`/plugin marketplace add openai/codex-plugin-cc`, `/plugin install codex@openai-codex`). Without it, code roles run on `opus` and panels lose the GPT seat.

## Get started

1. Run `/pstack:setup-pstack` and choose which models you want. It writes `~/.claude/rules/pstack-models.md`.
2. Use `/pstack:poteto-mode` whenever you're doing anything that requires rigor.

New here? The [pstack guide](./docs/guide/README.md) walks you through a first real task. Every `/name` in the guide is `/pstack:name` here; the bare form also works when no other plugin ships a skill with that name.

The other skills are situational; the mode skill uses them for you as needed. Out of the box the mode splits work by model strength: precisely specified and mechanical code goes to `gpt-5.6-sol` through Codex, prose and judgment go to `fable`, and the review panels are `fable` / `gpt-5.6-sol` / `opus`. `/pstack:setup-pstack` changes any of it.

## What changed from upstream

- `Task` → `Agent`. No `run_in_background` (subagents already run in the background), no `readonly` (use `pstack:read-only`), no `environment: "cloud"` (use `isolation: "worktree"`).
- Model slugs → Claude Code aliases (`fable`, `opus`, `sonnet`). `gpt-5.6-sol` routes through `codex:codex-rescue`. Grok is gone, so four-model panels are three.
- `~/.cursor/rules/pstack-models.mdc` → `~/.claude/rules/pstack-models.md`.
- Cursor's `create-skill`, `cursor-team-kit`'s `deslop` / `control-ui` / `control-cli`, and the built-in babysit skill → the Authoring a skill playbook, `/simplify`, the project's `verify-<app>` skill, and nothing, respectively.
- Transcript paths → `~/.claude/projects/<slug>/`.
- The `mode:` / `reminder:` frontmatter → a one-line `SessionStart` hook. Delete `hooks/hooks.json` from the installed copy to opt out.
- `disable-model-invocation: true` removed everywhere. On Claude Code it makes the Skill tool refuse the skill, which would cut every route out of `poteto-mode`. The `principle-*` leaves are `user-invocable: false` instead: hidden from the slash menu, loadable by the model.
- The Benny automations pack (a Cursor Automations feature) is not shipped.

Everything else, including the playbook and principle text, is upstream's. See [HARNESS.md](./HARNESS.md) for the full table.

## Skills

| skill | for |
|---|---|
| `poteto-mode` | the entry point. Picks a playbook and runs the rest. |
| `how`, `why`, `teach`, `recall` | understand the code before touching it. |
| `architect`, `arena`, `swarm`, `interrogate`, `blast-radius` | design and stress the change. |
| `tdd`, `no-comments`, `unslop`, `technical-writing`, `typescript-best-practices` | build and clean it. |
| `create-verification-skill`, `maintain-verification-skill`, `show-me-your-work` | prove it. |
| `figure-it-out`, `reflect`, `automate-me`, `setup-pstack`, `bro` | the rest. |
| `principle-*` | the 21 principles, one leaf skill each. |

Agents: `poteto-agent` (routing target for the mode), `read-only` (panels and explorers), `comment-sicko` (`/no-comments`).
