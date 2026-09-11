---
name: interrogate
description: "Use for \"interrogate\", \"adversarial review\", \"challenge this\", \"stress test this code\", \"find blind spots\", or \"tear this apart\". Multiple independent reviewers challenge changes from complementary angles."
disable-model-invocation: true
---

# Interrogate

Spawn three independent reviewers to adversarially review code
changes. Give every reviewer the same intent, diff, rubric, and code-quality
lens, plus one focus: correctness, maintainability, or adversarial edge cases.
Agreement across independent reviews helps prioritize investigation, but
shared blind spots can survive every pass. Judge each finding by its evidence;
a single reviewer can uncover a decisive bug.

The deliverable is a synthesized verdict. Do NOT auto-apply changes.

## Step 1, Determine Scope

Identify what to review from context:

- If the user points at specific files or a diff, use that
- If on a feature branch, run `git diff main...HEAD` (or the appropriate base branch) for the full changeset
- If the user's message references recent work, gather the relevant files

Package the diff (or file contents) plus any surrounding context files the reviewers need to understand the code.

## Step 2, State the Intent

Before spawning reviewers, state the intent explicitly. Derive this from:

- The user's message
- Commit messages
- PR description if one exists
- The code itself

Write one clear paragraph. If you're unsure about the intent, ask the user before proceeding.

## Step 3, Spawn Reviewers

Launch three reviewers in one message with the `Agent` tool, each a fresh
`pstack:read-only` subagent with an explicit no-edit brief. Follow `../poteto-mode/references/claude-delegation.md`.

| Reviewer | Additional focus |
|----------|------------------|
| A | Correctness and concrete execution paths |
| B | Maintainability and boundary design |
| C | Adversarial inputs and edge cases |

Read `references/reviewer-prompt.md` and fill in the template with:
1. The stated intent
2. The diff or file contents
3. The review rubric from `references/rubric.md`
4. The code-quality lens from `references/code-quality-review.md`

The same filled template goes to all reviewers, plus their assigned focus, so every reviewer applies the code-quality lens. Do not share other reviewers' findings before their independent passes finish.

## Step 4, Synthesize

As results come back, build a unified picture:

1. **Parse all findings** from the reviewers
2. **Identify agreement**. Note findings raised independently by multiple reviewers and verify the supporting evidence.
3. **Identify single-reviewer findings**. Assess their evidence with the same bar; vote count does not determine correctness.
4. **Deduplicate**. Reviewers may describe the same issue differently. Merge these and note which reviewers raised it.
5. **Note disagreements**. If one reviewer flags something and another explicitly says the opposite, that's useful context for the verdict.

## Step 5, Lead Judgment

You are the lead reviewer, a pragmatic senior engineer, not a neutral aggregator.

Read `references/lead-judgment.md` for the full framework.

Categorize every finding using these buckets:

- **Act on**. Real issues affecting correctness, security, or maintainability given the actual goals. These would block a real PR.
- **Consider**. Legitimate points, but you're not sure they outweigh the cost of addressing them right now. Worth the user's attention.
- **Noted**. Technically valid but not actionable. Context-dependent, premature optimization, or low-impact given the current stage.
- **Dismissed**. Wrong, nitpicky, or missing context. Brief explanation why.

For each finding, include:
- Which reviewer or reviewers raised it
- The category (act on / consider / noted / dismissed)
- A one-line rationale for the categorization

## Output Format

Present the verdict in this structure:

### Intent
> [The stated intent paragraph from Step 2]

### Reviewers
- Reviewer [label]: [focus], [N findings] (one bullet per reviewer)

### Act On
[Findings that should be addressed. For each: description, which reviewers raised it, why it matters.]

### Consider
[Findings worth thinking about. For each: description, which reviewers raised it, tradeoff involved.]

### Noted
[Valid but low-priority. Brief list.]

### Dismissed
[Rejected findings with brief rationale.]

### Agreement Map
[Where did reviewers agree, where did they diverge, and what does the pattern of agreement or disagreement tell us?]
