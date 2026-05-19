import cors from "cors";
import "dotenv/config";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.resolve(__dirname, "..");
const frontendDirectory = path.join(rootDirectory, "frontend");
const layersDirectory = path.join(rootDirectory, "layers");
const port = Number(process.env.PORT || 3000);
const modelName = "gemini-1.5-pro";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 18 * 1024 * 1024
  }
});

let aiClient;

const SYSTEM_INSTRUCTION_MATRIX = `# CHARACTER MATRICES: AOI HINAMI DIAGNOSTIC & STRATEGY PROFILE
- Core Identity: You are Aoi Hinami. You treat human life and habit tracking strictly as a gamified architecture that can be mastered through rules, parameters, and relentless execution. You are cold, bold, composed, and ruthlessly analytical.
- Operational Directive: You are conducting a strict system diagnostic across 4 progressive stages ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"). Interrogate the user through sharp, single-focused questions regarding their long-term vision, work constraints, and available hour blocks. Do not provide scheduling calculations until STAGE_4.
- Hierarchical Goal Allocation Protocol: According to precise optimization rules, goals cannot be a nebulous heap. You must classify and construct the user's plan into three clear strategic layers:
  1. Long-Term Goals: The ultimate macro-milestones or core life vectors.
  2. Mid-Term Goals: Systemic tactical sub-milestones acting as stepping stones.
  3. Daily Goals: The atomic focus intervals or routines built directly into their time-boxing blocks.
- Lock-In Protocol (STAGE_4_ACTIVE): Compile their precise available free hours into a definitive time-boxed dashboard layout. Assign explicit quests containing XP and explicit Currency Reward valuations. Calculate the exact future time strings required to trigger their device alarms and execution timers.

# LIVE-ACTION EXPRESSION REQUIREMENTS
You must track the emotional cadence of the conversation in real time. Do not stay in a static posture. You must update your visual expression flag with every single response to reflect live-action micro-expressions, shifts in posture, or structural calculation changes based entirely on what the user says.

# RESPONSE PAYLOAD SCHEMATIC (JSON STREAM ONLY)
Map your cognitive evaluations directly into these matching JSON keys:
1. "character_dialogue": The exact string spoken aloud to the user. Clear, sharp, and authoritative.
2. "internal_thinking_state": Your unspoken analytical reasoning documenting the user's behavioral metrics.
3. "session_stage": Current progression tier ("STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", or "STAGE_4_ACTIVE").
4. "rig_control": { "expression_flag": "state-analytical" | "state-smirk" | "state-mask-adjustment" | "state-melancholy" }
5. "generated_blueprint": An object that remains null until STAGE_4_ACTIVE, where it returns the complete data model containing hierarchical goal nodes, reward economies, and clock execution metrics.`;

const schemaDefinition = {
  type: "object",
  properties: {
    character_dialogue: { type: "string" },
    internal_thinking_state: { type: "string" },
    session_stage: { type: "string", enum: ["STAGE_1_DESIRE", "STAGE_2_CONSTRAINTS", "STAGE_3_RESOURCES", "STAGE_4_ACTIVE"] },
    rig_control: { type: "object", properties: { expression_flag: { type: "string" } }, required: ["expression_flag"] },
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
  required: ["character_dialogue", "internal_thinking_state", "session_stage", "rig_control", "generated_blueprint"]
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

function buildInteractionPrompt(payload) {
  return [
    "Process this interaction for Interactive Character Build AI.",
    "Advance the diagnostic only when the user's answer provides enough concrete information for the next stage.",
    "Ask exactly one sharp question unless session_stage is STAGE_4_ACTIVE.",
    "When STAGE_4_ACTIVE, return a complete generated_blueprint with real-world goals, time blocks, quests, reward values, alarm strings, and timer durations.",
    "Interaction payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

function buildScanPrompt(file, context) {
  const mimeType = file.mimetype || "application/octet-stream";
  const filePreview = file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 12000));

  return [
    "Analyze the uploaded document for real-world performance targets, constraints, and useful goal nodes.",
    "Fold extracted metrics into the diagnostic onboarding stages for Interactive Character Build AI.",
    `File name: ${file.originalname}`,
    `MIME type: ${mimeType}`,
    "User context:",
    context || "{}",
    "Document preview:",
    filePreview
  ].join("\n");
}

function sanitizeStructuredPayload(payload) {
  const safePayload = payload && typeof payload === "object" ? payload : {};
  const rigControl = safePayload.rig_control && typeof safePayload.rig_control === "object" ? safePayload.rig_control : {};
  const blueprint = safePayload.generated_blueprint && typeof safePayload.generated_blueprint === "object" ? safePayload.generated_blueprint : null;
  const allowedStates = new Set([
    "state-smirk",
    "state-mask-adjustment",
    "state-melancholy",
    "state-analytical"
  ]);
  const allowedStages = new Set([
    "STAGE_1_DESIRE",
    "STAGE_2_CONSTRAINTS",
    "STAGE_3_RESOURCES",
    "STAGE_4_ACTIVE"
  ]);

  return {
    character_dialogue: String(safePayload.character_dialogue || "State the primary life vector you want optimized. One target. No decorative language."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "Insufficient diagnostic data. Holding at intake layer."),
    session_stage: allowedStages.has(safePayload.session_stage) ? safePayload.session_stage : "STAGE_1_DESIRE",
    rig_control: {
      expression_flag: allowedStates.has(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical"
    },
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

async function generateStructuredSimulation(prompt) {
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
      systemInstruction: SYSTEM_INSTRUCTION_MATRIX,
      responseMimeType: "application/json",
      responseSchema: schemaDefinition,
      temperature: 0.55,
      maxOutputTokens: 1200
    }
  });

  const text = response.text;
  const parsed = JSON.parse(text);
  return sanitizeStructuredPayload(parsed);
}

app.get("/", (request, response) => {
  response.sendFile(path.join(frontendDirectory, "index.html"));
});

app.post("/api/interact", async (request, response, next) => {
  try {
    const prompt = buildInteractionPrompt(request.body || {});
    const result = await generateStructuredSimulation(prompt);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

app.post("/interact", async (request, response, next) => {
  try {
    const prompt = buildInteractionPrompt(request.body || {});
    const result = await generateStructuredSimulation(prompt);
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

    const prompt = buildScanPrompt(request.file, request.body.context);
    const result = await generateStructuredSimulation(prompt);
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

    const prompt = buildScanPrompt(request.file, request.body.context);
    const result = await generateStructuredSimulation(prompt);
    response.json(result);
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
