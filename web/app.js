const API_BASE = localStorage.getItem("gym_api_base") || "http://localhost:8080";
const LS_KEY = "gym_tracker_cache";
const LOG_FORM_KEY = "gym_log_form";

document.getElementById("api-url").textContent = API_BASE;

const DEFAULT_DAYS = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body"];
let exerciseCatalog = [];
let workoutPlan = null;

function normalizeDayKey(value) {
  return String(value || "")
    .replace(/\u2013|\u2014/g, "-")
    .trim()
    .toLowerCase();
}

function findPlanDay(dayLabel) {
  if (!workoutPlan?.days?.length) return null;
  const key = normalizeDayKey(dayLabel);
  return (
    workoutPlan.days.find((d) => normalizeDayKey(d.label) === key) ||
    workoutPlan.days.find((d) => normalizeDayKey(d.title) === key)
  );
}

function hasUploadedPlan() {
  return Boolean(
    workoutPlan?.days?.length ||
      (workoutPlan?.daySchedule && Object.keys(workoutPlan.daySchedule).length)
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast" + (isError ? " error" : "");
  setTimeout(() => el.classList.add("hidden"), 3200);
}

async function api(path, options = {}) {
  const headers = { Accept: "application/json", ...(options.headers || {}) };
  const bodyIsObject =
    options.body != null &&
    typeof options.body === "object" &&
    !(options.body instanceof FormData);
  const bodyIsJsonString =
    typeof options.body === "string" &&
    options.body.trim().startsWith("{");
  if ((bodyIsObject || bodyIsJsonString) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const fetchOpts = { ...options, headers };
  if (bodyIsObject) {
    fetchOpts.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${path}`, fetchOpts);
  if (!res.ok) {
    const text = await res.text();
    let message = text || `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "string") message = parsed;
      else if (parsed?.message) message = parsed.message;
    } catch {
      /* plain text error from API */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function cacheSet(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function cacheGet() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "null");
  } catch {
    return null;
  }
}

// --- Tabs ---
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "dashboard") loadDashboard();
    if (btn.dataset.tab === "summary") loadSummary();
    if (btn.dataset.tab === "analytics") loadAnalytics();
    if (btn.dataset.tab === "measurements") loadMeasurements();
    if (btn.dataset.tab === "workouts") loadWorkoutLog();
  });
});

// --- Init form defaults ---
document.getElementById("m-date").value = today();
restoreLogForm();

function saveLogForm() {
  localStorage.setItem(
    LOG_FORM_KEY,
    JSON.stringify({
      date: document.getElementById("w-date").value,
      week: document.getElementById("w-week").value,
      day: document.getElementById("w-day").value,
      set: document.getElementById("w-set").value,
    })
  );
}

function restoreLogForm() {
  const saved = (() => {
    try {
      return JSON.parse(localStorage.getItem(LOG_FORM_KEY) || "null");
    } catch {
      return null;
    }
  })();
  document.getElementById("w-date").value = saved?.date || today();
  document.getElementById("w-week").value = saved?.week || "1";
  document.getElementById("w-set").value = saved?.set || "1";
  return saved?.day || null;
}

function applyPlanToUI(plan, preferredDay) {
  workoutPlan = plan;
  cacheSet({ ...(cacheGet() || {}), plan });
  fillDaySelect(preferredDay);
  fillExerciseSelect();
  renderPlanPreview(plan);
}

function fillDaySelect(preferredDay) {
  const sel = document.getElementById("w-day");
  let options = [];

  if (workoutPlan?.days?.length) {
    options = workoutPlan.days.map((d) => ({
      value: d.label,
      label: d.label,
    }));
  } else if (workoutPlan?.trainingDays?.length) {
    options = workoutPlan.trainingDays.map((d) => ({ value: d, label: d }));
  } else if (workoutPlan?.daySchedule) {
    options = Object.keys(workoutPlan.daySchedule).map((d) => ({
      value: d,
      label: d,
    }));
  } else {
    options = DEFAULT_DAYS.map((d) => ({ value: d, label: d }));
  }

  sel.innerHTML = options
    .map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`)
    .join("");

  if (preferredDay) {
    const match = [...sel.options].find(
      (o) => normalizeDayKey(o.value) === normalizeDayKey(preferredDay)
    );
    if (match) sel.value = match.value;
  }
}

function exercisesForDay(dayLabel) {
  const planDay = findPlanDay(dayLabel);
  const collected = [];

  if (planDay?.sections?.length) {
    for (const section of planDay.sections) {
      for (const ex of section.exercises || []) {
        if (ex.loggable === false || !ex.name) continue;
        collected.push({ ...ex, sectionName: section.name });
      }
    }
  }

  if (!collected.length && workoutPlan?.daySchedule) {
    const key = Object.keys(workoutPlan.daySchedule).find(
      (k) => normalizeDayKey(k) === normalizeDayKey(dayLabel)
    );
    const names = key ? workoutPlan.daySchedule[key] : [];
    names.forEach((name) => collected.push({ name, sectionName: "Plan" }));
  }

  return collected;
}

function fillExerciseSelect() {
  const sel = document.getElementById("w-exercise");
  const dayLabel = document.getElementById("w-day").value;
  sel.innerHTML = "";

  const planExercises = exercisesForDay(dayLabel);

  if (planExercises.length) {
    const bySection = new Map();
    for (const ex of planExercises) {
      const section = ex.sectionName || "Exercises";
      if (!bySection.has(section)) bySection.set(section, []);
      bySection.get(section).push(ex);
    }
    for (const [sectionName, items] of bySection) {
      const og = document.createElement("optgroup");
      og.label = sectionName;
      for (const ex of items) {
        const opt = document.createElement("option");
        opt.value = ex.name;
        opt.textContent = ex.prescription
          ? `${ex.name} — ${ex.prescription}`
          : ex.name;
        opt.dataset.prescription = ex.prescription || "";
        opt.dataset.sets = ex.sets || "";
        opt.dataset.reps = ex.reps || "";
        og.appendChild(opt);
      }
      sel.appendChild(og);
    }
  } else if (hasUploadedPlan()) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No exercises for this day — re-parse plan";
    opt.disabled = true;
    opt.selected = true;
    sel.appendChild(opt);
  } else {
    exerciseCatalog.forEach((e) => {
      const name = e.exerciseName || e.name;
      if (!name) return;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });
  }

  updateExerciseTarget();
  saveLogForm();
}

function updateExerciseTarget() {
  const sel = document.getElementById("w-exercise");
  const target = document.getElementById("exercise-target");
  const opt = sel.selectedOptions[0];
  if (!opt) {
    target.classList.add("hidden");
    return;
  }
  const rx = opt.dataset.prescription;
  if (rx) {
    target.textContent = `Target: ${rx}`;
    target.classList.remove("hidden");
  } else {
    target.classList.add("hidden");
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function renderPlanPreview(plan) {
  const el = document.getElementById("plan-preview");
  if (!plan?.days?.length) {
    el.innerHTML = "<p>No plan parsed yet.</p>";
    return;
  }
  let html = "";
  if (plan.weekPhases?.length) {
    html += `<p><strong>Phases:</strong> ${plan.weekPhases.join(" · ")}</p>`;
  }
  for (const day of plan.days) {
    html += `<h4>${escapeHtml(day.label)}</h4><ul>`;
    const items =
      day.sections?.flatMap((s) =>
        (s.exercises || []).filter((e) => e.loggable !== false)
      ) || [];
    const names = items.length
      ? items.map((e) => e.name)
      : plan.daySchedule?.[day.label] || [];
    names.slice(0, 12).forEach((n) => {
      html += `<li>${escapeHtml(typeof n === "string" ? n : n.name)}</li>`;
    });
    if (names.length > 12) html += `<li>…+${names.length - 12} more</li>`;
    html += "</ul>";
  }
  el.innerHTML = html;
}

// --- Plan builder (days + exercise names only; sets/weight logged when training) ---
let builderDays = [
  { title: "", exercises: [{ name: "" }] },
  { title: "", exercises: [{ name: "" }] },
  { title: "", exercises: [{ name: "" }] },
];

function resizeBuilderDays(count) {
  const clamped = Math.min(7, Math.max(1, count));
  while (builderDays.length < clamped) {
    builderDays.push({ title: "", exercises: [{ name: "" }] });
  }
  builderDays = builderDays.slice(0, clamped);
  return clamped;
}

function planToBuilderDays(plan) {
  if (!plan?.days?.length) return resizeBuilderDays(3);
  builderDays = plan.days.map((day) => ({
    title: day.title || String(day.label || "").replace(/^Day \d+\s*[–-]\s*/i, ""),
    exercises:
      day.sections?.flatMap((s) => s.exercises || []).length > 0
        ? day.sections.flatMap((s) =>
            (s.exercises || []).map((ex) => ({ name: ex.name || "" }))
          )
        : [{ name: "" }],
  }));
  document.getElementById("builder-day-count").value = builderDays.length;
}

function buildPlanPayloadFromBuilder() {
  const planName = document.getElementById("builder-plan-name").value.trim() || "My Workout Plan";
  const weeks = Math.min(12, Math.max(1, parseInt(document.getElementById("builder-weeks").value, 10) || 8));

  const days = builderDays.map((draft, index) => {
    const title = draft.title.trim() || `Training ${index + 1}`;
    const label = `Day ${index + 1} – ${title}`;
    const exercises = draft.exercises
      .filter((ex) => ex.name.trim())
      .map((ex) => ({
        name: ex.name.trim(),
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

  const trainingDays = days.map((d) => d.label);
  const daySchedule = {};
  for (const day of days) {
    daySchedule[day.label] = day.sections.flatMap((s) => s.exercises.map((e) => e.name));
  }

  return { planName, weeks, trainingDays, daySchedule, days };
}

function renderPlanBuilder() {
  const container = document.getElementById("plan-builder-days");
  if (!container) return;
  container.innerHTML = "";

  builderDays.forEach((day, dayIndex) => {
    const card = document.createElement("div");
    card.className = "plan-builder-day";
    card.innerHTML = `<h4>Day ${dayIndex + 1}</h4>`;

    const titleField = document.createElement("label");
    titleField.className = "field";
    titleField.innerHTML = "<span>Day name</span>";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = day.title;
    titleInput.placeholder = "e.g. Push, Legs, Upper Body";
    titleInput.addEventListener("input", (e) => {
      builderDays[dayIndex].title = e.target.value;
    });
    titleField.appendChild(titleInput);
    card.appendChild(titleField);

    const exLabel = document.createElement("p");
    exLabel.className = "hint";
    exLabel.textContent = "Exercises (weight & sets logged when you train)";
    card.appendChild(exLabel);

    day.exercises.forEach((exercise, exerciseIndex) => {
      const row = document.createElement("div");
      row.className = "plan-builder-exercise-row";

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Exercise name";
      nameInput.value = exercise.name;
      nameInput.addEventListener("input", (e) => {
        builderDays[dayIndex].exercises[exerciseIndex].name = e.target.value;
      });

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "btn icon-btn";
      removeBtn.textContent = "×";
      removeBtn.title = "Remove exercise";
      removeBtn.addEventListener("click", () => {
        builderDays[dayIndex].exercises.splice(exerciseIndex, 1);
        if (!builderDays[dayIndex].exercises.length) {
          builderDays[dayIndex].exercises.push({ name: "" });
        }
        renderPlanBuilder();
      });

      row.append(nameInput, removeBtn);
      card.appendChild(row);
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn secondary small";
    addBtn.textContent = "+ Add exercise";
    addBtn.addEventListener("click", () => {
      builderDays[dayIndex].exercises.push({ name: "" });
      renderPlanBuilder();
    });
    card.appendChild(addBtn);

    container.appendChild(card);
  });
}

function initPlanBuilder() {
  const dayCountInput = document.getElementById("builder-day-count");
  if (!dayCountInput) return;

  dayCountInput.addEventListener("change", () => {
    const count = resizeBuilderDays(parseInt(dayCountInput.value, 10) || 1);
    dayCountInput.value = count;
    renderPlanBuilder();
  });

  document.getElementById("btn-save-built-plan")?.addEventListener("click", async () => {
    const payload = buildPlanPayloadFromBuilder();
    const hasExercise = payload.days.some((d) =>
      d.sections.some((s) => s.exercises.length > 0)
    );
    if (!hasExercise) {
      toast("Add at least one exercise", true);
      return;
    }
    try {
      const plan = await api("/api/plan/import", { method: "POST", body: payload });
      applyPlanToUI(plan);
      toast(`Saved ${plan.days?.length || payload.days.length} training days`);
    } catch (e) {
      toast(e.message || "Could not save plan", true);
    }
  });

  renderPlanBuilder();
}

document.getElementById("w-day").addEventListener("change", () => {
  fillExerciseSelect();
  saveLogForm();
});
document.getElementById("w-exercise").addEventListener("change", updateExerciseTarget);
["w-date", "w-week"].forEach((id) => {
  document.getElementById(id).addEventListener("change", saveLogForm);
});

async function loadPlanAndCatalog() {
  try {
    workoutPlan = await api("/api/plan");
    if (workoutPlan?.exercises) {
      exerciseCatalog = workoutPlan.exercises;
    }
  } catch {
    workoutPlan = cacheGet()?.plan || null;
    exerciseCatalog = cacheGet()?.exercises || [];
  }

  if (!exerciseCatalog.length) {
    exerciseCatalog = [
      { exerciseName: "Pull-up" },
      { exerciseName: "Lat Pulldown" },
      { exerciseName: "Barbell Hip Thrust" },
      { exerciseName: "Back Squat" },
      { exerciseName: "Romanian Deadlift" },
    ];
  }

  const savedDay = restoreLogForm();
  applyPlanToUI(workoutPlan, savedDay);
  if (workoutPlan) {
    document.getElementById("builder-plan-name").value = workoutPlan.planName || "My Workout Plan";
    document.getElementById("builder-weeks").value = workoutPlan.weeks || 8;
    planToBuilderDays(workoutPlan);
    renderPlanBuilder();
  }
}

async function importPlanText(text) {
  let apiError = null;
  try {
    const plan = await api("/api/plan/import/text", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: text,
    });
    applyPlanToUI(plan);
    return plan;
  } catch (err) {
    apiError = err;
    console.error("API plan import failed:", err.message || err);
  }

  let parsed;
  try {
    parsed = parseWorkoutPlanText(text);
  } catch (parseErr) {
    console.error("Client parse failed:", parseErr.message);
    if (apiError) {
      console.error("Backend error was:", apiError.message);
    }
    throw parseErr;
  }

  try {
    const plan = await api("/api/plan/import", {
      method: "POST",
      body: parsed,
    });
    applyPlanToUI(plan);
    if (apiError) {
      console.warn("Recovered via client parse + JSON import after:", apiError.message);
    }
    return plan;
  } catch (jsonErr) {
    console.error("JSON plan import failed:", jsonErr.message || jsonErr);
    applyPlanToUI(parsed);
    console.warn("Using client-parsed plan in browser only (API unavailable)");
    if (apiError) console.error("Original API error:", apiError.message);
    return parsed;
  }
}

document.getElementById("btn-parse-plan").addEventListener("click", async () => {
  const text = document.getElementById("plan-text").value.trim();
  if (!text) {
    toast("Paste your workout plan first", true);
    return;
  }
  try {
    const plan = await importPlanText(text);
    const dayCount =
      plan.days?.length ||
      plan.trainingDays?.length ||
      Object.keys(plan.daySchedule || {}).length;
    toast(`Parsed ${dayCount} training day${dayCount === 1 ? "" : "s"}`);
  } catch (e) {
    toast(e.message || "Parse failed — check format or backend", true);
    console.error("Parse & save plan failed:", e);
  }
});

async function findOrCreateSession(date, week, day) {
  const sessions = await api("/api/workouts");
  let session = sessions.find(
    (s) => s.workoutDate === date && s.weekNumber === week && s.trainingDay === day
  );
  if (!session) {
    session = await api("/api/workouts", {
      method: "POST",
      body: JSON.stringify({
        workoutDate: date,
        weekNumber: week,
        trainingDay: day,
        completed: false,
      }),
    });
  }
  return session;
}

async function findExerciseDefByName(name) {
  const plan = await api("/api/plan").catch(() => ({ exercises: exerciseCatalog }));
  const list = plan?.exercises || exerciseCatalog;
  const found = list.find(
    (e) => (e.exerciseName || e.name || "").toLowerCase() === name.toLowerCase()
  );
  return found?.id || 1;
}

async function findOrCreateExerciseEntry(sessionId, exerciseName) {
  const entries = await api(`/api/exercises/session/${sessionId}`);
  let entry = entries.find(
    (e) => e.exerciseName?.toLowerCase() === exerciseName.toLowerCase()
  );
  if (!entry) {
    const defId = await findExerciseDefByName(exerciseName);
    entry = await api("/api/exercises", {
      method: "POST",
      body: JSON.stringify({
        workoutSessionId: sessionId,
        exerciseDefinitionId: defId,
        orderIndex: entries.length + 1,
        exerciseNotes: document.getElementById("w-notes").value || undefined,
      }),
    });
  }
  return entry;
}

document.getElementById("btn-save-set").addEventListener("click", async () => {
  const date = document.getElementById("w-date").value;
  const week = parseInt(document.getElementById("w-week").value, 10);
  const day = document.getElementById("w-day").value;
  const exerciseName = document.getElementById("w-exercise").value;
  const setNum = parseInt(document.getElementById("w-set").value, 10);
  const weight = parseFloat(document.getElementById("w-weight").value);
  const reps = parseInt(document.getElementById("w-reps").value, 10);
  const rirRaw = document.getElementById("w-rir").value;

  if (!date || !day || !exerciseName || !weight || !reps) {
    toast("Fill date, day, exercise, weight, and reps", true);
    return;
  }

  try {
    const session = await findOrCreateSession(date, week, day);
    const entry = await findOrCreateExerciseEntry(session.id, exerciseName);
    await api("/api/sets", {
      method: "POST",
      body: JSON.stringify({
        exerciseEntryId: entry.id,
        setNumber: setNum,
        weight,
        reps,
        rir: rirRaw ? parseInt(rirRaw, 10) : undefined,
      }),
    });
    toast("Set saved");
    document.getElementById("w-set").value = String(setNum + 1);
    document.getElementById("w-weight").value = "";
    document.getElementById("w-reps").value = "";
    document.getElementById("w-rir").value = "";
    saveLogForm();
    loadWorkoutLog();
  } catch (e) {
    toast("Save failed — is the backend running?", true);
    console.error(e);
  }
});

async function loadWorkoutLog() {
  const list = document.getElementById("workout-log-list");
  try {
    const sessions = await api("/api/workouts");
    const items = [];
    for (const s of sessions.slice(0, 8)) {
      const entries = await api(`/api/exercises/session/${s.id}`);
      for (const ex of entries) {
        const sets = await api(`/api/sets/exercise/${ex.id}`);
        for (const set of sets) {
          items.push(
            `<div class="log-item"><strong>${s.trainingDay}</strong> W${s.weekNumber} · ${ex.exerciseName} · Set ${set.setNumber}: ${set.weight}kg × ${set.reps}${set.isPr ? " · PR" : ""}</div>`
          );
        }
      }
    }
    list.innerHTML = items.length ? items.join("") : '<p class="hint">No sets logged yet.</p>';
  } catch {
    list.innerHTML = '<p class="hint">Connect to API to see workout history.</p>';
  }
}

document.getElementById("btn-clear-workouts").addEventListener("click", async () => {
  if (!confirm("Delete ALL workout sessions? This cannot be undone.")) return;
  try {
    const sessions = await api("/api/workouts");
    for (const s of sessions) {
      await api(`/api/workouts/${s.id}`, { method: "DELETE" });
    }
    toast("All workouts cleared");
    loadWorkoutLog();
  } catch {
    toast("Clear failed", true);
  }
});

document.getElementById("plan-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    document.getElementById("plan-text").value = text;
    if (file.name.endsWith(".json")) {
      const plan = JSON.parse(text);
      await api("/api/plan/import", { method: "POST", body: plan });
      workoutPlan = await api("/api/plan");
    } else {
      workoutPlan = await importPlanText(text);
    }
    applyPlanToUI(workoutPlan);
    toast(`Plan loaded — ${workoutPlan.days?.length || 0} days`);
  } catch (err) {
    toast(err.message || "Could not read plan file", true);
    console.error("Plan file import failed:", err);
  }
  e.target.value = "";
});

document.getElementById("btn-save-measurement").addEventListener("click", async () => {
  const payload = {
    measurementDate: document.getElementById("m-date").value,
    weekNumber: parseInt(document.getElementById("m-week").value, 10),
    bodyWeight: num("m-weight"),
    waistNavel: num("m-waist-navel"),
    waistSmallest: num("m-waist-small"),
    hips: num("m-hips"),
    thigh: num("m-thigh"),
    chest: num("m-chest"),
    shoulders: num("m-shoulders"),
    arm: num("m-arm"),
    notes: document.getElementById("m-notes").value || undefined,
  };

  try {
    await api("/api/measurements", { method: "POST", body: JSON.stringify(payload) });
    toast("Measurement saved");
    loadMeasurements();
  } catch {
    toast("Save failed", true);
  }
});

function num(id) {
  const v = parseFloat(document.getElementById(id).value);
  return Number.isNaN(v) ? undefined : v;
}

async function loadMeasurements() {
  const list = document.getElementById("measurement-list");
  try {
    const data = await api("/api/measurements");
    list.innerHTML = data.length
      ? data
          .map(
            (m) =>
              `<div class="log-item">Week ${m.weekNumber} · ${m.measurementDate} · ${m.bodyWeight || "—"}kg · waist ${m.waistNavel || "—"} · hips ${m.hips || "—"}</div>`
          )
          .join("")
      : '<p class="hint">No measurements yet.</p>';
  } catch {
    list.innerHTML = '<p class="hint">API unavailable.</p>';
  }
}

function weeklyFieldToChart(weekly, field) {
  return [...weekly]
    .sort((a, b) => a.weekNumber - b.weekNumber)
    .filter((w) => w[field] != null && !Number.isNaN(Number(w[field])))
    .map((w) => ({ label: `W${w.weekNumber}`, value: Number(w[field]) }));
}

function measurementWeightChart(measurements) {
  return [...measurements]
    .filter((m) => m.bodyWeight != null && !Number.isNaN(Number(m.bodyWeight)))
    .sort((a, b) => String(a.measurementDate).localeCompare(String(b.measurementDate)))
    .map((m) => ({
      label: String(m.measurementDate).slice(5),
      value: Number(m.bodyWeight),
    }));
}

async function loadDashboard() {
  const overview = document.getElementById("dashboard-overview");
  const charts = document.getElementById("dashboard-charts");
  const prs = document.getElementById("dashboard-prs");
  try {
    const [dash, weekly, measurements] = await Promise.all([
      api("/api/dashboard"),
      api("/api/summary/weekly"),
      api("/api/measurements").catch(() => []),
    ]);
    overview.innerHTML = `
      <div class="stat"><div class="value">${dash.completionPercentage?.toFixed(0) ?? 0}%</div><div class="label">Completion</div></div>
      <div class="stat"><div class="value">${dash.totalWorkoutSessions ?? 0}</div><div class="label">Sessions</div></div>
      <div class="stat"><div class="value">${dash.latestWeight ?? "—"}</div><div class="label">Weight kg</div></div>
      <div class="stat"><div class="value">${dash.latestWaist ?? "—"}</div><div class="label">Waist</div></div>
      <div class="stat"><div class="value">${dash.totalPRs ?? 0}</div><div class="label">PRs</div></div>`;

    if (charts) {
      const weightPoints = measurementWeightChart(measurements);
      const weightChart =
        weightPoints.length > 0
          ? weightPoints
          : weeklyFieldToChart(weekly, "bodyWeight");
      charts.innerHTML = `
        <h3 class="section-heading">Trends</h3>
        <div class="chart-card">${renderProgressChartHtml(weightChart, "Body weight", "kg")}</div>
        <div class="chart-card">${renderProgressChartHtml(weeklyFieldToChart(weekly, "totalVolume"), "Weekly training volume", "kg")}</div>
        <div class="chart-card">${renderProgressChartHtml(weeklyFieldToChart(weekly, "waist"), "Waist", "cm")}</div>`;
    }

    const messages = dash.latestPRMessages || [];
    prs.innerHTML = messages.length
      ? `<h3 class="section-heading">Recent PRs</h3>${messages.map((m) => `<div class="log-item">${escapeHtml(m)}</div>`).join("")}`
      : '<p class="hint">No PRs yet — log heavy sets on Workouts.</p>';
  } catch {
    overview.innerHTML = '<p class="hint">Start backend on port 8080.</p>';
    if (charts) charts.innerHTML = "";
    prs.innerHTML = "";
  }
}

function bestWeightBySession(points) {
  const byDate = new Map();
  for (const p of points) {
    const date = p.workoutDate || (p.createdAt ? String(p.createdAt).slice(0, 10) : "?");
    const weight = Number(p.weight) || 0;
    byDate.set(date, Math.max(byDate.get(date) ?? 0, weight));
  }
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label: label.slice(5), value }));
}

function renderProgressChartHtml(points, title, unit = "kg") {
  if (!points.length) {
    return `<p class="chart-empty">${escapeHtml(title)} — no data yet.</p>`;
  }
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 600;
  const height = 160;
  const pad = 16;

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : pad + (index / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (point.value - min) / range) * (height - pad * 2);
    return { x, y, label: point.label, value: point.value };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const dots = coords
    .map(
      (c) =>
        `<circle cx="${c.x}" cy="${c.y}" r="5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"><title>${escapeHtml(c.label)}: ${c.value.toFixed(1)} ${unit}</title></circle>`
    )
    .join("");
  const labels = coords
    .map(
      (c) =>
        `<text x="${c.x}" y="${height - 2}" text-anchor="middle" fill="var(--muted)" font-size="10">${escapeHtml(c.label)}</text>`
    )
    .join("");

  return `
    <h4 style="margin:0 0 0.5rem;color:var(--text)">${escapeHtml(title)}</h4>
    <svg viewBox="0 0 ${width} ${height + 18}" preserveAspectRatio="none">
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="var(--border)" stroke-width="1"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="var(--border)" stroke-width="1"/>
      ${points.length > 1 ? `<polyline fill="none" stroke="var(--accent)" stroke-width="2.5" points="${line}" opacity="0.9"/>` : ""}
      ${dots}
      ${labels}
    </svg>
    <p class="chart-meta">Peak ${max.toFixed(1)} ${unit} · Latest ${points[points.length - 1].value.toFixed(1)} ${unit}</p>`;
}

function renderProgressChart(container, points, title) {
  if (!container) return;
  container.innerHTML = renderProgressChartHtml(points, title, "kg");
}

function populateAnalyticsDaySelect() {
  const daySel = document.getElementById("analytics-day");
  if (!daySel) return;
  const days = workoutPlan?.days || [];
  daySel.innerHTML = days
    .map((d) => `<option value="${escapeHtml(d.label)}">${escapeHtml(d.title || d.label)}</option>`)
    .join("");
  if (!days.length) {
    daySel.innerHTML = '<option value="">No plan — build one on Workouts</option>';
  }
}

function populateAnalyticsExerciseSelect(dayLabel) {
  const exSel = document.getElementById("analytics-exercise");
  if (!exSel) return;
  const exercises = exercisesForDay(dayLabel);
  exSel.innerHTML = exercises.length
    ? exercises.map((e) => `<option value="${escapeHtml(e.name)}">${escapeHtml(e.name)}</option>`).join("")
    : '<option value="">No exercises on this day</option>';
}

async function loadAnalytics() {
  const daySel = document.getElementById("analytics-day");
  const exSel = document.getElementById("analytics-exercise");
  const chartEl = document.getElementById("analytics-chart");
  const volEl = document.getElementById("analytics-volume");
  const setsEl = document.getElementById("analytics-sets");

  try {
    if (!workoutPlan?.days?.length) {
      workoutPlan = await api("/api/plan").catch(() => workoutPlan);
    }
    populateAnalyticsDaySelect();
    const dayLabel = daySel?.value || workoutPlan?.days?.[0]?.label;
    if (daySel && dayLabel) daySel.value = dayLabel;
    populateAnalyticsExerciseSelect(dayLabel);
    const exerciseName = exSel?.value;
    if (!dayLabel || !exerciseName) {
      chartEl.innerHTML = '<p class="chart-empty">Set up your plan and log sets first.</p>';
      volEl.innerHTML = "";
      setsEl.innerHTML = "";
      return;
    }

    const q = new URLSearchParams({ name: exerciseName, trainingDay: dayLabel });
    const [progress, volume] = await Promise.all([
      api(`/api/analytics/by-name?${q}`),
      api(`/api/analytics/volume-by-name?${q}`),
    ]);

    renderProgressChart(chartEl, bestWeightBySession(progress), "Best weight per session");

    const maxVol = Math.max(...volume.map((v) => Number(v.totalVolume) || 0), 1);
    volEl.innerHTML = volume.length
      ? volume
          .map((v) => {
            const pct = Math.round((Number(v.totalVolume) / maxVol) * 100);
            return `<div class="summary-card"><h3>Week ${v.weekNumber}</h3><p>Volume: ${v.totalVolume}</p><div style="background:#0f1520;height:8px;border-radius:4px;margin-top:8px"><div style="width:${pct}%;height:100%;background:var(--accent);border-radius:4px"></div></div></div>`;
          })
          .join("")
      : '<p class="hint">No volume data yet.</p>';

    setsEl.innerHTML = progress.length
      ? progress
          .map(
            (p) =>
              `<div class="log-item">${escapeHtml(p.workoutDate || "—")} · ${p.weight}kg × ${p.reps} · vol ${p.volume} · e1RM ${p.estimatedOneRepMax?.toFixed?.(1) ?? p.estimatedOneRepMax}${p.setNumber ? ` · set ${p.setNumber}` : ""}</div>`
          )
          .join("")
      : '<p class="hint">No sets logged for this exercise on this day.</p>';
  } catch {
    chartEl.innerHTML = '<p class="chart-empty">API unavailable.</p>';
    volEl.innerHTML = "";
    setsEl.innerHTML = "";
  }
}

document.getElementById("analytics-day")?.addEventListener("change", () => {
  populateAnalyticsExerciseSelect(document.getElementById("analytics-day").value);
  loadAnalytics();
});
document.getElementById("analytics-exercise")?.addEventListener("change", loadAnalytics);

async function loadSummary() {
  const grid = document.getElementById("summary-grid");
  const stats = document.getElementById("dashboard-stats");
  try {
    const [weekly, dash] = await Promise.all([
      api("/api/summary/weekly"),
      api("/api/dashboard"),
    ]);

    grid.innerHTML = weekly.length
      ? weekly
          .map(
            (w) => `
        <div class="summary-card">
          <h3>Week ${w.weekNumber}</h3>
          <p>Weight: ${w.bodyWeight ?? "—"} kg · Waist: ${w.waist ?? "—"} · Hips: ${w.hips ?? "—"}</p>
          <p>Volume: ${w.totalVolume ?? "—"} · Squat: ${w.bestSquat ?? "—"} · Hip thrust: ${w.bestHipThrust ?? "—"}</p>
        </div>`
          )
          .join("")
      : '<p class="hint">Log workouts and measurements to see weekly trends.</p>';

    stats.innerHTML = `
      <div class="stat"><div class="value">${dash.completionPercentage?.toFixed(0) ?? 0}%</div><div class="label">Completion</div></div>
      <div class="stat"><div class="value">${dash.latestWeight ?? "—"}</div><div class="label">Latest weight (kg)</div></div>
      <div class="stat"><div class="value">${dash.latestWaist ?? "—"}</div><div class="label">Latest waist</div></div>
      <div class="stat"><div class="value">${dash.totalPRs ?? 0}</div><div class="label">PRs</div></div>`;
  } catch {
    grid.innerHTML = '<p class="hint">Start backend on port 8080.</p>';
  }
}

document.getElementById("btn-export").addEventListener("click", async () => {
  try {
    const [workouts, measurements, weekly] = await Promise.all([
      api("/api/workouts"),
      api("/api/measurements"),
      api("/api/summary/weekly"),
    ]);
    const blob = new Blob(
      [JSON.stringify({ workouts, measurements, weekly, plan: workoutPlan, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `gym-backup-${today()}.json`;
    a.click();
    toast("Backup downloaded");
  } catch {
    const cached = cacheGet();
    if (cached) {
      const blob = new Blob([JSON.stringify(cached, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `gym-cache-${today()}.json`;
      a.click();
    }
    toast("Exported local cache only", true);
  }
});

document.getElementById("backup-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    await api("/api/backup/import", { method: "POST", body: JSON.stringify(data) });
    toast("Backup imported");
    loadPlanAndCatalog();
    loadWorkoutLog();
  } catch {
    cacheSet(JSON.parse(await file.text()));
    toast("Saved to browser cache (API import unavailable)", true);
  }
  e.target.value = "";
});

document.getElementById("btn-sync-api").addEventListener("click", async () => {
  const status = document.getElementById("backup-status");
  try {
    const dash = await api("/api/dashboard");
    status.textContent = `Synced OK — completion ${dash.completionPercentage}%`;
    toast("Synced");
  } catch (e) {
    status.textContent = String(e);
    toast("Sync failed", true);
  }
});

initPlanBuilder();
loadPlanAndCatalog();
loadDashboard();
loadWorkoutLog();
