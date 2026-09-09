---
name: setup-pstack
description: Check pstack skill discovery and the tools needed for a project's workflow. Use for `/pstack:setup-pstack`, "configure pstack", or troubleshooting pstack readiness in Claude Code.
---

# Setup pstack

This is an optional readiness check. pstack works with the model and effort
selected in Claude Code and has no model setup step. Do not enumerate models,
request role assignments, or change Claude Code settings.

## Check readiness

1. Confirm that `pstack:poteto-mode` and the skills relevant to the user's
   task appear in the available skills. If they are missing, report which
   skills are missing and check the plugin's installation with
   `claude plugin list` in Bash or `/plugin` in the session. Do not claim the
   plugin is ready merely because this file is readable. After an install or
   update, a new session may be needed to load the changed skills.
2. Inspect the project's instructions and existing verification entry points.
   Identify the command or `verify-*` skill that exercises the real surface.
   If none exists, offer `/pstack:create-verification-skill` once. Its absence
   does not block work that can be verified directly.
3. Check only capabilities needed for the requested workflow. The `Agent` tool
   matters for independent review; Claude in Chrome or a browser MCP matters
   for UI verification; Bun matters for the bundled helpers; a forge CLI
   matters for PR operations. A missing optional tool is a limitation for that
   workflow, not a reason to block all pstack skills. Use a supported
   alternative when available and describe any verification gap.
4. Summarize what is ready, the relevant missing capabilities, and the next
   useful workflow. If no project or task is selected, confirm skill
   discovery and leave project-specific checks until they are relevant.

## Existing installations

Older ports used a pstack model file or required a particular model. Neither
is used now. Do not read, create, migrate, or delete that obsolete state as a
prerequisite to setup. Leave user-owned files and Claude Code settings alone.
