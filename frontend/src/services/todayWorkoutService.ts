import {
  createExerciseEntry,
  createSetEntry,
  createWorkoutSession,
  EXERCISE_DEFINITIONS,
  getExercisesBySession,
  getSetsByExercise,
  getWorkoutSessions,
  SetEntry,
  WorkoutSession,
} from "../api/workoutApi";
import { WorkoutPlan } from "../api/planApi";
import {
  exerciseKey,
  isBodyweightExercise,
  namesMatch,
} from "../utils/planUtils";

export type LastSetSummary = {
  setNumber: number;
  isBodyweight: boolean;
  weightKg: number;
  reps: number;
  rir: number;
};

let cachedSession: WorkoutSession | null = null;
const exerciseEntryMap = new Map<string, number>();
const lastSetsCache = new Map<string, LastSetSummary>();

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolveDefinitionId(plan: WorkoutPlan | null, name: string): number {
  const fromPlan = plan?.exercises?.find(
    (exercise) =>
      exercise.exerciseName?.toLowerCase() === name.toLowerCase()
  );
  if (fromPlan?.id) return fromPlan.id;

  const normalized = name.toLowerCase();
  const primary = normalized.split("/")[0].trim();

  for (const definition of EXERCISE_DEFINITIONS) {
    const defName = definition.name.toLowerCase();
    if (
      normalized.includes(defName) ||
      defName.includes(primary) ||
      primary.includes(defName)
    ) {
      return definition.id;
    }
  }

  return EXERCISE_DEFINITIONS[0]?.id ?? 1;
}

function setEntryToSummary(
  setEntry: SetEntry,
  bodyweight: boolean
): LastSetSummary {
  const weight = Number(setEntry.weight);
  const isBw = bodyweight && weight < 1;

  return {
    setNumber: setEntry.setNumber,
    isBodyweight: isBw,
    weightKg: isBw ? weight : weight,
    reps: setEntry.reps,
    rir: setEntry.rir ?? 0,
  };
}

export async function ensureTodaySession(
  weekNumber: number,
  trainingDayLabel: string
): Promise<WorkoutSession> {
  const sessions = await getWorkoutSessions();
  const today = todayIso();
  const existing = sessions.find(
    (session) =>
      session.workoutDate === today &&
      session.trainingDay === trainingDayLabel &&
      session.weekNumber === weekNumber
  );

  if (existing) {
    cachedSession = existing;
    await refreshExerciseEntryMap(existing.id);
    return existing;
  }

  const session = await createWorkoutSession({
    workoutDate: today,
    weekNumber,
    trainingDay: trainingDayLabel,
    completed: false,
  });
  cachedSession = session;
  exerciseEntryMap.clear();
  return session;
}

async function refreshExerciseEntryMap(sessionId: number): Promise<void> {
  const entries = await getExercisesBySession(sessionId);
  exerciseEntryMap.clear();
  for (const entry of entries) {
    exerciseEntryMap.set(exerciseKey(entry.exerciseName), entry.id);
  }
}

async function getOrCreateExerciseEntry(
  exerciseName: string,
  plan: WorkoutPlan | null,
  orderIndex: number
): Promise<number> {
  const key = exerciseKey(exerciseName);
  const existing = exerciseEntryMap.get(key);
  if (existing) return existing;

  if (!cachedSession) {
    throw new Error("No active workout session");
  }

  const entry = await createExerciseEntry({
    workoutSessionId: cachedSession.id,
    exerciseDefinitionId: resolveDefinitionId(plan, exerciseName),
    orderIndex,
    exerciseNotes: undefined,
  });
  exerciseEntryMap.set(key, entry.id);
  return entry.id;
}

export async function refreshLastSets(
  exerciseNames: string[]
): Promise<Record<string, LastSetSummary>> {
  const sessions = (await getWorkoutSessions()).sort((a, b) =>
    `${b.workoutDate}${b.createdAt ?? ""}`.localeCompare(
      `${a.workoutDate}${a.createdAt ?? ""}`
    )
  );

  const result: Record<string, LastSetSummary> = {};
  const pending = new Set(exerciseNames.map(exerciseKey));

  for (const session of sessions) {
    if (pending.size === 0) break;

    const entries = await getExercisesBySession(session.id);
    for (const entry of entries) {
      const entryKey = exerciseKey(entry.exerciseName);

      for (const name of exerciseNames) {
        const nameKey = exerciseKey(name);
        if (!pending.has(nameKey) || !namesMatch(nameKey, entryKey)) {
          continue;
        }

        const sets = await getSetsByExercise(entry.id);
        if (sets.length === 0) continue;

        const last = sets.reduce((best, current) =>
          current.setNumber > best.setNumber ? current : best
        );
        result[nameKey] = setEntryToSummary(
          last,
          isBodyweightExercise(name)
        );
        pending.delete(nameKey);
      }
    }
  }

  lastSetsCache.clear();
  for (const [key, value] of Object.entries(result)) {
    lastSetsCache.set(key, value);
  }

  return result;
}

export function getLastSet(exerciseName: string): LastSetSummary | null {
  return lastSetsCache.get(exerciseKey(exerciseName)) ?? null;
}

export function getNextSetNumber(exerciseName: string): number {
  const last = getLastSet(exerciseName);
  return last ? last.setNumber + 1 : 1;
}

export async function prepareExerciseLogging(
  weekNumber: number,
  trainingDayLabel: string,
  exerciseName: string,
  plan: WorkoutPlan | null,
  orderIndex: number
): Promise<{ entryId: number; sets: SetEntry[]; nextSetNumber: number }> {
  await ensureTodaySession(weekNumber, trainingDayLabel);
  const entryId = await getOrCreateExerciseEntry(exerciseName, plan, orderIndex);
  const sets = await getSetsByExercise(entryId);
  const logged = sets.filter((s) => s.reps > 0);
  const nextSetNumber =
    logged.length > 0
      ? Math.max(...logged.map((s) => s.setNumber)) + 1
      : 1;

  const last =
    logged.length > 0
      ? logged.reduce((best, current) =>
          current.setNumber > best.setNumber ? current : best
        )
      : null;
  if (last) {
    lastSetsCache.set(
      exerciseKey(exerciseName),
      setEntryToSummary(last, isBodyweightExercise(exerciseName))
    );
  }

  return { entryId, sets: logged, nextSetNumber };
}

export async function saveSet(
  exerciseName: string,
  plan: WorkoutPlan | null,
  orderIndex: number,
  payload: {
    setNumber: number;
    isBodyweight: boolean;
    weightKg: number;
    reps: number;
    rir: number;
    notes?: string;
  }
): Promise<LastSetSummary> {
  await getOrCreateExerciseEntry(exerciseName, plan, orderIndex);

  const weight =
    payload.isBodyweight && payload.weightKg === 0 ? 0 : payload.weightKg;

  const setEntry = await createSetEntry({
    exerciseEntryId: exerciseEntryMap.get(exerciseKey(exerciseName))!,
    setNumber: payload.setNumber,
    weight,
    reps: payload.reps,
    rir: payload.rir,
    notes: payload.notes?.trim() || undefined,
  });

  const summary = setEntryToSummary(setEntry, payload.isBodyweight);
  summary.isBodyweight = payload.isBodyweight;
  summary.weightKg = payload.weightKg;

  lastSetsCache.set(exerciseKey(exerciseName), summary);
  return summary;
}

export function formatLastSet(last: LastSetSummary | null): string {
  if (!last) return "No sets yet";
  const weightLabel = last.isBodyweight
    ? last.weightKg > 0
      ? `BW+${last.weightKg}kg`
      : "BW"
    : `${last.weightKg}kg`;
  return `Set ${last.setNumber}: ${weightLabel} × ${last.reps} · RIR ${last.rir}`;
}

export function deloadSuggestedWeightKg(last: LastSetSummary | null): number {
  if (!last || last.isBodyweight) return 0;
  return Math.round((last.weightKg * 0.5) / 2.5) * 2.5;
}
