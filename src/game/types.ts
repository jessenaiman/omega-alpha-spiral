export type PhaseId = 'ghost' | 'exploration' | 'action' | 'formation' | 'fracture' | 'threshold' | 'collapse';
export type EraId = PhaseId;
export type DreamweaverId = 'luminary' | 'shadow' | 'ambition';
export type EchoRole = 'fighter' | 'scribe' | 'thief' | 'weaver';
export type TownRoute = 'memory' | 'bodies';
export type LandmarkId = 'archive' | 'refuge' | 'gate';
export type EncounterId = 'first-sweep' | 'shard-route' | 'archive-crossing';
export type TerminalQuestionId = 'story' | 'role' | 'name';

export interface Lineage { baseInstanceId: number; loopCount: number; }
export interface RunState {
  seed: number;
  baseInstanceId: number;
  loopCount: number;
  displayInstance: number;
  phase: PhaseId;
  era: EraId;
  checkpoint: string;
  playerName: string;
  omegaName: string;
  affinity: Record<DreamweaverId, number>;
  party: EchoRole[];
  partyTested: boolean;
  route: TownRoute | null;
  pairedDreamweaver: DreamweaverId | null;
  progress: {
    terminalAnswers: Partial<Record<TerminalQuestionId, DreamweaverId>>;
    landmarks: LandmarkId[];
    encounters: EncounterId[];
    fractureObjectives: number;
  };
}

export type GameAction =
  | { type: 'player.named'; name: string }
  | { type: 'terminal.choice.recorded'; question: TerminalQuestionId; dreamweaver: DreamweaverId }
  | { type: 'omega.named'; name: string }
  | { type: 'landmark.completed'; landmark: LandmarkId }
  | { type: 'encounter.completed'; encounter: EncounterId }
  | { type: 'companion.added'; role: EchoRole }
  | { type: 'party.test.completed' }
  | { type: 'route.committed'; route: TownRoute }
  | { type: 'fracture.objective.completed' }
  | { type: 'dreamweaver.paired'; dreamweaver: DreamweaverId }
  | { type: 'bridge.completed' }
  | { type: 'loop.reset' };

export const FEEDBACK_EVENT_TYPES = [
  'ui.confirm', 'step', 'dash.start', 'act.commit', 'threat.tell', 'threat.contact',
  'landmark.restore', 'companion.recruit', 'rewind.begin', 'rewind.end', 'era.advance',
  'route.commit', 'pair.carry', 'bridge.cross', 'logo.resolve', 'loop.collapse',
] as const;
export type FeedbackEventName = (typeof FEEDBACK_EVENT_TYPES)[number];
export interface FeedbackEvent {
  type: FeedbackEventName;
  sourceId?: string;
  dreamweaver?: DreamweaverId;
  value?: number;
}
