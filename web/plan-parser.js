/**
 * Client-side workout plan parser (mirrors backend WorkoutPlanTextParser).
 * Used when API import fails; throws Error with line number on failure.
 */
(function (global) {
  const DAY_NUMBERED = /^(?:day\s*)?(\d+)\s*[–—\-:]+\s*(.+)$/i;
  const DAY_COLON = /^day\s*(\d+)\s*:\s*(.+)$/i;
  const DAY_NAME_ONLY =
    /^(push|pull|legs|upper|lower|full\s*body)\s*(?:day)?$/i;
  const NUMBERED = /^\d+\.\s+(.+)$/;
  const BULLET = /^[-*•]\s+(.+)$/;
  const SETS_REPS = /(\d+)\s*[x×]\s*([\d–\-]+)/i;
  const SKIP_SECTIONS = ["RULES", "FOCUS CUES", "PROGRESSION", "DELOAD", "FOCUS"];

  function normalizeDash(s) {
    return s.replace(/\u2013|\u2014/g, "-");
  }

  function isDivider(line) {
    return /^-{3,}$/.test(line) || /^={3,}$/.test(line);
  }

  function isSectionHeader(line) {
    if (line.length > 80) return false;
    if (NUMBERED.test(line) || BULLET.test(line)) return false;
    if (line.toLowerCase().startsWith("cue:")) return false;
    const upper = line.toUpperCase();
    if (SKIP_SECTIONS.some((s) => upper.startsWith(s))) return true;
    return (
      line === upper ||
      /warm-?up|main workout|mobility|activation|biceps|triceps|shoulders|core|conditioning|calves|posture|rear delts|optional/i.test(
        line
      )
    );
  }

  function isMainSection(section) {
    if (!section) return true;
    const n = section.name.toUpperCase();
    if (/WARM|MOBILITY|ACTIVATION/.test(n)) return false;
    if (/RULES|PROGRESSION|DELOAD|FOCUS/.test(n)) return false;
    return true;
  }

  function isSkippedSection(section) {
    if (!section) return false;
    const n = section.name.toUpperCase();
    return SKIP_SECTIONS.some((s) => n.includes(s));
  }

  function indexOfArrow(s) {
    const i = s.indexOf("→");
    return i >= 0 ? i : s.indexOf("->");
  }

  function stripPrescription(content) {
    const arrow = indexOfArrow(content);
    if (arrow >= 0) return content.slice(0, arrow).trim();
    const paren = content.indexOf("(");
    if (paren > 0) return content.slice(0, paren).trim();
    return content.trim();
  }

  function applyPrescription(ex, prescription) {
    if (!prescription) return;
    ex.prescription = prescription.replace(/^\(|\)$/g, "").trim();
    const m = SETS_REPS.exec(prescription);
    if (m) {
      ex.sets = parseInt(m[1], 10);
      ex.reps = m[2].replace(/\u2013/g, "-");
    }
  }

  function buildExercise(name, section, loggable) {
    return {
      name: name.replace(/\s+/g, " ").trim(),
      sectionName: section?.name,
      loggable: loggable && !isSkippedSection(section),
    };
  }

  function ensureSection(day, name) {
    let section = day.sections.find((s) => s.name === name);
    if (!section) {
      section = { name, exercises: [] };
      day.sections.push(section);
    }
    return section;
  }

  function flushPending(day, section, exercise) {
    if (!day || !exercise?.name?.trim()) return;
    const sec = section || ensureSection(day, "General");
    exercise.sectionName = sec.name;
    sec.exercises.push(exercise);
  }

  function parseDayHeader(line) {
    const normalized = normalizeDash(line);
    let m = DAY_NUMBERED.exec(normalized);
    if (m) {
      const n = parseInt(m[1], 10);
      const title = m[2].trim();
      return { dayNumber: n, title, label: `Day ${n} – ${title}` };
    }
    m = DAY_COLON.exec(normalized);
    if (m) {
      const n = parseInt(m[1], 10);
      const title = m[2].trim();
      return { dayNumber: n, title, label: `Day ${n} – ${title}` };
    }
    m = DAY_NAME_ONLY.exec(line.trim());
    if (m) {
      const title = m[1].replace(/\s+/g, " ");
      const cap = title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
      return { dayNumber: 0, title: cap, label: cap };
    }
    return null;
  }

  function parseWorkoutPlanText(rawText) {
    if (!rawText?.trim()) {
      throw new Error("Plan text is empty");
    }

    const lines = rawText.replace(/\r\n/g, "\n").split("\n");
    const days = [];
    let currentDay = null;
    let currentSection = null;
    let pendingExercise = null;
    let lineNum = 0;
    let lastMeaningfulLine = 0;

    for (const rawLine of lines) {
      lineNum++;
      const line = rawLine.trim();
      if (!line || isDivider(line)) continue;

      lastMeaningfulLine = lineNum;
      const dayHeader = parseDayHeader(line);

      if (dayHeader) {
        flushPending(currentDay, currentSection, pendingExercise);
        pendingExercise = null;
        currentDay = {
          dayNumber: dayHeader.dayNumber || days.length + 1,
          title: dayHeader.title,
          label: dayHeader.label,
          sections: [],
        };
        if (!currentDay.label.includes("Day ")) {
          currentDay.dayNumber = days.length + 1;
        }
        currentSection = null;
        days.push(currentDay);
        continue;
      }

      if (!currentDay) continue;

      if (isSectionHeader(line)) {
        flushPending(currentDay, currentSection, pendingExercise);
        pendingExercise = null;
        currentSection = { name: line.replace(/^#+\s*/, "").trim(), exercises: [] };
        currentDay.sections.push(currentSection);
        continue;
      }

      const numMatch = NUMBERED.exec(line);
      if (numMatch) {
        flushPending(currentDay, currentSection, pendingExercise);
        pendingExercise = buildExercise(numMatch[1].trim(), currentSection, true);
        const arrow = indexOfArrow(line);
        if (arrow >= 0) {
          applyPrescription(
            pendingExercise,
            line.slice(arrow).replace(/^[→\->]+\s*/, "")
          );
        }
        continue;
      }

      const bulletMatch = BULLET.exec(line);
      if (bulletMatch) {
        flushPending(currentDay, currentSection, pendingExercise);
        const content = bulletMatch[1].trim();
        pendingExercise = buildExercise(
          stripPrescription(content),
          currentSection,
          isMainSection(currentSection)
        );
        const arrow = indexOfArrow(content);
        if (arrow >= 0) {
          applyPrescription(
            pendingExercise,
            content.slice(arrow).replace(/^[→\->]+\s*/, "")
          );
        }
        continue;
      }

      if (line.startsWith("→") || line.startsWith("->")) {
        if (pendingExercise) {
          applyPrescription(
            pendingExercise,
            line.replace(/^[→\->]+\s*/, "").trim()
          );
          flushPending(currentDay, currentSection, pendingExercise);
          pendingExercise = null;
        }
        continue;
      }

      if (pendingExercise && SETS_REPS.test(line)) {
        applyPrescription(pendingExercise, line);
        flushPending(currentDay, currentSection, pendingExercise);
        pendingExercise = null;
        continue;
      }
    }

    flushPending(currentDay, currentSection, pendingExercise);

    if (!days.length) {
      throw new Error(
        `No training days found (last content near line ${lastMeaningfulLine}). ` +
          `Use headers like "DAY 1 – BACK + BICEPS" or "Day 1: Push".`
      );
    }

    const plan = {
      planName: "Imported 8-Week Plan",
      weeks: 8,
      rawText,
      days,
      trainingDays: days.map((d) => d.label),
      daySchedule: {},
      weekPhases: [],
    };

    for (const day of days) {
      const names = [];
      for (const section of day.sections) {
        for (const ex of section.exercises) {
          if (ex.loggable !== false && ex.name) names.push(ex.name);
        }
      }
      if (names.length) plan.daySchedule[day.label] = [...new Set(names)];
    }

    return plan;
  }

  global.parseWorkoutPlanText = parseWorkoutPlanText;
})(typeof window !== "undefined" ? window : globalThis);
