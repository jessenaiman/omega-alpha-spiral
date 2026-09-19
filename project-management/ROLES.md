---
tags: [omega-spiral, omega-spiral/setup]
---
# Agent Roles

This file defines routing vocabulary only. Activate the applicable owning workflow or delegation skill first: a relevant `threejs-*` skill, `using-superpowers`, or `setup-matt-pocock-skills`. The activated skill is the single source of truth for role division, worker count, interfaces, and verification ownership.

Models change. Select a model from the current user-provided model list only after activating the owning skill. Do not preserve model or provider choices here.

## Agent Types

- **Lead/director:** owns the requested outcome and integrates delegated results.
- **Investigator:** produces evidence, constraints, and a bounded recommendation without changing the product.
- **Builder:** delivers an accepted implementation within an explicit file boundary.
- **Visual/asset specialist:** delivers reviewed visual, audio, or three-dimensional assets against the creative brief.
- **Verifier:** independently tests the result and reports concrete defects and evidence.
- **Decision router:** identifies the owning workflow and surfaces decisions that require the user.

These are outcome types, not persistent identities. The design owner decides creative and product direction. Agents establish facts, implement approved direction, and present unresolved choices without deciding them for the user.

## Premium
We use a lot of tokens and that's why you choose and delegate carefully. 
## Long Context 

Use this for holding large epics of tasks and delegating the project management

- OpenAI, use sparingly, deepseek v4.1 does a better job of following directions and being reminded
- deepseek/deepseek-v4.1-flash
- xiaomi/mimo-v2.5 : use for focused tasks and delegating teams of luna agents 
- 

## Cheap and Free Model Guidelines

These are where you should start. A cheap or free model creates a starting place to iterate from. When delegating to any model they should be audited, including the agent updating this article. 

**When to use cheap or free models:**
- auditing with official skill instructed commands
- project requirement gathering
- scaffolding new work so you can watch how it's done and then fix how it's not
- clarification questions should be delegated to the obsidian task board and written by free or cheap models

#### Short Attention high Precision 
- prism-ml/ternary-bonsai-2-27b
	- Bonsai 2 27B is a 27B-parameter reasoning model from PrismML derived from Qwen3.8-27B. It supports coding, mathematics, tool calling, and image understanding with a 262K-token context window. Ternary compression shrinks the language-model weights to roughly 8.5 GB while retaining 98.2% of the base model's average score across PrismML's 14 thinking-mode benchmarks, enabling efficient inference on consumer hardware. The model thinks by default and defaults to xhigh reasoning effort.
- typesafe/jev-1.13
	- Jev is a structured decision model from TypeSafe, and the first of its System One models. System One models make fast, structured decisions for software, returning a typed choice rather than free-form text. It is suited for routing, classification, and other decision points inside an application where a fast, predictable answer matters more than generated prose.

#### Long Context
- deepseek/deepseek-v4-flash

## Free
Rotate and divide free models


- nex-agi/nex-n2.5-pro:free
- nex-agi/nex-n2.5-mini:free
- nvidia/nemotron-3-ultra-550b-a55b:free
#### Vision

- inclusionai/ling-3.0-flash-vl:free

## Work Systems

GitHub Issues owns executable work, acceptance criteria, and status. Obsidian owns creative brainstorming and review.

## Delegation

1. Activate the owning skill.
2. Consult the current user-provided model list.
3. Choose the agent type and model for the bounded outcome.
4. Define the file boundary, input, output, and acceptance criteria.
5. Delegate according to the activated skill.
6. Independently verify according to the activated skill.
7. Report the Skill Trace on GitHub.

Every delegated agent activates Caveman for chat output:

- `/caveman full`: use for normal delegated work where concise reasoning must remain readable.
- `/caveman ultra`: use for narrow, well-specified work where only essential facts and results are needed.

Caveman applies to chat output only. Documents, issues, code, comments, and other persisted human-facing artifacts use normal prose.
