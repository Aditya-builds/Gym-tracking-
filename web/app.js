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

async function loadDashboard() {
  const overview = document.getElementById("dashboard-overview");
  const prs = document.getElementById("dashboard-prs");
  try {
    const dash = await api("/api/dashboard");
    overview.innerHTML = `
      <div class="stat"><div class="value">${dash.completionPercentage?.toFixed(0) ?? 0}%</div><div class="label">Completion</div></div>
      <div class="stat"><div class="value">${dash.totalWorkoutSessions ?? 0}</div><div class="label">Sessions</div></div>
      <div class="stat"><div class="value">${dash.latestWeight ?? "—"}</div><div class="label">Weight kg</div></div>
      <div class="stat"><div class="value">${dash.latestWaist ?? "—"}</div><div class="label">Waist</div></div>
      <div class="stat"><div class="value">${dash.totalPRs ?? 0}</div><div class="label">PRs</div></div>`;
    const messages = dash.latestPRMessages || [];
    prs.innerHTML = messages.length
      ? messages.map((m) => `<div class="log-item">${escapeHtml(m)}</div>`).join("")
      : '<p class="hint">No PRs yet — log heavy sets on Workouts.</p>';
  } catch {
    overview.innerHTML = '<p class="hint">Start backend on port 8080.</p>';
    prs.innerHTML = "";
  }
}

async function listExerciseEntryOptions() {
  const sessions = await api("/api/workouts");
  const sorted = [...sessions].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
  const byName = new Map();
  for (const s of sorted) {
    const entries = await api(`/api/exercises/session/${s.id}`);
    for (const e of entries) {
      const prev = byName.get(e.exerciseName);
      if (!prev || e.id > prev.id) {
        byName.set(e.exerciseName, { id: e.id, name: e.exerciseName });
      }
    }
  }
  return Array.from(byName.values());
}

async function loadAnalytics() {
  const sel = document.getElementById("analytics-exercise");
  const volEl = document.getElementById("analytics-volume");
  const setsEl = document.getElementById("analytics-sets");
  try {
    const options = await listExerciseEntryOptions();
    const current = sel.value;
    sel.innerHTML = options
      .map((o) => `<option value="${o.id}">${escapeHtml(o.name)}</option>`)
      .join("");
    if (current && options.some((o) => String(o.id) === current)) sel.value = current;
    if (!sel.value && options[0]) sel.value = String(options[0].id);
    if (!sel.value) {
      volEl.innerHTML = '<p class="hint">Log workouts first.</p>';
      setsEl.innerHTML = "";
      return;
    }
    const entryId = sel.value;
    const [volume, progress] = await Promise.all([
      api(`/api/analytics/volume/${entryId}`),
      api(`/api/analytics/exercise/${entryId}`),
    ]);
    const maxVol = Math.max(...volume.map((v) => Number(v.totalVolume) || 0), 1);
    volEl.innerHTML = volume.length
      ? volume
          .map((v) => {
            const pct = Math.round((Number(v.totalVolume) / maxVol) * 100);
            return `<div class="summary-card"><h3>Week ${v.weekNumber}</h3><p>Volume: ${v.totalVolume}</p><div style="background:#0f1520;height:8px;border-radius:4px;margin-top:8px"><div style="width:${pct}%;height:100%;background:var(--accent);border-radius:4px"></div></div></div>`;
          })
          .join("")
      : '<p class="hint">No volume data for this exercise.</p>';
    setsEl.innerHTML = progress.length
      ? progress
          .map(
            (p) =>
              `<div class="log-item">${escapeHtml(p.exerciseName)} · ${p.weight}kg × ${p.reps} · vol ${p.volume} · e1RM ${p.estimatedOneRepMax?.toFixed?.(1) ?? p.estimatedOneRepMax}</div>`
          )
          .join("")
      : '<p class="hint">No sets logged.</p>';
  } catch {
    volEl.innerHTML = '<p class="hint">API unavailable.</p>';
    setsEl.innerHTML = "";
  }
}

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

loadPlanAndCatalog();
loadDashboard();
loadWorkoutLog();
