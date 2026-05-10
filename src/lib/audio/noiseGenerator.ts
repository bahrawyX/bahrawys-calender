// Stub for the standalone calendar lib. The full Lumina app uses these
// to play ambient noise tracks; the standalone calendar has no audio
// surface so all calls are no-ops.
import type { AmbientTrack } from '@/types';

export function playTrack(_track: AmbientTrack, _volume?: number): void {
  // no-op
}

export function stopTrack(): void {
  // no-op
}

export function setTrackVolume(_volume: number): void {
  // no-op
}
