import { PlanDay, PlanExercise, WorkoutPlan } from "../api/planApi";

export type ExerciseDraft = {
  name: string;
};

export type DayDraft = {
  title: string;
  exercises: ExerciseDraft[];
};

export function emptyDayDraft(): DayDraft {
  return { title: "", exercises: [{ name: "" }] };
}

export function resizeDayDrafts(current: DayDraft[], count: number): DayDraft[] {
  const next = [...current];
  while (next.length < count) {
    next.push(emptyDayDraft());
  }
  return next.slice(0, count);
}

export function planToDayDrafts(plan: WorkoutPlan | null): DayDraft[] {
  if (!plan?.days?.length) {
    return resizeDayDrafts([], 3);
  }

  return plan.days.map((day) => ({
    title: day.title || day.label.replace(/^Day \d+\s*[–-]\s*/i, ""),
    exercises:
      day.sections.flatMap((section) => section.exercises).length > 0
        ? day.sections.flatMap((section) =>
            section.exercises.map((exercise) => ({ name: exercise.name }))
          )
        : [{ name: "" }],
  }));
}

export function buildWorkoutPlanFromDrafts(
  planName: string,
  weeks: number,
  dayDrafts: DayDraft[]
): WorkoutPlan {
  const days: PlanDay[] = dayDrafts.map((draft, index) => {
    const title = draft.title.trim() || `Training ${index + 1}`;
    const label = `Day ${index + 1} – ${title}`;
    const exercises: PlanExercise[] = draft.exercises
      .filter((exercise) => exercise.name.trim())
      .map((exercise) => ({
        name: exercise.name.trim(),
        sectionName: "Main",
        loggable: true,
      }));

    return {
      dayNumber: index + 1,
      title,
      label,
      sections: [{ name: "Main", exercises }],
    };
  });

  const trainingDays = days.map((day) => day.label);
  const daySchedule: Record<string, string[]> = {};
  for (const day of days) {
    daySchedule[day.label] = day.sections.flatMap((section) =>
      section.exercises.map((exercise) => exercise.name)
    );
  }

  return {
    planName: planName.trim() || "My Workout Plan",
    weeks: Math.min(12, Math.max(1, weeks)),
    trainingDays,
    daySchedule,
    days,
  };
}
