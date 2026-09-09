### Authoring or modifying a skill

**You own the skill's voice.**

1. Write the `SKILL.md` per the Claude Code skills reference (https://code.claude.com/docs/en/skills): `name` matches the directory and `description` says what it does and when to use it. Invocation policy is frontmatter: `disable-model-invocation: true` for user-only skills, `user-invocable: false` for model-only leaves, `paths` for file-scoped activation. Sibling files (`references/`, `playbooks`) resolve relative to the skill directory. Prose follows the **technical-writing** and **unslop** skills. Run `claude plugin validate <skill-dir>` before opening the PR.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve.
3. Test cases if structural. Skip if subjective.
4. Run **Opening a PR**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
