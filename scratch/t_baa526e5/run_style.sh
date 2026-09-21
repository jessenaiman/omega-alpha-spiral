#!/usr/bin/env bash
# Generate one style's 5 motion frames with the installed Codex CLI's native
# OpenAI image_gen tool (provider ruling: OpenAI/ChatGPT only, model gpt-5.6-luna).
set -u
REPO="C:/SpiralDrive/omega-alpha-spiral"
STYLE="$1"
PROMPT_FILE="$REPO/scratch/t_baa526e5/prompt-style-${STYLE}.txt"
LOG="$REPO/scratch/t_baa526e5/codex-${STYLE}.log"
REF="assets/intro/optical-variations/optical-a-distant.png"

cd "$REPO" || exit 9
echo "START $(date -u +%FT%TZ) style=$STYLE" > "$LOG"
codex exec \
  -C "$REPO" \
  -i "$REF" \
  -m gpt-5.6-luna \
  -s workspace-write \
  --color never \
  -o "$REPO/scratch/t_baa526e5/codex-${STYLE}-last.txt" \
  -- "$(cat "$PROMPT_FILE")" >> "$LOG" 2>&1
echo "EXIT=$? $(date -u +%FT%TZ) style=$STYLE" >> "$LOG"
