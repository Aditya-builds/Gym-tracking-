/**
 * Hardcoded 5-day split — weeks 1–6 progressive overload, weeks 7–8 deload.
 */

export type PlanExercise = {
  id: string;
  name: string;
  target: string;
  cue?: string;
  /** Bodyweight toggle in set logger (Pull-Ups, Dips, etc.) */
  bodyweight?: boolean;
};

export type PlanSection = {
  name: string;
  exercises: PlanExercise[];
};

export type PlanDay = {
  dayNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  label: string;
  sections: PlanSection[];
};

export const DELOAD_WEEK_START = 7;
export const TOTAL_WEEKS = 8;

export const WORKOUT_PLAN: PlanDay[] = [
  {
    dayNumber: 1,
    title: "BACK + BICEPS",
    label: "Day 1 – BACK + BICEPS",
    sections: [
      {
        name: "Activation",
        exercises: [
          {
            id: "d1-straight-arm-pulldown",
            name: "Straight Arm Pulldown",
            target: "2–3 × 12–15",
          },
        ],
      },
      {
        name: "BACK",
        exercises: [
          {
            id: "d1-pull-ups",
            name: "Pull-Ups",
            target: "3 × 6–10",
            bodyweight: true,
          },
          {
            id: "d1-lat-pulldown",
            name: "Lat Pulldown",
            target: "3 × 8–12",
            cue: "Chest up, slight lean, elbows to ribs",
          },
          {
            id: "d1-chest-supported-row",
            name: "Chest-Supported Row",
            target: "3 × 8–12",
          },
          {
            id: "d1-single-arm-pulldown",
            name: "Single-Arm Cable Pulldown",
            target: "3 × 10–12 each side",
          },
        ],
      },
      {
        name: "Rear Delts",
        exercises: [
          { id: "d1-face-pull", name: "Face Pull", target: "3 × 12–15" },
          {
            id: "d1-reverse-pec-deck",
            name: "Reverse Pec Deck",
            target: "2 × 12–15",
          },
        ],
      },
      {
        name: "Biceps",
        exercises: [
          { id: "d1-ez-bar-curl", name: "EZ-Bar Curl", target: "3 × 8–12" },
          {
            id: "d1-incline-db-curl",
            name: "Incline DB Curl",
            target: "3 × 10–12",
          },
        ],
      },
    ],
  },
  {
    dayNumber: 2,
    title: "LEGS",
    label: "Day 2 – LEGS",
    sections: [
      {
        name: "Main",
        exercises: [
          { id: "d2-back-squat", name: "Back Squat", target: "4 × 6–8" },
          { id: "d2-rdl", name: "RDL", target: "3–4 × 8–10" },
          { id: "d2-leg-press", name: "Leg Press", target: "3 × 10–12" },
          {
            id: "d2-bulgarian-split-squat",
            name: "Bulgarian Split Squat",
            target: "2–3 × 8–10",
          },
          {
            id: "d2-cable-hip-abduction",
            name: "Cable Hip Abduction",
            target: "3 × 12–15",
          },
          {
            id: "d2-leg-extension",
            name: "Leg Extension",
            target: "2–3 × 12–15",
          },
          { id: "d2-leg-curl", name: "Leg Curl", target: "2–3 × 12–15" },
          { id: "d2-hip-thrust", name: "Hip Thrust", target: "3 × 8–12" },
        ],
      },
      {
        name: "Calves",
        exercises: [
          {
            id: "d2-standing-calf-raise",
            name: "Standing Calf Raise",
            target: "3–4 × 12–15",
          },
          {
            id: "d2-seated-calf-raise",
            name: "Seated Calf Raise",
            target: "3 × 15–20",
          },
        ],
      },
    ],
  },
  {
    dayNumber: 3,
    title: "CHEST & TRICEPS",
    label: "Day 3 – CHEST & TRICEPS",
    sections: [
      {
        name: "Chest",
        exercises: [
          {
            id: "d3-incline-press",
            name: "Incline BB/DB Press",
            target: "4 × 6–10",
          },
          { id: "d3-flat-db-press", name: "Flat DB Press", target: "3–4 × 8–12" },
          { id: "d3-chest-fly", name: "Chest Fly", target: "3 × 12–15" },
          { id: "d3-dips", name: "Dips", target: "2–3 × 8–12", bodyweight: true },
          {
            id: "d3-push-up-finisher",
            name: "Push-Up Finisher",
            target: "1–2 sets",
            bodyweight: true,
          },
        ],
      },
      {
        name: "Triceps",
        exercises: [
          { id: "d3-rope-pushdown", name: "Rope Pushdown", target: "3–4 × 10–15" },
          {
            id: "d3-overhead-extension",
            name: "Overhead Extension",
            target: "3 × 10–12",
          },
          {
            id: "d3-bench-dips",
            name: "Bench Dips",
            target: "2 × 12–15",
            bodyweight: true,
          },
        ],
      },
    ],
  },
  {
    dayNumber: 4,
    title: "CORE & CONDITIONING",
    label: "Day 4 – CORE & CONDITIONING",
    sections: [
      {
        name: "Core",
        exercises: [
          {
            id: "d4-farmers-walk",
            name: "Farmer's Walk",
            target: "3 × 30–40s",
          },
          { id: "d4-cable-crunch", name: "Cable Crunch", target: "3 × 8–12" },
          { id: "d4-ab-wheel", name: "Ab Wheel", target: "3 × 6–12" },
          { id: "d4-pallof-press", name: "Pallof Press", target: "3 × 10–12" },
          {
            id: "d4-hanging-leg-raise",
            name: "Hanging Leg Raise",
            target: "3 × 10–12",
            bodyweight: true,
          },
        ],
      },
      {
        name: "Conditioning",
        exercises: [
          {
            id: "d4-incline-walk",
            name: "Incline Treadmill Walk",
            target: "15–20 min",
          },
        ],
      },
    ],
  },
  {
    dayNumber: 5,
    title: "SHOULDERS & BICEPS",
    label: "Day 5 – SHOULDERS + BICEPS",
    sections: [
      {
        name: "Shoulders",
        exercises: [
          { id: "d5-ohp", name: "Overhead Press", target: "3 × 6–10" },
          { id: "d5-lateral-raise", name: "Lateral Raise", target: "3–4 × 12–15" },
          { id: "d5-reverse-fly", name: "Reverse Fly", target: "2–3 × 12–15" },
          {
            id: "d5-machine-shoulder-press",
            name: "Machine Shoulder Press",
            target: "2 × 10–12",
          },
        ],
      },
      {
        name: "Biceps",
        exercises: [
          {
            id: "d5-close-grip-pulldown",
            name: "Close-Grip Pulldown",
            target: "3 × 8–12",
          },
          {
            id: "d5-db-preacher-curl",
            name: "DB Preacher Curl",
            target: "3 × 10–12",
          },
          { id: "d5-21s", name: "21s", target: "2 × 15–20" },
        ],
      },
    ],
  },
];

/** Monday = Day 1 … Friday = Day 5; weekend defaults to Day 1 (plan week start). */
export function weekdayToDayIndex(date: Date = new Date()): number {
  const dow = date.getDay(); // 0 Sun … 6 Sat
  if (dow >= 1 && dow <= 5) return dow - 1;
  return 0;
}

export function isDeloadWeek(week: number): boolean {
  return week >= DELOAD_WEEK_START;
}

/** Parse "3 × 6–10" → suggested set count for deload (half, min 1). */
export function parseTargetSets(target: string): number | null {
  const m = target.match(/(\d+)\s*×/);
  if (!m) return null;
  return parseInt(m[1], 10);
}

export function deloadTargetLabel(target: string): string {
  const sets = parseTargetSets(target);
  if (!sets) return `${target} · deload: reduce load 40–50%`;
  const half = Math.max(1, Math.ceil(sets / 2));
  return `${target} → deload ~${half} sets, −40–50% weight`;
}
