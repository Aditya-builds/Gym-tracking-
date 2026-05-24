package com.aditya.gymtracker.service;

import com.aditya.gymtracker.storage.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.enterprise.context.ApplicationScoped;

/**
 * Parses plain-text workout plans (DAY 1 – BACK, numbered exercises, bullets, → prescriptions).
 */
@ApplicationScoped
public class WorkoutPlanTextParser {

    /** DAY 1 – BACK, Day 1: Push, Day 1 - Legs */
    private static final Pattern DAY_HEADER = Pattern.compile(
            "(?i)^(?:day\\s*)?(\\d+)\\s*[–—\\-:]+\\s*(.+)$"
    );
  private static final Pattern DAY_NAME_ONLY = Pattern.compile(
            "(?i)^(push|pull|legs|upper|lower|full\\s*body)\\s*(?:day)?$"
    );
    private static final Pattern NUMBERED_EXERCISE = Pattern.compile(
            "^\\d+\\.\\s+(.+)$"
    );
    private static final Pattern BULLET_LINE = Pattern.compile(
            "^[-*•]\\s+(.+)$"
    );
    private static final Pattern ARROW_RX = Pattern.compile(
            "[→\\-–—>]\\s*(.+)$|(\\(\\s*\\d+\\s*[x×]\\s*[^)]+\\))\\s*$",
            Pattern.CASE_INSENSITIVE
    );
    private static final Pattern SETS_REPS = Pattern.compile(
            "(\\d+)\\s*[x×]\\s*([\\d–\\-]+)",
            Pattern.CASE_INSENSITIVE
    );

    private static final List<String> SKIP_SECTIONS = List.of(
            "RULES", "FOCUS CUES", "PROGRESSION", "DELOAD", "FOCUS"
    );

    public WorkoutPlan parse(String rawText) {
        WorkoutPlan plan = new WorkoutPlan();
        plan.setRawText(rawText);
        plan.setPlanName("Imported 8-Week Plan");
        plan.setWeeks(8);

        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException("Plan text is empty");
        }

        String[] lines = rawText.replace("\r\n", "\n").split("\n");
        List<String> preamble = new ArrayList<>();
        List<PlanDay> days = new ArrayList<>();
        PlanDay currentDay = null;
        PlanSection currentSection = null;
        PlanExercise pendingExercise = null;
        int lineNumber = 0;
        int lastContentLine = 0;

        for (String rawLine : lines) {
            lineNumber++;
            String line = rawLine.trim();
            if (line.isEmpty() || isDivider(line)) {
                continue;
            }
            lastContentLine = lineNumber;

            PlanDay parsedDay = parseDayHeader(line, days.size() + 1);
            if (parsedDay != null) {
                flushPending(days, currentDay, currentSection, pendingExercise);
                pendingExercise = null;
                currentDay = parsedDay;
                currentSection = null;
                days.add(currentDay);
                continue;
            }

            if (currentDay == null) {
                preamble.add(line);
                continue;
            }

            if (isSectionHeader(line)) {
                flushPending(days, currentDay, currentSection, pendingExercise);
                pendingExercise = null;
                currentSection = new PlanSection();
                currentSection.setName(cleanSectionName(line));
                currentDay.getSections().add(currentSection);
                continue;
            }

            Matcher numMatch = NUMBERED_EXERCISE.matcher(line);
            if (numMatch.find()) {
                flushPending(days, currentDay, currentSection, pendingExercise);
                pendingExercise = buildExercise(numMatch.group(1).trim(), currentSection, true);
                applyInlinePrescription(pendingExercise, line);
                continue;
            }

            Matcher bulletMatch = BULLET_LINE.matcher(line);
            if (bulletMatch.find()) {
                flushPending(days, currentDay, currentSection, pendingExercise);
                String content = bulletMatch.group(1).trim();
                boolean loggable = isMainSection(currentSection);
                pendingExercise = buildExercise(stripPrescription(content), currentSection, loggable);
                applyInlinePrescription(pendingExercise, content);
                continue;
            }

            if (line.startsWith("→") || line.startsWith("->")) {
                if (pendingExercise != null) {
                    applyPrescription(pendingExercise, line.replaceFirst("^[→\\->]+\\s*", "").trim());
                    flushPending(days, currentDay, currentSection, pendingExercise);
                    pendingExercise = null;
                }
                continue;
            }

            if (pendingExercise != null && looksLikePrescription(line)) {
                applyPrescription(pendingExercise, line);
                flushPending(days, currentDay, currentSection, pendingExercise);
                pendingExercise = null;
                continue;
            }

            if (pendingExercise != null && line.toLowerCase().startsWith("cue:")) {
                pendingExercise.setNotes(line.substring(4).trim());
            }
        }

        flushPending(days, currentDay, currentSection, pendingExercise);

        if (days.isEmpty()) {
            throw new IllegalArgumentException(
                    "No training days found"
                            + (lastContentLine > 0 ? " (last content near line " + lastContentLine + ")" : "")
                            + ". Use headers like 'DAY 1 – BACK + BICEPS' or 'Day 1: Push'."
            );
        }

        plan.setWeekPhases(parseWeekPhases(preamble));
        plan.setDays(days);
        plan.setTrainingDays(days.stream().map(PlanDay::getLabel).toList());

        for (PlanDay day : days) {
            List<String> names = day.loggableExercises().stream()
                    .map(PlanExercise::getName)
                    .distinct()
                    .toList();
            if (!names.isEmpty()) {
                plan.getDaySchedule().put(day.getLabel(), new ArrayList<>(names));
            }
        }

        return plan;
    }

    private PlanDay parseDayHeader(String line, int fallbackDayNumber) {
        Matcher dayMatch = DAY_HEADER.matcher(normalizeDashes(line));
        if (dayMatch.find()) {
            PlanDay day = new PlanDay();
            day.setDayNumber(Integer.parseInt(dayMatch.group(1)));
            day.setTitle(dayMatch.group(2).trim());
            day.setLabel("Day " + day.getDayNumber() + " – " + day.getTitle());
            return day;
        }
        Matcher nameOnly = DAY_NAME_ONLY.matcher(line.trim());
        if (nameOnly.find()) {
            String title = capitalizeDayName(nameOnly.group(1));
            PlanDay day = new PlanDay();
            day.setDayNumber(fallbackDayNumber);
            day.setTitle(title);
            day.setLabel(title);
            return day;
        }
        return null;
    }

    private String normalizeDashes(String line) {
        return line.replace('\u2013', '-').replace('\u2014', '-');
    }

    private String capitalizeDayName(String raw) {
        String t = raw.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
        if (t.isEmpty()) {
            return raw;
        }
        return Character.toUpperCase(t.charAt(0)) + t.substring(1);
    }

    private void flushPending(
            List<PlanDay> days,
            PlanDay day,
            PlanSection section,
            PlanExercise exercise
    ) {
        if (day == null || exercise == null || exercise.getName() == null || exercise.getName().isBlank()) {
            return;
        }
        if (section == null) {
            section = ensureSection(day, "General");
        }
        exercise.setSectionName(section.getName());
        section.getExercises().add(exercise);
    }

    private PlanSection ensureSection(PlanDay day, String name) {
        return day.getSections().stream()
                .filter(s -> s.getName().equals(name))
                .findFirst()
                .orElseGet(() -> {
                    PlanSection s = new PlanSection();
                    s.setName(name);
                    day.getSections().add(s);
                    return s;
                });
    }

    private PlanExercise buildExercise(String name, PlanSection section, boolean loggable) {
        PlanExercise ex = new PlanExercise();
        ex.setName(cleanExerciseName(name));
        ex.setLoggable(loggable && !isSkippedSection(section));
        if (section != null) {
            ex.setSectionName(section.getName());
        }
        return ex;
    }

    private void applyInlinePrescription(PlanExercise ex, String line) {
        int arrow = indexOfArrow(line);
        if (arrow >= 0) {
            applyPrescription(ex, line.substring(arrow).replaceFirst("^[→\\->]+\\s*", ""));
        }
        int paren = line.lastIndexOf('(');
        if (paren > 0 && line.endsWith(")")) {
            applyPrescription(ex, line.substring(paren));
        }
    }

    private void applyPrescription(PlanExercise ex, String prescription) {
        if (prescription == null || prescription.isBlank()) {
            return;
        }
        ex.setPrescription(prescription.replaceAll("^[(]|[)]$", "").trim());
        Matcher m = SETS_REPS.matcher(prescription);
        if (m.find()) {
            ex.setSets(Integer.parseInt(m.group(1)));
            ex.setReps(m.group(2).replace('–', '-'));
        }
    }

    private String stripPrescription(String content) {
        int arrow = indexOfArrow(content);
        if (arrow >= 0) {
            return content.substring(0, arrow).trim();
        }
        int paren = content.indexOf('(');
        if (paren > 0) {
            return content.substring(0, paren).trim();
        }
        return content.trim();
    }

    private int indexOfArrow(String s) {
        int i = s.indexOf('→');
        if (i >= 0) return i;
        return s.indexOf("->");
    }

    private boolean looksLikePrescription(String line) {
        return SETS_REPS.matcher(line).find()
                || line.matches("(?i).*\\d+\\s*[x×]\\s*\\d+.*")
                || line.matches("(?i)^\\d+\\s*rounds?.*");
    }

    private boolean isDivider(String line) {
        return line.matches("^-{3,}$") || line.matches("^={3,}$");
    }

    private boolean isSectionHeader(String line) {
        if (line.length() > 80) {
            return false;
        }
        if (NUMBERED_EXERCISE.matcher(line).find() || BULLET_LINE.matcher(line).find()) {
            return false;
        }
        if (line.toLowerCase().startsWith("cue:")) {
            return false;
        }
        String upper = line.toUpperCase();
        if (SKIP_SECTIONS.stream().anyMatch(upper::startsWith)) {
            return true;
        }
        return line.equals(upper)
                || line.contains("Warm-up")
                || line.contains("WARM")
                || line.contains("Main Workout")
                || line.contains("MOBILITY")
                || line.contains("Activation")
                || line.contains("BICEPS")
                || line.contains("TRICEPS")
                || line.contains("SHOULDERS")
                || line.contains("CORE")
                || line.contains("CONDITIONING")
                || line.contains("CALVES")
                || line.contains("POSTURE")
                || line.contains("REAR DELTS")
                || line.contains("Optional");
    }

    private boolean isMainSection(PlanSection section) {
        if (section == null) {
            return true;
        }
        String n = section.getName().toUpperCase();
        if (n.contains("WARM") || n.contains("MOBILITY") || n.contains("ACTIVATION")) {
            return false;
        }
        if (n.contains("RULES") || n.contains("PROGRESSION") || n.contains("DELOAD") || n.contains("FOCUS")) {
            return false;
        }
        return true;
    }

    private boolean isSkippedSection(PlanSection section) {
        if (section == null) {
            return false;
        }
        String n = section.getName().toUpperCase();
        return SKIP_SECTIONS.stream().anyMatch(n::contains);
    }

    private String cleanSectionName(String line) {
        return line.replaceAll("^#+\\s*", "").trim();
    }

    private String cleanExerciseName(String name) {
        return name.replaceAll("\\s+", " ").trim();
    }

    private List<String> parseWeekPhases(List<String> preamble) {
        List<String> phases = new ArrayList<>();
        for (String line : preamble) {
            if (line.toLowerCase().contains("week")) {
                phases.add(line);
            }
        }
        return phases;
    }
}
