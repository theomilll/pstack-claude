---
name: setup-pstack
description: Configure which models pstack uses per role. Detects the models available to the Agent tool and the codex plugin, then writes an always-loaded rule that overrides the skill defaults. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack

Write `~/.claude/rules/pstack-models.md`, a user-level rule Claude Code loads into every session, that sets pstack's model per role. The skills read it and fall back to their inline defaults when a line is absent, so this is an override layer, not a requirement.

## Steps

### 1. Detect available models

The values a role can take:

- A Claude alias the Agent tool accepts in its `model` field: `fable`, `opus`, `sonnet`, `haiku`. These are always valid on Claude Code; which ones the user's plan can run is what you confirm here. Never write an alias the user has not confirmed they can use.
- `gpt-5.6-sol`, which runs through the `codex` plugin (`subagent_type: "codex:codex-rescue"`). Valid only when that plugin is installed; check with `claude plugin list` in Bash and look for `codex@openai-codex`.
- `inherit-parent` or `auto`, always valid. Both mean the role runs on the parent session model (omit Agent `model`).

If you cannot detect the user's entitlements, ask them which aliases they have. Never write a real alias you have not confirmed is available.

### 2. Load current state

The default role-to-model mapping is the rule shape shown in step 5 below. If `~/.claude/rules/pstack-models.md` already exists, read it and treat its values as the current choices. Otherwise start from those defaults.

### 3. Map and confirm

Show every role with its current model, marking any value not in the detected set as needing a choice. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` as the options. Prefer AskUserQuestion over free text. For panel roles (how critics, arena runners, architect runners, interrogate reviewers) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it whose model family differs from the parent's when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

Roles that need this session's MCP servers (`why investigators`, `why synthesizer`, `reflect tooling`, `reflect judgment, divergent, synthesizer`) must be Claude aliases; `codex:codex-rescue` cannot see them. Say so if the user picks `gpt-5.6-sol` there.

### 4. Validate

Every value written must be in the detected set; `inherit-parent` and `auto` always pass. If a chosen value is not available, stop and ask again. A rule pointing at a model the user cannot use breaks every delegation that reads it.

### 5. Write the rule

Write `~/.claude/rules/pstack-models.md` with one line per role, using the same labels poteto-mode uses. Create `~/.claude/rules/` if it does not exist. Overwrite the whole file so re-runs stay idempotent. Rule files without a `paths` frontmatter key load unconditionally, so no frontmatter is needed. Shape:

```
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# Values: a Claude alias (fable, opus, sonnet, haiku) goes in the Agent `model` field; `gpt-5.6-sol` runs as `subagent_type: "codex:codex-rescue"` with no `model`; `inherit-parent` or `auto` runs the role on the parent session model (omit Agent `model`). Alias entries in a panel list still count toward its fan-out.
feature, refactoring: gpt-5.6-sol
bug-fix: fable
perf-issue: fable
hillclimb: fable
judgment and prose: fable
hardest tasks: fable
how explorer: gpt-5.6-sol
how explainer: fable
how critics: fable, gpt-5.6-sol, opus
why investigators: opus
why synthesizer: fable
reflect tooling: opus
reflect judgment, divergent, synthesizer: fable
arena runners: fable, gpt-5.6-sol, opus
arena cross-judge pool: fable, gpt-5.6-sol, opus
swarm workers: gpt-5.6-sol
architect runners: fable, gpt-5.6-sol, opus
interrogate reviewers: fable, gpt-5.6-sol, opus
```

### 6. Confirm

Tell the user the rule was written and that it applies to new sessions. Re-running this skill updates it.

### 7. Offer a verification skill (optional)

Check whether the project has a way to drive the real app for proof (a `verify-*` skill, or an existing harness). If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `/create-verification-skill` (resolves wherever pstack is installed — workspace, user, or plugin). On no, move on without pushing.
