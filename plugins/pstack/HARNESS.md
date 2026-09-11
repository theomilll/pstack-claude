# Claude Code harness

pstack's 23 playbooks and 23 principles stay. Only the harness call sites
change.

Sources: upstream pstack (`cursor/plugins` `pstack/`, v0.15.0,
`cursor/plugins@71ed0d1`), the Codex port this repo started from
(`theomilll/pstack-codex@b017d7b`), and the Claude Code docs for plugins,
skills, subagents, hooks, and the tools reference.

## Verdict

The discipline ports. The Codex plugin runtime does not. Install this repo as
a Claude Code plugin. `.codex-plugin`, `agents/openai.yaml`, Codex session
paths, and Codex wake mechanisms are gone. No model is named anywhere in the
distribution. Children inherit the session's model and effort.

## Mapping: pstack need -> Claude Code primitive

| pstack need | Codex port | Claude Code |
|---|---|---|
| Skill router | `$<name>` | `/pstack:<name>`, typed by the user. The bare `/<name>` also resolves when no other plugin claims it. Every skill is `disable-model-invocation: true`, so Claude never picks one from its description and the Skill tool is blocked on them. A skill that routes to a sibling reads `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md`. |
| Plugin install | `codex plugin marketplace add`, `codex plugin add` | `/plugin marketplace add theomilll/pstack-claude` then `/plugin install pstack@pstack-claude`. |
| Plugin manifest | `.codex-plugin/plugin.json` | `.claude-plugin/plugin.json`. This repo is a marketplace root (`.claude-plugin/marketplace.json`); the installed plugin lives at `plugins/pstack/`. |
| Startup reminder | `hooks/hooks.json` `SessionStart` | Not shipped. Explicit-only skills cannot honor a reminder to invoke `poteto-mode`; the user types it. |
| Spawn a child | `spawn_agent` | `Agent` with `description`, `prompt`, `subagent_type`, and optionally `isolation`. Omit `model`. |
| Read-only child | No-edit brief | `subagent_type: "pstack:read-only"`, the one agent this plugin installs. It drops `Edit`, `Write`, and `NotebookEdit` and keeps MCP. |
| Writing child | Normal subagent told to use `$poteto-mode` | `general-purpose`, told to read `${CLAUDE_PLUGIN_ROOT}/skills/poteto-mode/SKILL.md` or the routed skill's file first. |
| Resume or steer a child | `followup_task`, `send_message`, `list_agents`, `interrupt_agent`, `wait_agent` | `SendMessage` to continue, `ListAgents` to inspect, `TaskStop` to stop. Completion arrives as a task notification; `/tasks` lists background work. |
| Execution settings | Inherit the Codex model and reasoning effort | Inherit the session's model and effort. No `model` on any spawn, no per-role configuration, no availability gate. |
| Setup | `$setup-pstack` readiness check | `/pstack:setup-pstack`, the same check. It never writes settings. |
| Worktree isolation | Coordinator-created worktree per writer | `isolation: "worktree"` on the `Agent` call. Claude Code creates it under `.claude/worktrees/` from the default branch. |
| Ask the human | Host's structured input tool | `AskUserQuestion`. |
| Wake / recurring | Heartbeat automation or watcher task | `/loop` (omit the interval to self-pace). `Monitor` for event wakes such as `watch-pr` output. `/schedule` for cloud routines. |
| Skill authoring | Codex skills reference, `agents/openai.yaml` | Claude Code skills reference. Invocation policy is frontmatter: `disable-model-invocation`, `user-invocable`, `paths`. `claude plugin validate <dir>` checks it. |
| Code cleanup | Deliberate simplification pass | Built-in `/simplify` before commit. `/pstack:no-comments` before review, `/pstack:unslop` for prose. |
| Drive the real surface | Verification skill, then shell or browser tools | Verification skill, then Bash for CLI surfaces and Claude in Chrome or a browser MCP for UI. |
| Skill directories | `.agents/skills/`, `~/.agents/skills/` | `.claude/skills/`, `~/.claude/skills/`. |
| Transcripts | `${CODEX_HOME}/sessions/`, exact thread id only | `~/.claude/projects/<project-slug>/<session-id>.jsonl`; subagents under `<session-id>/subagents/`. Repo-partitioned, so `recall`, `automate-me`, and the worktree audit mine the active slug. |
| Session pickup | Known Codex task id | `claude --resume <session-id>`, or the transcript path above. |
| MCP discovery | Host tool search for `mcp__` | `ToolSearch` with query `mcp__`, or `claude mcp list`. |
| Agent store | `${CODEX_HOME}/pstack-codex/projects/<repo-fingerprint>/` | `~/.claude/pstack/<project-slug>/`, "the store". `docs/` for plans, `orchestrate/` for orchestration state. |
| Plugin files at runtime | `<pstack root>` is the installed plugin root | `${CLAUDE_PLUGIN_ROOT}`, substituted inside skill bodies. Fallback: `ls -d ~/.claude/plugins/cache/pstack-claude/pstack/*/`. |
| Plugin logo | `interface.logo` | Not shipped. Claude Code `plugin.json` has no logo field. |
| Skill path filter | Not shipped | `paths: "**/*.ts,**/*.tsx"` on `typescript-best-practices`, restored from upstream. |
| Explicit-only skill | `agents/openai.yaml` `allow_implicit_invocation: false` on all 46 skills | `disable-model-invocation: true` on all 46 skills, as upstream ships them. Routes between skills are file reads. |
| Hidden leaves | All skills listed | `user-invocable: false` as well on the 23 `principle-*` skills. The slash menu hides them; `poteto-mode` reads them from disk. |

## Default delegation shape

Use these contracts unless a playbook says otherwise.

```text
Agent
  description: <3-5 words>
  prompt: <full brief, file pointers not inlined dumps>
  subagent_type: general-purpose | pstack:read-only
  isolation: worktree            (any concurrent writer)
```

- Code-writing delegates. `general-purpose`, told to invoke
  `/pstack:poteto-mode` or the relevant routed skill first. Give it a bounded
  brief, explicit acceptance checks, and `isolation: "worktree"` if another
  writer could touch the same tree.
- Read-only explorers, judges, critics, and verifiers. `pstack:read-only` with
  an explicit no-edit brief. These lanes may still read code, run read-only
  shell commands, and use MCP tools.
- Independent verify. A fresh `pstack:read-only` subagent with a
  self-contained brief. The verifier inspects and reports. It does not land
  code changes.

## Execution settings

Claude Code owns the model and effort. pstack delegates inherit the session's
settings, with no per-role overrides and no model availability gate. Setup is
not a prerequisite for using a skill. A subagent default the user configured
themselves stays theirs.

Use a fresh context for independent review. Independence comes from fresh
context and a separate review brief; a model switch is not part of the
workflow.

## State and transcript safety

Task notifications, `ListAgents`, and `/tasks` are authoritative for live work. The durable TSV and JSON store is bookkeeping, not a second scheduler. Each concurrent actor owns separate records or publishes an immutable completion pointer; readers aggregate.

Transcript-aware skills stay inside the active project's slug. Session-scoped skills (`reflect`, `show-me-your-work`, `session-pickup`, `eval`) resolve one exact session file. History-mining skills (`recall`, `automate-me`) read the slug's sessions by modification time within the named window. The worktree audit scans the slug for the newest chat that touched each worktree.

The GitHub PR watcher retains support for Cursor Bugbot automation markers because those comments can exist on a PR regardless of the local agent harness. This is source compatibility, not a runtime dependency.

## Explicit-only invocation

Upstream 0.15.0 ships `disable-model-invocation: true` on all 46 skills and the Codex port ships `allow_implicit_invocation: false` on all 46. Port 2.1.0 matches. Claude Code then drops the descriptions from context and blocks the Skill tool on them, including a call made from inside another skill, so every route between skills is a read of `${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md`. `poteto-mode` states the rule once; skills that route on their own (`teach`, `architect`, `blast-radius`, `recall`, `technical-writing`, `show-me-your-work`, `no-comments`, `figure-it-out`, `principle-prove-it-works`) carry one line each. `make-bot-ui` is not in this port.
