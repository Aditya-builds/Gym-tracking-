import { PlanExercise, WorkoutPlan } from "../api/planApi";

export const DELOAD_WEEK_START = 7;
export const DEFAULT_TOTAL_WEEKS = 8;

export type TodayExercise = {
  id: string;
  name: string;
  target: string;
  cue?: string;
  bodyweight?: boolean;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isBodyweightExercise(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("pull-up") ||
    n.includes("pull up") ||
    n.includes("dip") ||
    n.includes("push-up") ||
    n.includes("push up")
  );
}

export function toTodayExercise(exercise: PlanExercise): TodayExercise {
  const target =
    exercise.prescription ??
    (exercise.sets && exercise.reps
      ? `${exercise.sets} × ${exercise.reps}`
      : "Log weight & reps when you train");

  return {
    id: slugify(exercise.name),
    name: exercise.name,
    target,
    cue: exercise.notes ?? undefined,
    bodyweight: isBodyweightExercise(exercise.name),
  };
}

export type TodaySection = {
  name: string;
  exercises: TodayExercise[];
};

export type TodayPlanDay = {
  dayNumber: number;
  title: string;
  label: string;
  sections: TodaySection[];
};

export function getTodayPlanDays(plan: WorkoutPlan | null): TodayPlanDay[] {
  if (!plan?.days?.length) return [];

  return plan.days
    .map((day) => ({
      ...day,
      sections: day.sections
        .map((section) => ({
          ...section,
          exercises: section.exercises
            .filter((exercise) => exercise.loggable !== false)
            .map(toTodayExercise),
        }))
        .filter((section) => section.exercises.length > 0),
    }))
    .filter((day) => day.sections.length > 0);
}

export function totalWeeks(plan: WorkoutPlan | null): number {
  return plan?.weeks ?? DEFAULT_TOTAL_WEEKS;
}

/** Monday = Day 1 … Friday = Day 5; weekend defaults to Day 1. */
export function weekdayToDayIndex(date: Date = new Date(), dayCount: number): number {
  const dow = date.getDay();
  if (dow >= 1 && dow <= 5) return Math.min(dow - 1, Math.max(0, dayCount - 1));
  return 0;
}

export function isDeloadWeek(week: number): boolean {
  return week >= DELOAD_WEEK_START;
}

export function parseTargetSets(target: string): number | null {
  const match = target.match(/(\d+)\s*×/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function deloadTargetLabel(target: string): string {
  const sets = parseTargetSets(target);
  if (!sets) return `${target} · deload: reduce load 40–50%`;
  const half = Math.max(1, Math.ceil(sets / 2));
  return `${target} → deload ~${half} sets, −40–50% weight`;
}

export function weekFromBlockStart(
  blockStart: Date,
  today: Date = new Date(),
  maxWeeks = DEFAULT_TOTAL_WEEKS
): number {
  const ms = today.getTime() - blockStart.getTime();
  const weeks = Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(maxWeeks, Math.max(1, weeks));
}

export function exerciseKey(name: string): string {
  return name.toLowerCase().trim();
}

export function namesMatch(a: string, b: string): boolean {
  return a === b || a.includes(b) || b.includes(a);
}
