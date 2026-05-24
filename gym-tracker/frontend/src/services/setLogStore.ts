/**
 * In-memory set log store (mock API).
 * Replace with real API calls when wiring to Quarkus backend.
 */

export type LoggedSet = {
  exerciseId: string;
  setNumber: number;
  /** false = pure BW; true = BW + added kg */
  isBodyweight: boolean;
  weightKg: number;
  reps: number;
  rir: number;
  loggedAt: string;
};

export type LastSetSummary = {
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number;
  reps: number;
  rir: number;
};

const lastByExercise = new Map<string, LastSetSummary>();
const historyByExercise = new Map<string, LoggedSet[]>();

export function getLastSet(exerciseId: string): LastSetSummary | null {
  return lastByExercise.get(exerciseId) ?? null;
}

export function getNextSetNumber(exerciseId: string): number {
  const last = lastByExercise.get(exerciseId);
  return last ? last.setNumber + 1 : 1;
}

/**
 * Persists a set and returns the updated last-set summary for that exercise.
 */
export async function saveSet(
  exerciseId: string,
  payload: {
    setNumber: number;
    isBodyweight: boolean;
    weightKg: number;
    reps: number;
    rir: number;
  }
): Promise<LastSetSummary> {
  await new Promise((r) => setTimeout(r, 120));

  const entry: LoggedSet = {
    exerciseId,
    setNumber: payload.setNumber,
    isBodyweight: payload.isBodyweight,
    weightKg: payload.weightKg,
    reps: payload.reps,
    rir: payload.rir,
    loggedAt: new Date().toISOString(),
  };

  const history = historyByExercise.get(exerciseId) ?? [];
  history.push(entry);
  historyByExercise.set(exerciseId, history);

  const summary: LastSetSummary = {
    setNumber: payload.setNumber,
    isBodyweight: payload.isBodyweight,
    weightKg: payload.weightKg,
    reps: payload.reps,
    rir: payload.rir,
  };
  lastByExercise.set(exerciseId, summary);
  return summary;
}

export function formatLastSet(last: LastSetSummary | null): string {
  if (!last) return "No sets yet";
  const w = last.isBodyweight
    ? last.weightKg > 0
      ? `BW+${last.weightKg}kg`
      : "BW"
    : `${last.weightKg}kg`;
  return `Set ${last.setNumber}: ${w} × ${last.reps} · RIR ${last.rir}`;
}

/** Suggested starting weight on deload (50% of last heavy). */
export function deloadSuggestedWeightKg(last: LastSetSummary | null): number {
  if (!last || last.isBodyweight) return 0;
  return Math.round((last.weightKg * 0.5) / 2.5) * 2.5;
}
