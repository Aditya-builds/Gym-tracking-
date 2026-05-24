/**
 * Inserts 4 weeks of dummy workouts + measurements into gym-data.json
 * Run: node scripts/seed-dummy-4-weeks.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "gym-data.json");

const TRAINING_DAYS = [
  "Day 1 – BACK + BICEPS (V-TAPER FOCUSED)",
  "Day 2 – LEGS",
  "Day 3 – CHEST & TRICEPS",
];

/** week -> session templates: [dayIndex, exercises with defId and sets] */
const WEEK_PLAN = [
  {
    sessions: [
      { day: 0, exercises: [{ defId: 1, name: "Pull-up", sets: [[0, 6, 72], [0, 6, 70], [0, 5, 68]] }, { defId: 2, name: "Lat Pulldown", sets: [[55, 10, 55], [57.5, 10, 52], [57.5, 9, 50]] }] },
      { day: 1, exercises: [{ defId: 4, name: "Back Squat", sets: [[80, 8, 70], [82.5, 8, 68], [82.5, 7, 65]] }, { defId: 5, name: "Romanian Deadlift", sets: [[70, 10, 60], [72.5, 10, 58], [72.5, 9, 55]] }] },
      { day: 2, exercises: [{ defId: 9, name: "Incline Dumbbell Press", sets: [[22.5, 10, 55], [24, 10, 52], [24, 9, 50]] }, { defId: 10, name: "Overhead Press", sets: [[40, 8, 60], [42.5, 8, 58], [42.5, 7, 55]] }] },
    ],
  },
  {
    sessions: [
      { day: 0, exercises: [{ defId: 1, name: "Pull-up", sets: [[0, 7, 68], [0, 7, 66], [2.5, 6, 64]] }, { defId: 3, name: "Chest Supported Row", sets: [[50, 10, 52], [52.5, 10, 50], [52.5, 9, 48]] }] },
      { day: 1, exercises: [{ defId: 4, name: "Back Squat", sets: [[85, 8, 68], [87.5, 7, 65], [87.5, 7, 63]] }, { defId: 8, name: "Barbell Hip Thrust", sets: [[100, 10, 58], [105, 10, 55], [105, 9, 52]] }] },
      { day: 2, exercises: [{ defId: 9, name: "Incline Dumbbell Press", sets: [[24, 10, 52], [25, 9, 50], [25, 9, 48]] }, { defId: 10, name: "Overhead Press", sets: [[42.5, 8, 56], [45, 7, 54], [45, 7, 52]] }] },
    ],
  },
  {
    sessions: [
      { day: 0, exercises: [{ defId: 1, name: "Pull-up", sets: [[2.5, 7, 65], [2.5, 7, 63], [5, 6, 60]] }, { defId: 2, name: "Lat Pulldown", sets: [[60, 10, 50], [62.5, 9, 48], [62.5, 9, 46]] }] },
      { day: 1, exercises: [{ defId: 4, name: "Back Squat", sets: [[90, 7, 63], [92.5, 6, 60], [92.5, 6, 58]] }, { defId: 5, name: "Romanian Deadlift", sets: [[75, 10, 55], [77.5, 9, 52], [77.5, 9, 50]] }] },
      { day: 2, exercises: [{ defId: 9, name: "Incline Dumbbell Press", sets: [[26, 9, 48], [27.5, 8, 46], [27.5, 8, 44]] }, { defId: 10, name: "Overhead Press", sets: [[45, 7, 52], [47.5, 6, 50], [47.5, 6, 48]] }] },
    ],
  },
  {
    sessions: [
      { day: 0, exercises: [{ defId: 1, name: "Pull-up", sets: [[5, 8, 62], [5, 7, 60], [7.5, 6, 58]], prSet: 3 }, { defId: 2, name: "Lat Pulldown", sets: [[65, 10, 48], [67.5, 9, 45], [67.5, 9, 43]] }] },
      { day: 1, exercises: [{ defId: 4, name: "Back Squat", sets: [[95, 6, 58], [97.5, 6, 55], [100, 5, 52]], prSet: 3 }, { defId: 8, name: "Barbell Hip Thrust", sets: [[110, 10, 52], [115, 9, 50], [115, 8, 48]] }] },
      { day: 2, exercises: [{ defId: 9, name: "Incline Dumbbell Press", sets: [[28, 8, 44], [30, 7, 42], [30, 7, 40]] }, { defId: 10, name: "Overhead Press", sets: [[50, 6, 48], [52.5, 5, 45], [52.5, 5, 43]] }] },
    ],
  },
];

const MEASUREMENTS = [
  { week: 1, weight: 78.2, waist: 82.5, hips: 98.0, thigh: 56.0, chest: 102.0, shoulders: 118.0, arm: 34.5 },
  { week: 2, weight: 77.8, waist: 81.8, hips: 98.2, thigh: 56.2, chest: 102.5, shoulders: 118.5, arm: 34.8 },
  { week: 3, weight: 77.4, waist: 81.0, hips: 98.5, thigh: 56.5, chest: 103.0, shoulders: 119.0, arm: 35.0 },
  { week: 4, weight: 77.0, waist: 80.2, hips: 99.0, thigh: 57.0, chest: 103.5, shoulders: 119.5, arm: 35.2 },
];

function addDays(isoDate, days) {
  const d = new Date(isoDate + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoWeekStart(weekNum) {
  // Week 4 ends ~today (2026-05-24); week 1 starts 21 days earlier
  const week4End = "2026-05-24";
  const week4Start = addDays(week4End, -6);
  const offset = (4 - weekNum) * 7;
  return addDays(week4Start, -offset);
}

const root = JSON.parse(readFileSync(dataPath, "utf8"));

const workoutSessions = [];
const exerciseEntries = [];
const setEntries = [];
const bodyMeasurements = [];
const personalRecords = [];

let sessionId = 1;
let entryId = 1;
let setId = 1;
let measureId = 1;
let prId = 1;

for (let w = 0; w < WEEK_PLAN.length; w++) {
  const weekNum = w + 1;
  const weekStart = isoWeekStart(weekNum);
  const m = MEASUREMENTS[w];
  bodyMeasurements.push({
    id: measureId++,
    userId: 1,
    measurementDate: addDays(weekStart, 6),
    weekNumber: weekNum,
    bodyWeight: m.weight,
    waistNavel: m.waist,
    waistSmallest: m.waist - 1.2,
    hips: m.hips,
    thigh: m.thigh,
    chest: m.chest,
    shoulders: m.shoulders,
    arm: m.arm,
    photosTaken: weekNum % 2 === 0,
    notes: weekNum === 4 ? "Best week — sleep was solid." : `Week ${weekNum} check-in`,
    createdAt: `${addDays(weekStart, 6)}T08:00:00Z`,
  });

  for (let s = 0; s < WEEK_PLAN[w].sessions.length; s++) {
    const tmpl = WEEK_PLAN[w].sessions[s];
    const workoutDate = addDays(weekStart, s * 2);
    const createdAt = `${workoutDate}T17:30:00Z`;

    workoutSessions.push({
      id: sessionId,
      userId: 1,
      workoutDate,
      weekNumber: weekNum,
      trainingDay: TRAINING_DAYS[tmpl.day],
      durationMinutes: 55 + s * 5,
      energyLevel: 3 + (weekNum > 2 ? 1 : 0),
      completed: true,
      sessionNotes: s === 0 ? "Felt strong" : null,
      createdAt,
    });

    let order = 1;
    for (const ex of tmpl.exercises) {
      exerciseEntries.push({
        id: entryId,
        workoutSessionId: sessionId,
        exerciseDefinitionId: ex.defId,
        orderIndex: order++,
        exerciseNotes: null,
      });

      ex.sets.forEach(([weight, reps, rir], idx) => {
        const setNum = idx + 1;
        const isPr = ex.prSet === setNum;
        setEntries.push({
          id: setId,
          exerciseEntryId: entryId,
          setNumber: setNum,
          weight,
          reps,
          rir,
          isPr,
          createdAt: `${workoutDate}T18:${10 + setNum * 5}:00Z`,
        });
        if (isPr) {
          const prev = ex.sets[setNum - 2]?.[0] ?? weight - 5;
          personalRecords.push({
            id: prId++,
            exerciseDefinitionId: ex.defId,
            setEntryId: setId,
            prType: "WEIGHT_PR",
            previousValue: prev,
            newValue: weight,
            createdAt: `${workoutDate}T18:${10 + setNum * 5}:00Z`,
          });
        }
        setId++;
      });
      entryId++;
    }
    sessionId++;
  }
}

root.workoutSessions = workoutSessions;
root.exerciseEntries = exerciseEntries;
root.setEntries = setEntries;
root.bodyMeasurements = bodyMeasurements;
root.personalRecords = personalRecords;

writeFileSync(dataPath, JSON.stringify(root, null, 2) + "\n", "utf8");

console.log(
  `Seeded: ${workoutSessions.length} sessions, ${exerciseEntries.length} exercises, ${setEntries.length} sets, ${bodyMeasurements.length} measurements, ${personalRecords.length} PRs`
);
