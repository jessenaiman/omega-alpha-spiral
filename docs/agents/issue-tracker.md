# Issue Tracker: GitHub

GitHub Issues in `jessenaiman/omega-alpha-spiral` are the sole executable work tracker. Use `gh` inside this clone or pass `--repo jessenaiman/omega-alpha-spiral`.

`project-management/` is for creative brainstorming, review, and project overview. It does not assign or track executable work. Promote approved creative direction to GitHub with `/to-spec`; break an approved spec into implementation slices with `/to-tickets`.

## Issue contract

Every executable issue must state:

- one owning workflow skill;
- required references;
- an exclusive or explicitly shared file boundary;
- acceptance criteria;
- exact verification commands or evidence;
- blockers and dependency links.

Activate the owning workflow skill before work begins. Before delegation, read `project-management/ROLES.md`. Choose a built-in agent type and model from the user's current available list. Never hard-code a model or provider.

Built-in subagents execute only issues whose scope and verification are complete and whose blockers are resolved.

## Worker trace

The worker posts an opening comment before editing. It names the owning skill, references read, file boundary, planned verification, and known blockers.

The worker posts a closing comment headed `## Skill Trace`. It records:

- owning skill and material workflow steps used;
- changed files;
- verification commands and observed results;
- acceptance status;
- remaining risks or blockers.

If an external service blocks completion, do not skip the step. Record the blocker and provide three viable completion routes, including requirements and trade-offs for each route.

## Operations

- Create: `gh issue create --repo jessenaiman/omega-alpha-spiral --title "..." --body-file <file>`
- Read: `gh issue view <number> --repo jessenaiman/omega-alpha-spiral --comments`
- List: `gh issue list --repo jessenaiman/omega-alpha-spiral --state open`
- Comment: `gh issue comment <number> --repo jessenaiman/omega-alpha-spiral --body-file <file>`
- Label: `gh issue edit <number> --repo jessenaiman/omega-alpha-spiral --add-label "..."`
- Close: `gh issue close <number> --repo jessenaiman/omega-alpha-spiral --comment "..."`

Use GitHub sub-issues and native issue dependencies where available. Otherwise, link slices from the parent issue and include `Blocked by: #<number>` in each blocked issue. A worker may start only when every blocker is closed and the issue carries `ready-for-agent`.

## Skill language

When a skill says "publish to the issue tracker," create a GitHub issue. When it says "fetch the relevant ticket," read the GitHub issue and its comments.

## Pull requests as a triage surface

PRs as a request surface: no. Pull requests deliver issue work; they do not replace issues.
