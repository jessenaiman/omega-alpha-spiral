# Floor Two — Shadow design card

Status: proposed design for owner review. The concept image is a composition reference, not a collision map or an approved runtime frame.

## Sources and fixed decisions

- [Approved sparse Stage One starting point](stage-1-atari-3d-starting-point.png), [approved six-frame era progression](era-progression-reference-draft.png), and [approved Dreamweaver geometry identities](dreamweaver-geometry-stages-1-3.png).
- [New Shadow concept](floor-2-shadow-concept.png) carries the first image's sparse code-block kit into a more diagonal room. Its exact wall placements are illustrative.
- [Official NetHack scene](<../../project-management/official%20game%20docs%20(read-only)/chapter-zero-stages/stage_2/nethack-scene.md>) fixes the three sequential rooms, Shadow as the second owner, and this room's object alignment: Chest to Ambition, Door to Shadow, Monster to Light. The owner's later decisions require three physical exits and geometry that changes navigation.
- The [Shadow voice profile](../../src/dialogue/Shadow.omd) supplies amber, angular spatial text and an uneven typing rhythm. Keep authored lines in the dialogue studio format.

## Three missed design ideas corrected here

1. **A visible history of Omega building the game.** Floor One established sparse Atari-like 3D blocks, but did not yet show the _same_ pieces being revised over time. Floor Two keeps those bars, pillars, door frame, hero, and dark field. Shadow rotates and cuts them; small patches of square raster detail appear only at joins. It is one graphics-era step, not a new stone environment or a global pixel filter.
2. **Dreamweaver geometry as a playable decision.** A diagonal silhouette alone would repeat Floor One's choice pattern. Shadow's oblique barriers alter sightlines, walking distance, and approach order. The three objects have three genuinely separate, reachable exits, and visible blockers must match collision. Small seeded shifts vary the route without changing the left/center/right choice identity.
3. **One continuing, ambiguous story rather than a room reset.** Floor One's choice must carry hidden alignment into Shadow's room. Each selected object triggers only its aligned Dreamweaver's authored voice, then its own exit leads to Ambition's room with the same lone hero and state. Unchosen paths can leave faint traces, but the Dreamweavers' private escape argument stays buried. A stage-complete panel or restart key is not the intended onward journey.

## Player promise and loop

A lone hero explores a rearranged revision of a familiar code world. Every 5–30 seconds the player reads a new angle, moves around a block, or uncovers one of the three symbolic objects. The immediate goal is to choose an object and cross its corresponding exit. A telegraphed, sliding code seam intermittently closes the shortest diagonal shortcut; it always leaves a visible detour and initially causes no damage. The Monster remains the official scene's basic automatic fight when chosen; damage, loss, and retry rules need separate gameplay design before implementation.

The hero enters at the broad south gap. Chest and its exit occupy the left/northwest route; the authored Door and its exit are centered/north; the Light-aligned guardian and its exit occupy the right/northeast route. Chest is easier to reach but initially harder to identify. The Door is recognizable from Floor One, with a short route briefly interrupted by the seam. The Monster is visible early through a diagonal sightline, with cover that lets the hero approach before committing. No branch is a trap or a decorative dead end.

```text
     CHEST EXIT       DOOR EXIT       MONSTER EXIT
          C                D                 M
           /       / seam |        angled \
      left approach   central gap     right approach
            \             |             /
                    ENTRY / hero
```

## Visual and interaction rules

- Fixed 2.5D top-down action-RPG camera, following one readable hero. The map extends beyond one viewport; low walls preserve route visibility. No full-carpet tile floor or orthogonal Pac-Man maze.
- Reuse simple extruded bars, slit pillars, square debris, and the Blender-authored portal. Rotate portal fragments on the ground to show reassembly. Reserve stepped curves for Ambition's Floor Three.
- Inherited cyan edges remain; Shadow's amber appears on joins, prompts, and glyphs. Selective CRT jitter or disintegrating code belongs to distant fragments and choice thresholds. The hero, traversable paths, and interaction affordances stay stable and sharp.
- The Door asks its official cryptic question, the Chest yields its official ambiguous message, and the Monster initiates the official basic encounter. Each branch uses the dialogue studio's authored event and aligned voice; geometry and light react to the event without hard-coded duplicate prose.
- Interaction identifies a candidate choice; crossing that branch's exit commits the hidden alignment result and transitions to Floor Three. The exit must be traversable with keyboard and controller. A fresh Floor Two entry may shift wall pieces slightly, but all three routes remain reachable.

## Review gate

The concept passes design review when the owner can see a clear lone hero, a recognizable inherited kit, restrained era progression, Shadow's diagonal route identity, and three separate exits. A later playable pass must prove real movement/collision, all branch crossings, dialogue ownership, and retained choice state. The image alone proves none of those runtime behaviors.

## Concept comparison

- [Route composition study](floor-2-shadow-concept.png): clearly separates the three landmarks, but the fork is too balanced and the wall count is high for this early era.
- [Sparse revision](floor-2-shadow-sparse-variant.png): closer to the approved Stage One construction density and more open to exploration, but its scattered pieces are not yet a deliberate traversable route.
- Build target: the sparse revision's negative space with the first study's readable choice landmarks, arranged as the unequal routes in this card. Neither image is an approved collision layout.

## Two authored NixieFX effects

The [Shadow NixieFX project](shadow-vfx-project/README.md) contains two editable and exported Three-compatible effects. `shadow-syntax-ash` sheds sparse square byte fragments only from repaired code-bar joins. `shadow-route-splice` bursts across the diagonal seam as a 250 ms warning before visible geometry and collision move together. These are world effects driven by the Floor Two scene state, not a full-screen CRT filter. Keep the hero, floor routes, dialogue, and three exits sharp. The exported assets exist; live-scene integration and motion review remain pending.
