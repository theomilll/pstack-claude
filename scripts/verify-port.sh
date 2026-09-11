#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
plugin="$root/plugins/pstack"
helpers="$plugin/skills/poteto-mode/scripts"

fail() {
	printf 'verify-port: %s\n' "$1" >&2
	exit 1
}

count_files() {
	find "$1" "${@:2}" | wc -l | tr -d ' '
}

expect_count() {
	local label=$1 actual=$2 expected=$3
	[ "$actual" = "$expected" ] || fail "$label: expected $expected, found $actual"
}

python3 -m json.tool "$root/.claude-plugin/marketplace.json" >/dev/null
python3 -m json.tool "$plugin/.claude-plugin/plugin.json" >/dev/null

expect_count skills "$(count_files "$plugin/skills" -mindepth 2 -maxdepth 2 -name SKILL.md)" 46
expect_count playbooks "$(count_files "$plugin/skills/poteto-mode/playbooks" -maxdepth 1 -type f -name '*.md')" 23
expect_count principles "$(count_files "$plugin/skills" -mindepth 1 -maxdepth 1 -type d -name 'principle-*')" 23
expect_count guides "$(count_files "$plugin/docs/guide" -type f)" 17
expect_count helpers "$(find "$helpers" -path '*/node_modules' -prune -o -type f -print | wc -l | tr -d ' ')" 20
expect_count agents "$(count_files "$plugin/agents" -maxdepth 1 -type f -name '*.md')" 1

python3 - "$root" <<'PY'
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
market = json.loads((root / ".claude-plugin/marketplace.json").read_text())
plugin = json.loads((root / "plugins/pstack/.claude-plugin/plugin.json").read_text())
[entry] = market["plugins"]
assert entry["name"] == plugin["name"] == "pstack", (entry["name"], plugin["name"])
assert entry["source"] == "./plugins/pstack", entry["source"]
assert entry["version"] == plugin["version"], (entry["version"], plugin["version"])
PY

if command -v claude >/dev/null 2>&1; then
	claude plugin validate "$root"
	claude plugin validate "$plugin"
else
	printf 'verify-port: claude CLI not found; skipping manifest validation\n' >&2
fi

for skill in "$plugin"/skills/principle-*/SKILL.md; do
	grep -q '^user-invocable: false$' "$skill" || fail "$(basename "$(dirname "$skill")") is visible in the slash menu"
done
for skill in "$plugin"/skills/*/SKILL.md; do
	grep -q '^disable-model-invocation: true$' "$skill" || fail "$(basename "$(dirname "$skill")") is not explicit-only"
done
[ ! -e "$plugin/hooks" ] || fail 'the startup hook is back; explicit-only skills cannot honor it'
grep -q '^paths: ' "$plugin/skills/typescript-best-practices/SKILL.md" || fail 'typescript-best-practices lost its paths scope'
grep -q '^disallowedTools: Edit, Write, NotebookEdit$' "$plugin/agents/read-only.md" || fail 'read-only agent does not drop the edit tools'
if rg -n '^(model|effort):' "$plugin/agents" "$plugin/skills" -g '*.md'; then
	fail 'an agent or skill pins an execution setting'
fi

banned='(codex|CODEX_HOME|CODEX_THREAD_ID|\.agents/|spawn_agent|followup_task|wait_agent|interrupt_agent|list_agents|openai\.yaml|allow_implicit_invocation|pstack-models|codex-rescue|pstack:poteto-agent|pstack:comment-sicko|\.cursor/|\$(poteto-mode|arena|how|why|no-comments|architect|swarm|create-verification-skill|unslop|interrogate|technical-writing|tdd|recall|teach|setup-pstack|maintain-verification-skill|show-me-your-work|reflect|automate-me|figure-it-out|bro|blast-radius|skill-creator)\b)'
if rg -n -i --glob '!**/node_modules/**' "$banned" "$plugin/skills" "$plugin/docs" "$plugin/agents"; then
	fail 'Codex or legacy contract remains in a skill, guide, agent, or hook'
fi

node --test "$root/scripts/check-model-policy.test.mjs" "$root/scripts/check-plan.test.mjs"
node "$root/scripts/check-model-policy.mjs" "$root"

bash -n "$helpers/worktree-audit.sh"

(
	cd "$helpers"
	bun install --frozen-lockfile
	bun test orch watch-pr
	bun run typecheck
)

printf 'verify-port: all checks passed\n'
