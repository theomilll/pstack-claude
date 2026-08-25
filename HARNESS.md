# Claude Code harness

pstack's 22 playbooks and 21 principles stay. Only harness call sites change.

Sources: upstream pstack (`cursor/plugins` `pstack/`, v0.14.3) and the Claude Code docs (`code.claude.com/docs`: plugins, skills, sub-agents, tools reference, memory, hooks). Tool names and fields below are from those docs and from a live Claude Code 2.1.x session, not from Cursor's `Task` schema.

## Verdict

The discipline ports. The Cursor plugin runtime does not. Install this repo as a Claude Code plugin. `.cursor-plugin`, `~/.cursor/rules/*.mdc`, Cursor `Task`, Cursor Cloud Agents, and Cursor Automations are gone.

## Mapping: pstack need → Claude Code primitive

| pstack need | Cursor | Claude Code |
|---|---|---|
| Slash skill / playbook router | `skills/<name>/SKILL.md`, `/name` | Same layout. Invoked as `/pstack:<name>`; the bare `/name` also resolves when no other plugin claims it. Frontmatter kept: `name`, `description`. Dropped: `mode`, `icon`, `color`, `reminder` (Cursor mode metadata) and `disable-model-invocation`, which on Claude Code makes the Skill tool refuse the skill outright and would break every route out of `poteto-mode`. The 21 `principle-*` leaves carry `user-invocable: false` instead: the model loads them, the slash menu hides them. |
| Mode reminder | `reminder:` frontmatter on `poteto-mode` | `hooks/hooks.json` `SessionStart` (startup, clear, compact) echoes the one-line reminder. Delete the file from the installed copy to opt out. |
| Plugin install | `/add-plugin pstack` | `/plugin marketplace add theomilll/pstack-claude` then `/plugin install pstack@pstack-claude`. Manifest is `.claude-plugin/plugin.json`; `skills/`, `agents/`, `hooks/` are auto-discovered. |
| Spawn a child | `Task` | `Agent`. Fields: `description`, `prompt`, `subagent_type`, `model`, `isolation`. |
| Background child | `run_in_background: true` | No field. Subagents run in the background and the parent gets a task notification when one finishes. |
| Wait for / resume a child | resume | `SendMessage` to the agent id to continue it with its context. A finished agent's report arrives as the notification. |
| Child type | `subagent_type: generalPurpose` | `general-purpose`. Plugin agents are `pstack:poteto-agent`, `pstack:comment-sicko`, `pstack:read-only`. Built-ins also include `Explore` and `Plan`. |
| Read-only child | `readonly: true` (also strips MCP) | `subagent_type: "pstack:read-only"`. Its frontmatter removes `Edit`, `Write`, `NotebookEdit`; MCP access stays. Skills that avoided readonly only to keep MCP now use it. |
| Agent mode child | `readonly: false` | `general-purpose` or `pstack:poteto-agent`. |
| Per-spawn model | Cursor slugs (`claude-fable-5-thinking-max`, …) | `model: fable \| opus \| sonnet \| haiku` on `Agent`. Omit to inherit the parent. |
| GPT model | `gpt-5.6-sol-max` | `gpt-5.6-sol` is not an Agent model. Route the role through `subagent_type: "codex:codex-rescue"` (the `codex@openai-codex` plugin) with no `model`; say "read-only" in the prompt when the role must not write. Without that plugin, run code roles on `opus` and drop `gpt-5.6-sol` from panels. From Bash, `codex exec` (`-s read-only` for investigation) is the same runtime. |
| Grok model | `grok-4.6-fast-xhigh` | Not available. Panels shrink from four to three (`fable`, `gpt-5.6-sol`, `opus`); fast code roles default to `gpt-5.6-sol`. |
| Per-role model config | `~/.cursor/rules/pstack-models.mdc`, `alwaysApply: true` | `~/.claude/rules/pstack-models.md`. Rule files without `paths` load into every session. Written by `/setup-pstack`. |
| Reasoning effort | slug suffix (`-max`, `-xhigh`) | Not on the Agent call. Plugin agents can pin `effort` in frontmatter; pstack leaves it to the session. |
| Worktree isolation / Cloud agent | `environment: "cloud"`, `cloud_base_branch` | `isolation: "worktree"` for any parallel writer (worktrees live under `.claude/worktrees/`). `isolation: "remote"` exists but is gated per account; pstack never assumes it. Playbooks say "background subagent in its own worktree" where upstream said "cloud agent". |
| Ask the human | `AskQuestion` | `AskUserQuestion`. |
| Wake / recurring | Cursor `/loop` | Claude Code `/loop` (same name; omit the interval to self-pace). |
| Skill authoring | Cursor built-in `create-skill` | No built-in. `playbooks/authoring-a-skill.md` plus the Claude Code skills reference, with `technical-writing` and `unslop` for prose. `plugin-dev:skill-development` (from `claude-plugins-official`) when installed. |
| Code slop strip | `cursor-team-kit` `/deslop` | Claude Code built-in `/simplify` before commit, `/no-comments` before review. |
| Drive the real surface | `cursor-team-kit` `control-ui` / `control-cli` | The project's `verify-<app>` skill from `/create-verification-skill`. Without one: CLI in Bash, browser through Claude in Chrome when connected. |
| Cursor's built-in babysit | routed away from | No equivalent; the clause is dropped. |
| Bugbot | Bugbot | Wording kept. Claude Code's `/security-review` is the closest built-in reviewer. |
| Graphite `gt` | `gt` | Unchanged. Optional if `gt` is on PATH; otherwise `gh` + git. |
| Skill directories | `.cursor/skills/`, `~/.cursor/skills/`, `~/.cursor/plugins/` | `.claude/skills/`, `~/.claude/skills/`, `~/.claude/plugins/cache/`. |
| Transcripts | `~/.cursor/projects/<slug>/agent-transcripts/<id>/<id>.jsonl` | `~/.claude/projects/<slug>/<session-id>.jsonl`; subagents at `<slug>/<session-id>/subagents/agent-<id>.jsonl`. `<slug>` is the working directory with every `/` turned into `-`, leading dash kept (`/Users/you/proj` → `-Users-you-proj`). Stay inside the active slug. |
| Session restart / pickup | Cursor restart, cloud-agent URL | Session end; `claude --resume <session-id>`. Background agents are listed in `/tasks`. |
| MCP discovery (`why`) | Cursor `mcps/` directory | MCP tools are `mcp__<server>__<tool>`; enumerate with `ToolSearch` or `claude mcp list`. |
| Benny automations | Cursor Automations pack | Dropped. Claude Code's equivalent is `/schedule` (cloud routines) plus plugin hooks; the pack was Cursor-runtime specific. |
| Agent store | per-agent store dir named in the system prompt | `~/.claude/pstack/<project-slug>/` ("the store"), created on first use. Plans go under `docs/`, orchestrate state under `orchestrate/`. |
| `/goal` | Cursor built-in standing objective | None. Playbooks write the objective at the top of the plan file and re-read it on every `/loop` tick. |
| Plugin files at runtime | `git show origin/main:pstack/skills/...` (plugin vendored in trunk) | `<pstack root>/skills/...`, the installed plugin directory `~/.claude/plugins/cache/pstack-claude/pstack/<version>/`. |
| Agent frontmatter | `is_background: true` | `background: true`, `model: inherit`, `disallowedTools`. Agent `name` must be lowercase-hyphen (`Comment Sicko` → `comment-sicko`). |

## Default spawn shape

```text
Agent
  description: <3-5 words>
  prompt: <full brief, file pointers not inlined dumps>
  subagent_type: pstack:poteto-agent | general-purpose | pstack:read-only | pstack:comment-sicko | codex:codex-rescue
  model: fable | opus | sonnet | haiku   (omit for codex:codex-rescue, inherit-parent, auto)
  isolation: worktree                    (any parallel writer)
```

Code-writing delegates: `pstack:poteto-agent` on the role's model, or `codex:codex-rescue` when the role's model is `gpt-5.6-sol`.
Read-only walks, reviews, and judges: `pstack:read-only`.
`/no-comments`: `pstack:comment-sicko`.
Independent verify: a fresh subagent on a different model family from the writer, in its own worktree. The verifier never writes the diff.

## Model resolution

1. Read the role's line in `~/.claude/rules/pstack-models.md` (it is already in context when the rule exists).
2. No line: the skill's inline default.
3. `inherit-parent` or `auto`: omit `model`.
4. A Claude alias: pass it as `model`.
5. `gpt-5.6-sol`: `subagent_type: "codex:codex-rescue"`, no `model`. Roles that need this session's MCP servers (all of `why` and `reflect`) cannot use it.
6. The `codex` plugin is absent: code roles run on `opus`; panels drop the entry.
