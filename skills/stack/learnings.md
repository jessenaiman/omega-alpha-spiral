# learnings

- In this repo, "wire the boot" means: confirm the intro's continue path (`#os-enter-ts`) leads into the first stage through ONE boot module (BootScene, studio-document-driven). Old Branch BootScene story-hardcoded the dialogue; main's consumes the studio document. Merge direction: main wins for BootScene/chapter flow.
- Windows line endings churn the entire file diff (`--ignore-cr-at-eol` shows the real change); don't commit a whitespace-only rewrite, resolve to one EOL style first.
