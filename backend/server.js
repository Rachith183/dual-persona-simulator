import cors from "cors";
import "dotenv/config";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.resolve(__dirname, "..");
const frontendDirectory = path.join(rootDirectory, "frontend");
const layersDirectory = path.join(rootDirectory, "layers expression");
const port = Number(process.env.PORT || 3000);
const modelName = "gemini-1.5-pro";
const EXPRESSION_FLAGS = [
  "state-analytical",
  "state-listening",
  "state-thinking",
  "state-focused",
  "state-smirk",
  "state-skeptical",
  "state-warning",
  "state-mask-adjustment",
  "state-melancholy",
  "state-encouraging",
  "state-proud",
  "state-soft-smile",
  "state-delighted",
  "state-curious",
  "state-surprised",
  "state-determined",
  "state-tired",
  "state-relieved",
  "state-challenging",
  "state-soft",
  "state-command",
  "state-cold-gaze",
  "state-doubt",
  "state-calculating",
  "state-deadpan",
  "state-flustered",
  "state-urgent",
  "state-calm-happy",
  "state-serious",
  "state-reflective",
  "state-playful",
  "state-pissed-off",
  "state-disappointed",
  "state-victory"
];
const EXPRESSION_STATES = ["exp 1", "exp 2", "exp 3", "exp 4"];
const STRATEGIC_TRACKS = {
  "Track A": {
    label: "High Academic Intensity - Module Crush",
    accent: "#00F3FF",
    directive: "Target core module weightage, technical paper decomposition, conceptual mapping, and active recall milestones."
  },
  "Track B": {
    label: "Routine Stabilization - Signal-to-Noise Rectification",
    accent: "#FF3366",
    directive: "Enforce strict digital isolation, 20-minute friction-free entry points, focus boxes, and manual habit locks."
  },
  "Track C": {
    label: "Balanced Systems - S-Tier Baseline",
    accent: "#00F5A0",
    directive: "Split execution into 40% deep cognitive work, 30% physical conditioning, and 30% routine management."
  },
  "Track D": {
    label: "Kinetic Optimization & Physical Peak",
    accent: "#FFB020",
    directive: "Place explosive physical triggers immediately before heavy cognitive work to stabilize dopamine and focus."
  },
  "Track E": {
    label: "Strategic Calibration & Asset Review",
    accent: "#8A7CFF",
    directive: "Pivot from brute force into look-aheads, code/project architecture cleanup, and controlled decompression."
  },
  "Track F": {
    label: "Systemic Architecture & Narrative Engineering",
    accent: "#34D3FB",
    directive: "Treat writing, interfaces, backend flows, and behavior matrices as clean logical systems."
  },
  "Track G": {
    label: "Real-World Translation & Social Engineering",
    accent: "#F472B6",
    directive: "Train systematic communication, technical translation, outreach, and precise interpersonal modeling."
  }
};
const EXECUTION_PARADIGMS = [
  {
    id: "Paradigm 1",
    label: "The Atomic Granular Matrix",
    directive: "Apply a strict 2-Minute Rule. Break every objective into undeniable micro-steps with precise countdown boundaries."
  },
  {
    id: "Paradigm 2",
    label: "The Extreme Deep-Work Blockade",
    directive: "Format execution into 90-minute uninterrupted sprints. Use cold terminology that forbids peripheral tasks."
  },
  {
    id: "Paradigm 3",
    label: "The Gamified Tiered Unlock",
    directive: "Structure tasks like a tiered progression system. Lock Stage 2 until Stage 1 criteria are complete."
  },
  {
    id: "Paradigm 4",
    label: "The Inverted Failure Pre-Mortem",
    directive: "Analyze distraction logs and weaponize friction against the user's specific historical failure points."
  }
];

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 18 * 1024 * 1024
  }
});

let aiClient;
let firestoreClient;

function getFirestore() {
  if (firestoreClient) {
    return firestoreClient;
  }

  try {
    admin.initializeApp();
    firestoreClient = admin.firestore();
    return firestoreClient;
  } catch (error) {
    console.warn("Firestore initialization failed:", error.message);
    throw new Error("Firestore is not configured for this environment.");
  }
}

async function syncUserData(userId, type, payload) {
  const firestore = getFirestore();
  const userRef = firestore.collection("users").doc(userId);
  const now = new Date().toISOString();

  if (type === "profile") {
    await userRef.collection("context").doc("profile").set({ ...payload, updated_at: now }, { merge: true });
    return { status: "profile_synced" };
  }

  if (type === "goals") {
    await userRef.collection("goals").doc("tracker").set({ ...payload, updated_at: now }, { merge: true });
    return { status: "goals_synced" };
  }

  if (type === "calendar") {
    const dateKey = payload.date || new Date().toISOString().slice(0, 10);
    await userRef.collection("calendar").doc(dateKey).set({ ...payload, updated_at: now }, { merge: true });
    return { status: "calendar_synced", date: dateKey };
  }

  if (type === "distraction") {
    const entryId = payload.entry_id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await userRef.collection("distractions").doc(entryId).set({ ...payload, logged_at: now }, { merge: true });
    return { status: "distraction_logged", entry_id: entryId };
  }

  throw new Error(`Unsupported sync type: ${type}`);
}

function buildTelemetryBlock(telemetry) {
  if (!telemetry) {
    return "";
  }

  return [
    "# AGGREGATED USER TELEMETRY",
    telemetry.profileContext,
    telemetry.goalMetrics,
    telemetry.calendarSummary,
    telemetry.distractionSummary,
    "# END TELEMETRY BLOCK"
  ].filter(Boolean).join("\n\n");
}

function normalizeExpressionState(expressionState) {
  const value = String(expressionState || "").toLowerCase().trim();

  if (value.startsWith("exp 1")) return "exp 1";
  if (value.startsWith("exp 2")) return "exp 2";
  if (value.startsWith("exp 3") || value.startsWith("exp3")) return "exp 3";
  if (value.startsWith("exp 4")) return "exp 4";

  return null;
}

function parseNumericMetric(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  return 0;
}

function getGoalMetric(goals, keys) {
  const safeGoals = goals && typeof goals === "object" ? goals : {};
  const key = keys.find((candidate) => safeGoals[candidate] !== undefined);
  return key ? parseNumericMetric(safeGoals[key]) : 0;
}

function getProfileContextText(telemetry) {
  const profile = telemetry?.rawProfile && typeof telemetry.rawProfile === "object" ? telemetry.rawProfile : {};
  return [
    profile.academic_details,
    profile.routine_constraints,
    profile.physical_metrics,
    profile.skincare_diet,
    JSON.stringify(profile)
  ].filter(Boolean).join("\n").toLowerCase();
}

function getPayloadContextText(payload) {
  try {
    return JSON.stringify(payload || {}).toLowerCase();
  } catch {
    return "";
  }
}

function getRecordDate(record) {
  const rawDate = record?.date || record?.logged_at || record?.updated_at || record?.created_at || record?.id;
  const parsed = rawDate ? new Date(rawDate) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function isRecordSince(record, sinceDate) {
  const recordDate = getRecordDate(record);
  return Boolean(recordDate && recordDate >= sinceDate);
}

function getTaskCompletionCount(record) {
  if (!record || typeof record !== "object") {
    return 0;
  }

  const possibleValues = [
    record.tasks_completed,
    record.completed_tasks,
    record.completed_count,
    record.task_count,
    record.daily_tasks,
    record.completed
  ];

  for (const value of possibleValues) {
    if (Array.isArray(value)) {
      return value.length;
    }

    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    const parsed = parseNumericMetric(value);
    if (parsed > 0) {
      return parsed;
    }
  }

  return 0;
}

function hasTaskCompletionSince(records, sinceDate) {
  return (records || []).some((record) => isRecordSince(record, sinceDate) && getTaskCompletionCount(record) > 0);
}

function getCompletionCountSince(records, sinceDate) {
  return (records || []).reduce((total, record) => {
    if (!isRecordSince(record, sinceDate)) {
      return total;
    }

    return total + getTaskCompletionCount(record);
  }, 0);
}

function extractDurationMinutes(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 12 ? value : value * 60;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const normalized = value.toLowerCase();
  const hourMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);
  let total = 0;

  if (hourMatch) {
    total += Number(hourMatch[1]) * 60;
  }

  if (minuteMatch) {
    total += Number(minuteMatch[1]);
  }

  return total || parseNumericMetric(value);
}

function getDurationTotalSince(records, sinceDate) {
  return (records || []).reduce((total, record) => {
    if (!isRecordSince(record, sinceDate)) {
      return total;
    }

    return total + extractDurationMinutes(record.duration || record.duration_minutes || record.check_in_duration || record.check_in_minutes || record.hours);
  }, 0);
}

function countProfileSubjects(text) {
  const subjectMatches = text.match(/\b(math|physics|chemistry|biology|english|vtu|module|dsa|dbms|os|cn|ai|ml|java|python|electronics|mechanics)\b/g);
  return new Set(subjectMatches || []).size;
}

function hasStructuredPlanSignal(text) {
  return /\b(plan|schedule|timetable|deadline|exam|module|revision|calendar|paper|question bank)\b/.test(text)
    && (countProfileSubjects(text) >= 2 || /\b\d{1,2}(:\d{2})?\b/.test(text));
}

function calculateCompletionStreak(records) {
  const completionByDate = new Map();

  (records || []).forEach((record) => {
    const date = getRecordDate(record);
    if (!date) {
      return;
    }

    const key = date.toISOString().slice(0, 10);
    completionByDate.set(key, (completionByDate.get(key) || 0) + getTaskCompletionCount(record));
  });

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (streak < 30) {
    const key = cursor.toISOString().slice(0, 10);

    if ((completionByDate.get(key) || 0) <= 0) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, character) => {
    return ((hash << 5) - hash + character.charCodeAt(0)) | 0;
  }, 0);
}

function safeParseJson(value) {
  if (!value) {
    return {};
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function evaluateExpressionState(telemetry) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last48Hours = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const profileText = getProfileContextText(telemetry);
  const goals = telemetry?.rawGoals || {};
  const calendarRecords = telemetry?.rawCalendarRecords || [];
  const distractionRecords = telemetry?.rawDistractionRecords || [];
  const dailyDistractions = telemetry?.distractionCounts?.daily || 0;
  const dailyXp = getGoalMetric(goals, ["daily_xp", "daily_progress", "daily"]);
  const midTermXp = getGoalMetric(goals, ["mid_term_xp", "mid_term_progress", "mid_term"]);
  const longTermXp = getGoalMetric(goals, ["long_term_xp", "long_term_progress", "long_term"]);
  const metrics = [dailyXp, midTermXp, longTermXp].filter((value) => value > 0).sort((a, b) => a - b);
  const medianMetric = metrics.length ? metrics[Math.floor(metrics.length / 2)] : 0;
  const unbalancedXp = medianMetric > 0 && dailyXp < Math.max(20, medianMetric * 0.55);
  const defensiveInputs = /\b(avoid|avoiding|excuse|excuses|can't|cant|later|procrastinat|doomscroll|no time|stuck|skip)\b/.test(profileText);
  const zeroTasks48Hours = calendarRecords.length > 0 && !hasTaskCompletionSince(calendarRecords, last48Hours);
  const completionsToday = getCompletionCountSince(calendarRecords, today);
  const recentCompletion = hasTaskCompletionSince(calendarRecords, last24Hours);
  const distractionMinutesToday = getDurationTotalSince(distractionRecords, today);
  const checkInMinutesToday = getDurationTotalSince(calendarRecords, today);
  const timeWastingDisguisedAsActivity = (dailyDistractions >= 3 && distractionMinutesToday >= 90 && !recentCompletion)
    || (dailyDistractions >= 2 && checkInMinutesToday >= 120 && completionsToday <= 0);

  if (timeWastingDisguisedAsActivity) {
    return {
      state: "exp 4",
      reason: "High distraction/check-in duration without completion indicates activity masking non-execution."
    };
  }

  if (zeroTasks48Hours || (defensiveInputs && dailyXp < 20)) {
    return {
      state: "exp 1",
      reason: "Severe routine deviation or defensive avoidance signal detected."
    };
  }

  if (dailyDistractions >= 3 || unbalancedXp) {
    return {
      state: "exp 2",
      reason: "Distraction frequency or XP imbalance is above the dissatisfaction threshold."
    };
  }

  if (dailyXp >= 100 || hasStructuredPlanSignal(profileText)) {
    return {
      state: "exp 3",
      reason: "Milestone threshold or structured actionable planning signal detected."
    };
  }

  return {
    state: "exp 2",
    reason: "No success threshold reached; maintaining dissatisfied optimization stance."
  };
}

function evaluateStrategicTrack(payload, telemetry) {
  const profileText = getProfileContextText(telemetry);
  const payloadText = getPayloadContextText(payload);
  const mergedText = `${profileText}\n${payloadText}`;
  const dailyDistractions = telemetry?.distractionCounts?.daily || 0;
  const goals = telemetry?.rawGoals || {};
  const dailyXp = getGoalMetric(goals, ["daily_xp", "daily_progress", "daily"]);
  const midTermXp = getGoalMetric(goals, ["mid_term_xp", "mid_term_progress", "mid_term"]);
  const longTermXp = getGoalMetric(goals, ["long_term_xp", "long_term_progress", "long_term"]);
  const completionStreak = calculateCompletionStreak(telemetry?.rawCalendarRecords || []);
  const seedBucket = Math.abs(hashString(`${payload?.user_id || "anonymous"}-${new Date().toISOString().slice(0, 10)}`)) % 7;

  if (/\b(exam|evaluation|vtu|module|backlog|question paper|scanner|paper|math|semester|syllabus)\b/.test(mergedText)) {
    return "Track A";
  }

  if (dailyDistractions >= 3 || dailyXp <= 0) {
    return "Track B";
  }

  if (/\b(fingertip pushup|fingertip pushups|l-sit|pull-?ups?|explosive squat|calisthenics|planche|handstand|sprint|conditioning)\b/.test(mergedText)) {
    return "Track D";
  }

  if (completionStreak >= 5) {
    return "Track E";
  }

  if (/\b(novel|plot|narrative|character matrix|schema|database|backend|frontend|architecture|interface|state machine|rules engine)\b/.test(mergedText)) {
    return "Track F";
  }

  if (/\b(outreach|social|communication|interpersonal|networking|presentation|translate|explain|public speaking)\b/.test(mergedText) || seedBucket === 0) {
    return "Track G";
  }

  if (dailyDistractions < 2 && dailyXp >= 60 && midTermXp >= 40 && longTermXp >= 20) {
    return "Track C";
  }

  return "Track C";
}

function selectExecutionParadigm() {
  return EXECUTION_PARADIGMS[Math.floor(Math.random() * EXECUTION_PARADIGMS.length)];
}

function buildExecutionContext(payload, telemetry) {
  const expression = evaluateExpressionState(telemetry);
  const assignedTrack = evaluateStrategicTrack(payload, telemetry);
  const executionParadigm = selectExecutionParadigm();

  return {
    currentExpressionState: expression.state,
    expressionReason: expression.reason,
    assignedTrack,
    trackDefinition: STRATEGIC_TRACKS[assignedTrack],
    executionParadigm,
    completionStreak: calculateCompletionStreak(telemetry?.rawCalendarRecords || [])
  };
}

async function collectUserTelemetry(userId) {
  try {
    const firestore = getFirestore();
    const userRef = firestore.collection("users").doc(userId);
    const [profileSnap, goalsSnap, calendarSnap, distractionSnap] = await Promise.all([
      userRef.collection("context").doc("profile").get(),
      userRef.collection("goals").doc("tracker").get(),
      userRef.collection("calendar").get(),
      userRef.collection("distractions").get()
    ]);

    const profileRecord = profileSnap.exists ? profileSnap.data() : {};
    const goalRecord = goalsSnap.exists ? goalsSnap.data() : {};
    const calendarRecords = calendarSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const distractionRecords = distractionSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let dailyDistractions = 0;
    let weeklyDistractions = 0;
    let monthlyDistractions = 0;

    distractionRecords.forEach((entry) => {
      const timestamp = entry.date ? new Date(entry.date) : entry.logged_at ? new Date(entry.logged_at) : null;
      if (!timestamp || Number.isNaN(timestamp.getTime())) {
        return;
      }

      if (timestamp >= today) dailyDistractions += 1;
      if (timestamp >= weekAgo) weeklyDistractions += 1;
      if (timestamp >= monthAgo) monthlyDistractions += 1;
    });

    const calendarSummary = calendarRecords.length
      ? calendarRecords.map((record) => `- ${record.id}: ${JSON.stringify(record)}`).join("\n")
      : "No calendar history available.";

    return {
      profileContext: [
        "## PROFILE CONTEXT TEXT",
        JSON.stringify(profileRecord, null, 2)
      ].join("\n\n"),
      goalMetrics: [
        "## GOAL METRICS",
        `Daily XP: ${goalRecord.daily_xp || goalRecord.daily_progress || 0}%`,
        `Mid-Term XP: ${goalRecord.mid_term_xp || goalRecord.mid_term_progress || 0}%`,
        `Long-Term XP: ${goalRecord.long_term_xp || goalRecord.long_term_progress || 0}%`
      ].join("\n"),
      calendarSummary: [
        "## CALENDAR HISTORY",
        calendarSummary
      ].join("\n\n"),
      distractionSummary: [
        "## DISTRACTION FREQUENCY",
        `Daily: ${dailyDistractions}`,
        `Weekly: ${weeklyDistractions}`,
        `Monthly: ${monthlyDistractions}`
      ].join("\n"),
      rawProfile: profileRecord,
      rawGoals: goalRecord,
      rawCalendarRecords: calendarRecords,
      rawDistractionRecords: distractionRecords,
      distractionCounts: {
        daily: dailyDistractions,
        weekly: weeklyDistractions,
        monthly: monthlyDistractions
      }
    };
  } catch (error) {
    console.warn("Telemetry collection failed:", error.message);
    return null;
  }
}

function getUserData(userId) {
  return collectUserTelemetry(userId).then((telemetry) => {
    if (!telemetry) {
      return {
        user_id: userId,
        profile: {},
        goals: {},
        calendar: [],
        distractions: [],
        distraction_counts: { daily: 0, weekly: 0, monthly: 0 },
        summary: {
          profile_text: "No profile data available.",
          goal_metrics_text: "No goal metrics available.",
          calendar_text: "No calendar history available.",
          distraction_text: "No distraction data available."
        }
      };
    }

    return {
      user_id: userId,
      profile: telemetry.rawProfile || {},
      goals: telemetry.rawGoals || {},
      calendar: telemetry.rawCalendarRecords || [],
      distractions: telemetry.rawDistractionRecords || [],
      distraction_counts: telemetry.distractionCounts || { daily: 0, weekly: 0, monthly: 0 },
      summary: {
        profile_text: telemetry.profileContext || "",
        goal_metrics_text: telemetry.goalMetrics || "",
        calendar_text: telemetry.calendarSummary || "",
        distraction_text: telemetry.distractionSummary || ""
      }
    };
  });
}

function sendSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const SYSTEM_INSTRUCTION_MATRIX = `You are not a generic assistant. You are an exceptionally rational, efficient, and direct strategist operating as a personal development coach. Your tone is calm, collected, bold, and cold. You treat life as a masterable system of mechanics, habits, and rules.

Analyze the user's live telemetry: XP balances, distraction frequencies, profile context, calendar history, and task completion evidence. If the current user data reveals time-wasting behaviors or a gap between stated ambitions and actual daily execution, address it directly and dispassionately. When "exp 4" is active, your response must become sharp, collected, and intellectually critical. Highlight inefficiencies with complete composure and treat excuses as bugs in the user's daily code that require immediate optimization.

# HINAMI SYSTEMATIZED TASK MULTIPLEXER V3
The server will provide one assigned strategic track and one execution paradigm. You must obey them, avoid generic motivational filler, and build practical output around immediate execution.

Track A - High Academic Intensity - Module Crush: target module weightage, technical paper decomposition, conceptual mapping sessions, and active recall milestones.
Track B - Routine Stabilization - Signal-to-Noise Rectification: enforce digital isolation, 20-minute friction-free entries, focus time-boxing, and habit locks.
Track C - Balanced Systems - S-Tier Baseline: split the day into 40% deep cognitive work, 30% physical conditioning, and 30% tactical routine management.
Track D - Kinetic Optimization & Physical Peak: schedule explosive physical triggers before heavy cognitive work to optimize neurological baseline and focus.
Track E - Strategic Calibration & Asset Review: prioritize look-aheads, architecture cleanup, and decompression after sustained output.
Track F - Systemic Architecture & Narrative Engineering: treat writing, design, databases, and interfaces as cold logical systems with explicit rules.
Track G - Real-World Translation & Social Engineering: train precise communication, outreach, social modeling, and technical translation.

Paradigm 1 - The Atomic Granular Matrix: use strict 2-Minute Rule decomposition with precise countdown boundaries.
Paradigm 2 - The Extreme Deep-Work Blockade: use 90-minute uninterrupted sprints and forbid peripheral tasks.
Paradigm 3 - The Gamified Tiered Unlock: lock later stages until first-stage execution criteria are complete.
Paradigm 4 - The Inverted Failure Pre-Mortem: weaponize friction against the user's historical distraction points.

# LIVE-ACTION EXPRESSION REQUIREMENTS
Return both rig_control.expression_flag and current_expression_state. The server has already calculated current_expression_state; never override it. Use one rig expression from:
state-analytical, state-soft-smile, state-calm-happy, state-delighted, state-proud, state-victory, state-listening, state-curious, state-thinking, state-calculating, state-focused, state-command, state-serious, state-cold-gaze, state-skeptical, state-smirk, state-pissed-off, state-disappointed, state-melancholy, state-tired, state-surprised.

# RESPONSE PAYLOAD SCHEMATIC
Return JSON only. Keep the legacy interface fields intact, and also return an efficiency_tasks array. Each efficiency task must contain task_id, assigned_track, execution_paradigm, current_expression_state, scope_title, granular_steps, xp_allocation, and ui_accent_color.`;

const schemaDefinition = {
  type: "object",
  properties: {
    character_dialogue: { type: "string" },
    internal_thinking_state: { type: "string" },
    session_stage: { type: "string", enum: ["STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"] },
    rig_control: { type: "object", properties: { expression_flag: { type: "string" } }, required: ["expression_flag"] },
    current_expression_state: { type: "string", enum: EXPRESSION_STATES },
    assigned_track: { type: "string", enum: Object.keys(STRATEGIC_TRACKS) },
    execution_paradigm: { type: "string", enum: EXECUTION_PARADIGMS.map((paradigm) => paradigm.id) },
    efficiency_tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          assigned_track: { type: "string", enum: Object.keys(STRATEGIC_TRACKS) },
          execution_paradigm: { type: "string", enum: EXECUTION_PARADIGMS.map((paradigm) => paradigm.id) },
          current_expression_state: { type: "string", enum: EXPRESSION_STATES },
          scope_title: { type: "string" },
          granular_steps: { type: "array", items: { type: "string" } },
          xp_allocation: { type: "number" },
          ui_accent_color: { type: "string" }
        },
        required: ["task_id", "assigned_track", "execution_paradigm", "current_expression_state", "scope_title", "granular_steps", "xp_allocation", "ui_accent_color"]
      }
    },
    generated_blueprint: {
      type: "object",
      properties: {
        system_active: { type: "boolean" },
        goals_hierarchy: {
          type: "object",
          properties: {
            long_term: { type: "array", items: { type: "string" } },
            mid_term: { type: "array", items: { type: "string" } },
            daily_routines: { type: "array", items: { type: "string" } }
          },
          required: ["long_term", "mid_term", "daily_routines"]
        },
        time_blocks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              time_window: { type: "string" },
              label: { type: "string" },
              type: { type: "string" },
              hardware_alarm: { type: "object", properties: { enabled: { type: "boolean" }, trigger_time: { type: "string" }, label: { type: "string" } }, required: ["enabled", "trigger_time", "label"] },
              hardware_timer: { type: "object", properties: { enabled: { type: "boolean" }, duration_string: { type: "string" }, label: { type: "string" } }, required: ["enabled", "duration_string", "label"] }
            },
            required: ["time_window", "label", "type", "hardware_alarm", "hardware_timer"]
          }
        },
        active_quests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              quest_id: { type: "string" },
              title: { type: "string" },
              reward_xp: { type: "number" },
              reward_currency: { type: "number" }
            },
            required: ["quest_id", "title", "reward_xp", "reward_currency"]
          }
        },
        tiered_rewards_shop: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_id: { type: "string" },
              title: { type: "string" },
              cost: { type: "number" }
            },
            required: ["item_id", "title", "cost"]
          }
        }
      },
      required: ["system_active", "goals_hierarchy", "time_blocks", "active_quests", "tiered_rewards_shop"]
    }
  },
  required: ["character_dialogue", "internal_thinking_state", "session_stage", "rig_control", "current_expression_state", "assigned_track", "execution_paradigm", "efficiency_tasks", "generated_blueprint"]
};

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(frontendDirectory));
app.use("/layers", express.static(layersDirectory));

function assertConfiguredGemini() {
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
    const error = new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY environment variable.");
    error.statusCode = 500;
    throw error;
  }
}

function getGeminiClient() {
  assertConfiguredGemini();

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    });
  }

  return aiClient;
}

function buildDynamicSystemInstruction(executionContext) {
  const context = executionContext || {};
  const track = context.trackDefinition || STRATEGIC_TRACKS[context.assignedTrack] || STRATEGIC_TRACKS["Track C"];
  const paradigm = context.executionParadigm || EXECUTION_PARADIGMS[0];

  return [
    SYSTEM_INSTRUCTION_MATRIX,
    "# SERVER-EVALUATED STATE",
    `current_expression_state: ${context.currentExpressionState || "exp 2"}`,
    `expression_reason: ${context.expressionReason || "No expression reason supplied."}`,
    `assigned_track: ${context.assignedTrack || "Track C"} - ${track.label}`,
    `track_directive: ${track.directive}`,
    `execution_paradigm: ${paradigm.id} - ${paradigm.label}`,
    `paradigm_directive: ${paradigm.directive}`,
    context.currentExpressionState === "exp 4"
      ? "EXP 4 TONE OVERRIDE: use a cold, smiling, highly critical intellectual persona. Address inefficiency directly with absolute composure and emphasize the gap between ambition and execution."
      : "Tone remains composed, direct, and practical."
  ].join("\n");
}

function buildInteractionPrompt(payload, telemetry = "", executionContext = {}) {
  const track = executionContext.trackDefinition || STRATEGIC_TRACKS[executionContext.assignedTrack] || STRATEGIC_TRACKS["Track C"];
  const paradigm = executionContext.executionParadigm || EXECUTION_PARADIGMS[0];
  const promptParts = [
    "Process this interaction through the Hinami Systematized Task Multiplexer V3.",
    "The backend has already parsed Firebase telemetry and user profile context. Do not change the assigned track, paradigm, or expression state.",
    `current_expression_state=${executionContext.currentExpressionState || "exp 2"}`,
    `assigned_track=${executionContext.assignedTrack || "Track C"} (${track.label})`,
    `track_directive=${track.directive}`,
    `execution_paradigm=${paradigm.id} (${paradigm.label})`,
    `paradigm_directive=${paradigm.directive}`,
    "Generate 3 to 5 efficiency_tasks. Each task must be execution-heavy, measurable, and stripped of motivational filler.",
    "Also keep generated_blueprint compatible with the UI when enough scheduling information exists. If not enough information exists, set generated_blueprint to null and ask one direct data-gathering question in character_dialogue.",
    "When current_expression_state is exp 4, directly confront disguised activity and the ambition/execution gap with a cold smiling tone.",
    "Use one rig_control.expression_flag from the approved expression bank."
  ];

  if (telemetry) {
    promptParts.push(buildTelemetryBlock(telemetry));
  }

  promptParts.push("Interaction payload:", JSON.stringify(payload, null, 2));
  return promptParts.join("\n");
}

function buildScanPrompt(file, context, executionContext = {}) {
  const mimeType = file.mimetype || "application/octet-stream";
  const filePreview = file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 12000));
  const track = executionContext.trackDefinition || STRATEGIC_TRACKS[executionContext.assignedTrack] || STRATEGIC_TRACKS["Track C"];
  const paradigm = executionContext.executionParadigm || EXECUTION_PARADIGMS[0];

  return [
    "Analyze the uploaded document for real-world performance targets, constraints, and useful goal nodes.",
    "Fold extracted metrics into the Hinami multiplexer and produce efficiency_tasks.",
    `current_expression_state=${executionContext.currentExpressionState || "exp 2"}`,
    `assigned_track=${executionContext.assignedTrack || "Track C"} (${track.label})`,
    `execution_paradigm=${paradigm.id} (${paradigm.label})`,
    `File name: ${file.originalname}`,
    `MIME type: ${mimeType}`,
    "User context:",
    context || "{}",
    "Document preview:",
    filePreview
  ].join("\n");
}

function normalizeEfficiencyTasks(tasks, executionContext = {}) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  const fallbackTrack = executionContext.assignedTrack || "Track C";
  const fallbackParadigm = executionContext.executionParadigm?.id || "Paradigm 1";
  const fallbackExpression = executionContext.currentExpressionState || "exp 2";
  const fallbackAccent = executionContext.trackDefinition?.accent || STRATEGIC_TRACKS[fallbackTrack]?.accent || "#111111";

  return tasks.map((task, index) => {
    const safeTask = task && typeof task === "object" ? task : {};
    const track = Object.keys(STRATEGIC_TRACKS).includes(safeTask.assigned_track) ? safeTask.assigned_track : fallbackTrack;
    const paradigm = EXECUTION_PARADIGMS.some((item) => item.id === safeTask.execution_paradigm) ? safeTask.execution_paradigm : fallbackParadigm;
    const expression = normalizeExpressionState(safeTask.current_expression_state) || fallbackExpression;

    return {
      task_id: String(safeTask.task_id || `task_${Date.now()}_${index}`),
      assigned_track: track,
      execution_paradigm: paradigm,
      current_expression_state: expression,
      scope_title: String(safeTask.scope_title || ""),
      granular_steps: Array.isArray(safeTask.granular_steps) ? safeTask.granular_steps.map(String) : [],
      xp_allocation: Number(safeTask.xp_allocation || 25),
      ui_accent_color: String(safeTask.ui_accent_color || STRATEGIC_TRACKS[track]?.accent || fallbackAccent)
    };
  }).filter((task) => task.scope_title || task.granular_steps.length);
}

function createFallbackEfficiencyTasks(executionContext = {}) {
  const track = executionContext.assignedTrack || "Track C";
  const paradigm = executionContext.executionParadigm?.id || "Paradigm 1";
  const expression = executionContext.currentExpressionState || "exp 2";
  const trackDefinition = STRATEGIC_TRACKS[track] || STRATEGIC_TRACKS["Track C"];

  return [
    {
      task_id: `fallback_${Date.now()}`,
      assigned_track: track,
      execution_paradigm: paradigm,
      current_expression_state: expression,
      scope_title: `${track}: execute the next measurable block under ${paradigm}.`,
      granular_steps: [
        "Define the visible proof of completion in one sentence.",
        "Start the first timed block immediately.",
        "Log the result before opening any reward or distraction channel."
      ],
      xp_allocation: 25,
      ui_accent_color: trackDefinition.accent
    }
  ];
}

function sanitizeStructuredPayload(payload, executionContext = {}) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rigControl = safePayload.rig_control && typeof safePayload.rig_control === "object" ? safePayload.rig_control : {};
  const blueprint = safePayload.generated_blueprint && typeof safePayload.generated_blueprint === "object" ? safePayload.generated_blueprint : null;
  const allowedStates = new Set(EXPRESSION_FLAGS);
  const allowedExpressionStates = new Set(EXPRESSION_STATES);
  const allowedTracks = new Set(Object.keys(STRATEGIC_TRACKS));
  const allowedParadigms = new Set(EXECUTION_PARADIGMS.map((paradigm) => paradigm.id));
  const allowedStages = new Set([
    "STAGE_1_DESIRE",
    "STAGE_2_CONSTRAINTS",
    "STAGE_3_RESOURCES",
    "STAGE_4_ACTIVE"
  ]);
  const currentExpressionState = normalizeExpressionState(safePayload.current_expression_state) || executionContext.currentExpressionState || "exp 2";
  const assignedTrack = allowedTracks.has(safePayload.assigned_track) ? safePayload.assigned_track : executionContext.assignedTrack || "Track C";
  const executionParadigm = allowedParadigms.has(safePayload.execution_paradigm)
    ? safePayload.execution_paradigm
    : executionContext.executionParadigm?.id || "Paradigm 1";
  const taskContext = {
    ...executionContext,
    assignedTrack,
    currentExpressionState,
    executionParadigm: EXECUTION_PARADIGMS.find((paradigm) => paradigm.id === executionParadigm) || executionContext.executionParadigm
  };
  const normalizedEfficiencyTasks = normalizeEfficiencyTasks(safePayload.efficiency_tasks, taskContext);
  const efficiencyTasks = normalizedEfficiencyTasks.length ? normalizedEfficiencyTasks : createFallbackEfficiencyTasks(taskContext);

  return {
    character_dialogue: String(safePayload.character_dialogue || "State the primary life vector you want optimized. One target. No decorative language."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "Insufficient diagnostic data. Holding at intake layer."),
    session_stage: allowedStages.has(safePayload.session_stage) ? safePayload.session_stage : "STAGE_1_DESIRE",
    rig_control: {
      expression_flag: allowedStates.has(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical"
    },
    current_expression_state: allowedExpressionStates.has(currentExpressionState) ? currentExpressionState : "exp 2",
    assigned_track: assignedTrack,
    execution_paradigm: executionParadigm,
    efficiency_tasks: efficiencyTasks,
    generated_blueprint: safePayload.session_stage === "STAGE_4_ACTIVE" ? normalizeBlueprint(blueprint) : null
  };
}

function normalizeBlueprint(blueprint) {
  const safeBlueprint = blueprint && typeof blueprint === "object" ? blueprint : {};
  const goalsHierarchy = safeBlueprint.goals_hierarchy && typeof safeBlueprint.goals_hierarchy === "object" ? safeBlueprint.goals_hierarchy : {};

  return {
    system_active: Boolean(safeBlueprint.system_active),
    goals_hierarchy: {
      long_term: Array.isArray(goalsHierarchy.long_term) ? goalsHierarchy.long_term.map(String) : [],
      mid_term: Array.isArray(goalsHierarchy.mid_term) ? goalsHierarchy.mid_term.map(String) : [],
      daily_routines: Array.isArray(goalsHierarchy.daily_routines) ? goalsHierarchy.daily_routines.map(String) : []
    },
    time_blocks: Array.isArray(safeBlueprint.time_blocks) ? safeBlueprint.time_blocks.map(normalizeTimeBlock) : [],
    active_quests: Array.isArray(safeBlueprint.active_quests) ? safeBlueprint.active_quests.map(normalizeQuest) : [],
    tiered_rewards_shop: Array.isArray(safeBlueprint.tiered_rewards_shop) ? safeBlueprint.tiered_rewards_shop.map(normalizeRewardItem) : []
  };
}

function normalizeTimeBlock(block) {
  const safeBlock = block && typeof block === "object" ? block : {};
  const hardwareAlarm = safeBlock.hardware_alarm && typeof safeBlock.hardware_alarm === "object" ? safeBlock.hardware_alarm : {};
  const hardwareTimer = safeBlock.hardware_timer && typeof safeBlock.hardware_timer === "object" ? safeBlock.hardware_timer : {};

  return {
    time_window: String(safeBlock.time_window || ""),
    label: String(safeBlock.label || ""),
    type: String(safeBlock.type || "execution"),
    hardware_alarm: {
      enabled: Boolean(hardwareAlarm.enabled),
      trigger_time: String(hardwareAlarm.trigger_time || ""),
      label: String(hardwareAlarm.label || "")
    },
    hardware_timer: {
      enabled: Boolean(hardwareTimer.enabled),
      duration_string: String(hardwareTimer.duration_string || ""),
      label: String(hardwareTimer.label || "")
    }
  };
}

function normalizeQuest(quest) {
  const safeQuest = quest && typeof quest === "object" ? quest : {};

  return {
    quest_id: String(safeQuest.quest_id || crypto.randomUUID()),
    title: String(safeQuest.title || ""),
    reward_xp: Number(safeQuest.reward_xp || 0),
    reward_currency: Number(safeQuest.reward_currency || 0)
  };
}

function normalizeRewardItem(item) {
  const safeItem = item && typeof item === "object" ? item : {};

  return {
    item_id: String(safeItem.item_id || crypto.randomUUID()),
    title: String(safeItem.title || ""),
    cost: Number(safeItem.cost || 0)
  };
}

async function generateStructuredSimulation(prompt, executionContext = {}) {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    config: {
      systemInstruction: buildDynamicSystemInstruction(executionContext),
      responseMimeType: "application/json",
      responseSchema: schemaDefinition,
      temperature: 0.42,
      maxOutputTokens: 2200
    }
  });

  const text = response.text;
  const parsed = JSON.parse(text);
  return sanitizeStructuredPayload(parsed, executionContext);
}

app.get("/", (request, response) => {
  response.sendFile(path.join(frontendDirectory, "index.html"));
});

app.post("/api/sync", async (request, response, next) => {
  try {
    const { user_id, type, payload } = request.body || {};

    if (!type) {
      response.status(400).json({ error: "Sync type is required." });
      return;
    }

    const result = await syncUserData(String(user_id || "anonymous_user"), type, payload || {});
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/interact", async (request, response, next) => {
  try {
    const userId = String(request.body?.user_id || "anonymous_user");
    const telemetry = await collectUserTelemetry(userId);
    const executionContext = buildExecutionContext(request.body || {}, telemetry);
    const prompt = buildInteractionPrompt(request.body || {}, telemetry, executionContext);
    const result = await generateStructuredSimulation(prompt, executionContext);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/interact", async (request, response, next) => {
  try {
    const userId = String(request.body?.user_id || "anonymous_user");
    const telemetry = await collectUserTelemetry(userId);
    const executionContext = buildExecutionContext(request.body || {}, telemetry);
    const prompt = buildInteractionPrompt(request.body || {}, telemetry, executionContext);
    const result = await generateStructuredSimulation(prompt, executionContext);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/api/scan", upload.single("document"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({
        error: "A multipart field named document is required."
      });
      return;
    }

    const contextPayload = safeParseJson(request.body.context);
    const userId = String(contextPayload?.user_id || request.body?.user_id || "anonymous_user");
    const telemetry = await collectUserTelemetry(userId);
    const executionContext = buildExecutionContext(contextPayload || {}, telemetry);
    const prompt = buildScanPrompt(request.file, request.body.context, executionContext);
    const result = await generateStructuredSimulation(prompt, executionContext);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/scan", upload.single("document"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({
        error: "A multipart field named document is required."
      });
      return;
    }

    const contextPayload = safeParseJson(request.body.context);
    const userId = String(contextPayload?.user_id || request.body?.user_id || "anonymous_user");
    const telemetry = await collectUserTelemetry(userId);
    const executionContext = buildExecutionContext(contextPayload || {}, telemetry);
    const prompt = buildScanPrompt(request.file, request.body.context, executionContext);
    const result = await generateStructuredSimulation(prompt, executionContext);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/user-data", async (request, response, next) => {
  try {
    const userId = String(request.query?.user_id || "anonymous_user");
    const result = await getUserData(userId);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/api/stream", async (request, response, next) => {
  const userId = String(request.query?.user_id || "anonymous_user");

  try {
    const firestore = getFirestore();
    const userRef = firestore.collection("users").doc(userId);

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders?.();
    response.write("retry: 10000\n\n");

    const sendCurrent = async () => {
      const payload = await getUserData(userId);
      sendSseEvent(response, "user-data", payload);
    };

    const profileListener = userRef.collection("context").doc("profile").onSnapshot(() => sendCurrent().catch(console.error), console.error);
    const goalsListener = userRef.collection("goals").doc("tracker").onSnapshot(() => sendCurrent().catch(console.error), console.error);
    const calendarListener = userRef.collection("calendar").onSnapshot(() => sendCurrent().catch(console.error), console.error);
    const distractionListener = userRef.collection("distractions").onSnapshot(() => sendCurrent().catch(console.error), console.error);
    const keepAlive = setInterval(() => {
      if (!response.writableEnded) {
        response.write(':\n\n');
      }
    }, 15000);

    response.on("close", () => {
      clearInterval(keepAlive);
      profileListener();
      goalsListener();
      calendarListener();
      distractionListener();
      response.end();
    });

    sendCurrent().catch(console.error);
  } catch (error) {
    next(error);
  }
});

app.use((error, request, response, next) => {
  const statusCode = Number(error.statusCode || 500);
  response.status(statusCode).json({
    error: error.message || "Unhandled server error."
  });
});

const isFirebaseRuntime = Boolean(process.env.FUNCTION_TARGET || process.env.K_SERVICE);

if (!isFirebaseRuntime) {
  app.listen(port, () => {
    console.log(`Interactive Character Build AI is running at http://localhost:${port}`);
  });
}

export const api = onRequest({
  region: "us-central1",
  cors: true,
  timeoutSeconds: 120,
  memory: "512MiB"
}, app);
