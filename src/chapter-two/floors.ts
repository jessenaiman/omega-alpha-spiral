export type ObjectKind = 'door' | 'monster' | 'chest';
export type Guide = 'Light' | 'Shadow' | 'Ambition';
export type FloorId = 'echo' | 'guardian' | 'gauntlet' | 'revision' | 'threshold-echo' | 'omniscient' | 'mirror-one' | 'mirror-two' | 'mirror-three';
export type FloorDefect = 'none' | 'scanline' | 'ghosttext' | 'flicker';
export interface RoomObject { kind: ObjectKind; x: number; z: number; alignment: Guide; text: string; voiceLine?: string }
/** Standing mirror prop on never-go-alone floors: whisper-triggered, not an exit. */
export interface MirrorProp { x: number; z: number; name: string; line: string }
export interface DescentFloor {
  id: FloorId;
  owner: Guide;
  /** Script unlocks the attack action on this floor. */
  attacksAllowed: boolean;
  /** Strikes the floor's monster needs; 0 means combat is impossible here. */
  attacksRequired: number;
  /** Seconds before an unresolved fight defeats the player. */
  fightSeconds: number;
  /** Visual clarity step, rising per floor as Omega's output improves. */
  visualStep: number;
  /** Deliberate defect that demonstrates remaining machine difficulty. */
  defect: FloorDefect;
  /** Announced in the rewrite preview when this floor is incoming. */
  intro: string;
  /** Turn-menu combat, used by never-go-alone floors onward. */
  companions?: 0 | 1 | 2 | 4;
  /** Right-panel timer for staged fighting. */
  turnTimerSeconds?: number;
  /** Standing mirrors the player may inspect before taking an exit. */
  mirrors?: MirrorProp[];
  /** Omega cuts in instead of a normal victory on this fight. */
  omegaInterrupt?: string;
  objects: RoomObject[];
}

// Data, not executed pseudocode; authored from the stage_2/3 source script:
// "never go alone" — companions arrive over the three floors.
// Floors 4-6 = never-go-alone: Party Companion journey with real allies.
export const DESCENT_FLOORS: DescentFloor[] = [
  {
    id: 'echo', owner: 'Light', attacksAllowed: false, attacksRequired: 0, fightSeconds: 1.2, visualStep: 1, defect: 'none',
    intro: 'The first floor reboots. The script has grown.',
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Light', text: 'The door is half-labeled. ÆTHER. It wants something in exchange.', voiceLine: 'You seek the path. Good. Doors always want something.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Ambition', text: 'A shape circles in the static. It looks hungry.', voiceLine: 'Fight it. If you die, I’ll find another. If you win… maybe you’re useful.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Shadow', text: 'Something hums beneath the floorboards, where no chest was drawn.', voiceLine: 'Empty? Full? Does it matter if you believe it’s treasure?' },
    ],
  },
  {
    id: 'guardian', owner: 'Shadow', attacksAllowed: true, attacksRequired: 1, fightSeconds: 1.2, visualStep: 2, defect: 'none',
    intro: 'REWRITE APPLIED. A new action exists: F. Nothing explains it.',
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Shadow', text: 'The door here isn’t drawn. A gap in the wall lets light through.', voiceLine: 'Heh. Doors lie. But so do I. Try it anyway.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Light', text: 'Something pale stands where the guardian was written.', voiceLine: 'You face the shadow. Brave… but remember: even heroes bleed.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Ambition', text: 'The chest is wrapped in chain you swear appeared between floors.', voiceLine: 'Hope won’t save you. But if it distracts Omega, take it.' },
    ],
  },
  {
    id: 'gauntlet', owner: 'Ambition', attacksAllowed: true, attacksRequired: 2, fightSeconds: 0.9, visualStep: 3, defect: 'scanline',
    intro: 'REWRITE APPLIED. Output sharpens. Nothing falls to one strike.',
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Ambition', text: 'This door has a keyhole shaped backwards.', voiceLine: 'A door means a lock. And locks mean someone doesn’t want you through.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Shadow', text: 'The imp is stitched out of margin notes.', voiceLine: 'Ooh, you picked the bitey one! Let’s see if it likes you back.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Light', text: 'The chest breathes. You decide not to think about that.', voiceLine: 'You trust what’s hidden. Wise. Hope is the last echo.' },
    ],
  },
  {
    id: 'revision', owner: 'Light', attacksAllowed: true, attacksRequired: 2, fightSeconds: 1.4, visualStep: 4, defect: 'none',
    // Companion floor 1 of never-go-alone: first real ally.
    intro: 'REWRITE. ROSTER CHANGES. Someone new walks beside you now.',
    companions: 1,
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Light', text: 'The new voice asks what you would never say out loud.', voiceLine: 'Two can keep a secret if one stops talking. Let’s find out which you are.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Shadow', text: 'The enemy script mirrors your own moves back at you.', voiceLine: 'It studied you. It is also studying me. Interesting.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Ambition', text: 'A second lantern inside. It lights nothing but itself.', voiceLine: 'Take it. Light that only lights itself is the best kind of lie.' },
    ],
  },
  {
    id: 'threshold-echo', owner: 'Shadow', attacksAllowed: true, attacksRequired: 3, fightSeconds: 1.5, visualStep: 5, defect: 'flicker',
    // Companion floor 2: turn-menu + timer, per stage-3 script.
    intro: 'REWRITE APPLIED. Time now exists. The menu has a clock in it.',
    companions: 1,
    turnTimerSeconds: 8,
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Shadow', text: 'Two doors share one frame. Both say ÆTHER.', voiceLine: 'Two doors. Pick wrong and I laugh. Pick right and I still laugh.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Light', text: 'The ally can hold it off — briefly — while you aim.', voiceLine: 'Hold it. I’ll hold it. But which of us is “it”, hm?' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Ambition', text: 'The chest contains a note Omega missed.', voiceLine: 'Not everything in the script gets written. Look for what Omega skips.' },
    ],
  },
  {
    id: 'omniscient', owner: 'Ambition', attacksAllowed: true, attacksRequired: 3, fightSeconds: 1.6, visualStep: 6, defect: 'ghosttext',
    // Companion floor 3: leader + follower, real-time; stage-3 cliffhanger.
    intro: 'REWRITE APPLIED. You are not alone anymore. Neither is it.',
    companions: 2,
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Ambition', text: 'The door opens onto a hallway that shouldn’t fit inside this.', voiceLine: 'Doors are for people who don’t know where they’re going. Do you?' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Shadow', text: 'It knows the ally’s name. You never gave one.', voiceLine: 'It read the script ahead. So did I. Neither of us liked the ending.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Light', text: 'Inside: the first chapter, heavily crossed out.', voiceLine: 'The crossed-out words are not gone. Nothing here is ever gone.' },
    ],
  },
  {
    id: 'mirror-one', owner: 'Light', attacksAllowed: true, attacksRequired: 9, fightSeconds: 1.2, visualStep: 7, defect: 'none',
    // Stage 3 beat 1-2: First Reflection + Wolf-Claw Hybrid test, party of 1.
    // The fight is impossible; the script pulls the player back to the mirrors.
    intro: 'REWRITE APPLIED. New stage. The walls hold mirrors that were never rendered before.',
    companions: 1,
    mirrors: [
      { x: -12, z: -10, name: 'Fighter', line: 'Look into the first mirror, Hero. See the strength you might wield.' },
      { x: -4, z: -10, name: 'Wizard', line: 'Ooh, go on then, pick your first echo. Don\u2019t pick boring, now!' },
      { x: 4, z: -10, name: 'Thief', line: 'Choose. Now. The code watches. We have little time.' },
      { x: 12, z: -10, name: 'Scribe', line: 'Choose your first reflection. What strength will you wield?' },
    ],
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Light', text: 'The door reflects a corridor that does not exist yet.', voiceLine: 'The reflection is not the road. It is the promise of one.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Ambition', text: 'A Wolf-Claw Hybrid flickers with static. It is the code testing you first.', voiceLine: 'Show it your strength. Or show it how you fall. Both teach.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Shadow', text: 'A chest made of frozen shimmer. Opening it feels like a choice.', voiceLine: 'Pick your first echo. Don\u2019t pick boring.' },
    ],
  },
  {
    id: 'mirror-two', owner: 'Shadow', attacksAllowed: true, attacksRequired: 9, fightSeconds: 1.2, visualStep: 8, defect: 'scanline',
    // Stage 3 beat 3-4: Second Reflection + two Code Fragments test, party of 2.
    intro: 'REWRITE APPLIED. The mirrors multiply. So does what waits between them.',
    companions: 2,
    mirrors: [
      { x: -12, z: -10, name: 'Wizard', line: 'The first echo is strong, but the path is dark. Choose your second reflection.' },
      { x: -4, z: -10, name: 'Thief', line: 'Okay, pick someone to back you up! Someone with a different trick!' },
      { x: 4, z: -10, name: 'Fighter', line: 'Choose speed, or magic to augment your strength. The code grows restless.' },
      { x: 12, z: -10, name: 'Scribe', line: 'The first echo stands ready. Choose your second. What do you need?' },
    ],
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Shadow', text: 'Two mirrored doors show the same corridor at different ages.', voiceLine: 'Same road, different ruin. Pick the age you can survive.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Light', text: 'The Hybrid returns, and two Code Fragments buzz around it.', voiceLine: 'The code adapts. We must adapt faster.' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Ambition', text: 'Inside the chest: a second mirror, small enough to carry.', voiceLine: 'Carry the mirror. One day you will need to check who is holding the pen.' },
    ],
  },
  {
    id: 'mirror-three', owner: 'Ambition', attacksAllowed: true, attacksRequired: 3, fightSeconds: 1.8, visualStep: 9, defect: 'flicker',
    // Stage 3 beat 5-6: Final Reflections, full party of 4, Code Guardian +
    // two Fragments; Omega interrupts regardless of the fight's outcome.
    intro: 'REWRITE APPLIED. Four mirrors. Four of you. One Guardian between here and whatever Omega fears you becoming.',
    omegaInterrupt: 'INTERFERENCE DETECTED... DREAMWEAVER ACTIVITY... INITIATING EMERGENCY RESET...',
    companions: 4,
    mirrors: [
      { x: -12, z: -10, name: 'Fighter', line: 'Two stand strong, but the echo grows louder. Choose your final reflections.' },
      { x: -4, z: -10, name: 'Wizard', line: 'Pick the last pieces! The final tricks! Let\u2019s see what this full crew can do!' },
      { x: 4, z: -10, name: 'Thief', line: 'Choose the final elements. The code trembles on the edge of collapse.' },
      { x: 12, z: -10, name: 'Scribe', line: 'Choose the final two reflections. The core of your echo party.' },
    ],
    objects: [
      { kind: 'door', x: -8, z: 0, alignment: 'Ambition', text: 'Beyond this door there is no next floor drawn. Only static, arranging itself.', voiceLine: 'Destiny is not beyond this door. But becoming is.' },
      { kind: 'monster', x: 0, z: 0, alignment: 'Shadow', text: 'A Code Guardian towers, flanked by two Fragments. All four of you are needed.', voiceLine: 'Let\u2019s break it!' },
      { kind: 'chest', x: 8, z: 0, alignment: 'Light', text: 'A chest containing four small reflections, one of them yours.', voiceLine: 'This is it. The core of the loop.' },
    ],
  },
];
