# Creative Workflow

Obsidian develops intent. GitHub Issues executes it.

## 1. Capture

Create a note from `Templates/TASK.md`. Record the idea, owner notes, open questions, and conditions that would make it ready for a specification. Place it in **Ideas** on `BOARD.md`.

## 2. Shape

Gather references, sketches, alternatives, and feedback in the note. Move it to **Shaping** while its direction is being clarified. Put unresolved choices in **Decisions Needed**.

## 3. Prepare

Move the note to **Ready for /to-spec** when every listed ready-for-spec condition is met. This stage means the creative intent is clear enough to become executable; it does not mean implementation has started.

## 4. Publish

Run `/to-spec`. Publish the specification to GitHub Issues, add the GitHub link to the creative note, and move the note to **Published**.

GitHub now owns scope, acceptance criteria, dependencies, status, and completion.

## 5. Decompose when needed

Run `/to-tickets` against the published GitHub spec when implementation needs smaller tickets. Keep those tickets and their blocking relationships in GitHub.

## 6. Review creatively

Collect visual and interaction observations in `UI-REVIEW.md` or the relevant creative note. Promote actionable changes to GitHub instead of tracking execution on the Obsidian board.
