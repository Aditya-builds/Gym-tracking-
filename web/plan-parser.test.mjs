import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const parserSource = readFileSync(join(dir, "plan-parser.js"), "utf8");
eval(parserSource);

const parseWorkoutPlanText = globalThis.parseWorkoutPlanText;

describe("plan-parser", () => {
  it("parses Day 1: Push with bullets", () => {
    const plan = parseWorkoutPlanText("Day 1: Push\n - Pull-up\n - Bench Press");
    assert.equal(plan.days.length, 1);
    assert.ok(plan.daySchedule["Day 1 – Push"]?.includes("Pull-up"));
  });

  it("parses DAY N – title headers", () => {
    const plan = parseWorkoutPlanText(
      "DAY 1 – BACK\n1. Pull-up\n→ 3 × 6–10\n\nDAY 2 – LEGS\n1. Squat\n→ 4 × 6–8"
    );
    assert.equal(plan.days.length, 2);
  });

  it("rejects empty input", () => {
    assert.throws(() => parseWorkoutPlanText(""), /empty/i);
  });
});
