# Set up pstack

In this page you install the plugin, optionally check readiness, and run your
first task.

## Install the plugin

In a Claude Code session, run:

```text
/plugin marketplace add theomilll/pstack-claude
/plugin install pstack@pstack-claude
```

Claude Code confirms the plugin is installed. Skills invoke explicitly as `/pstack:poteto-mode`. The bare `/poteto-mode` also resolves when no other plugin ships a skill with that name. Every pstack skill is explicit-only. Claude never picks one from its description, so the slash form is how a skill starts. Once you invoke one, it loads the others it needs from disk.

## Optionally check readiness

You can start using the skills immediately after installation. For a readiness
check, run:

```text
/pstack:setup-pstack
```

[`/pstack:setup-pstack`](../../skills/setup-pstack/SKILL.md) checks that Claude Code can
discover the skills and that tools relevant to your task are available. It does
not select a model, check model availability, or write global configuration.

Choose your model and effort level in Claude Code. pstack uses inherited
settings without adding role configuration; any subagent default you set
yourself stays under your control.

## Accept the verification offer, or don't

At the end of setup, `/pstack:setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/pstack:create-verification-skill`](../../skills/create-verification-skill/SKILL.md).

Say yes and it writes `.claude/skills/verify-<app>/`, a project-local skill that teaches subagents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/pstack:create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

After installation or an update, a new session may be needed for Claude Code to
load the changed skills. Setup itself is not a prerequisite for your first task.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/pstack:poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

Watch the todo list. Its first items are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/pstack:poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. `/pstack:poteto-mode` is sticky. It stays on for the task until you opt out by saying so.

Next: [Route work through `/pstack:poteto-mode`](./02-poteto-mode.md).
