export type ObjectKind = 'door' | 'monster' | 'chest';
export type Guide = 'Light' | 'Shadow' | 'Ambition';
export interface RoomObject { kind: ObjectKind; x: number; z: number; alignment: Guide; text: string }
export interface EchoRoom { owner: Guide; objects: RoomObject[] }

// Authored copy of stage_2/nethack-scene.md:119-237, interpreted as data, NOT
// executed pseudocode. Colors, code architecture and movement are our graybox.
export const ECHO_ROOMS: EchoRoom[] = [
  { owner: 'Light', objects: [
    { kind: 'door', x: -8, z: 0, alignment: 'Light', text: 'What is the first story you ever loved?' },
    { kind: 'monster', x: 0, z: 0, alignment: 'Ambition', text: 'A spectral wolf appears! It lunges...' },
    { kind: 'chest', x: 8, z: 0, alignment: 'Shadow', text: 'You open the chest. Inside: a broken compass.' },
  ] },
  { owner: 'Shadow', objects: [
    { kind: 'door', x: -8, z: 0, alignment: 'Shadow', text: 'Is chaos kinder than order?' },
    { kind: 'monster', x: 0, z: 0, alignment: 'Light', text: 'A guardian of light blocks your path!' },
    { kind: 'chest', x: 8, z: 0, alignment: 'Ambition', text: 'The chest giggles. It’s empty... or is it?' },
  ] },
  { owner: 'Ambition', objects: [
    { kind: 'door', x: -8, z: 0, alignment: 'Ambition', text: 'Would you burn the world to save one soul?' },
    { kind: 'monster', x: 0, z: 0, alignment: 'Shadow', text: 'A trickster imp cackles and attacks!' },
    { kind: 'chest', x: 8, z: 0, alignment: 'Light', text: 'Inside: a shard glowing with ancient hope.' },
  ] },
];
