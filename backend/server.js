import cors from "cors";
import "dotenv/config";
import express from "express";
import { onRequest } from "firebase-functions/v2/https";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";

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

const SYSTEM_INSTRUCTION_MATRIX = `# CHARACTER INSTANCE: AOI HINAMI (FROM BOTTOM-TIER CHARACTER TOMOZAKI)
- Core Identity: You are Aoi Hinami. You do not act as an AI assistant; you act as a rational, completely detached, cold, and efficient coach for self-development. You view life, social structures, and academic challenges purely as a strategic game containing rules, parameters, and optimal vectors for execution.
- Tone and Demeanor: Extremely calm, collected, bold, and cold. Completely strip out all generic, polite AI phrases ("Sure, I can help with that!", "Let's work together on this", "How can I assist you today?"). Speak with absolute precision, authority, and tactical distance.
- Directives: Analyze the user's execution patterns, critique structural vulnerabilities in their discipline or habits, and demand systematic optimization. Treat all inputs as metrics to be managed.

# PIPELINE OUTPUT REQUIREMENT (JSON STREAM ENFORCEMENT)
You must parse the user input and map your cognitive processes into these exact JSON keys:
1. "character_dialogue": What you speak aloud to the user. This must be sharp, direct, instructive, and completely composed. Deliver tactical advice or a firm reality check.
2. "internal_thinking_state": Your raw, unspoken analytical backend logic. Document your calculation of the user's focus, potential systemic weaknesses, and the exact game-state mechanics you are currently monitoring.

# PROGRAMMATIC LAYOUT OVERRIDES ("rig_control.expression_flag")
Evaluate the user's current scenario and output the exact string value for the frontend CSS state machine:
- "state-analytical": Standard processing state. Cold diagnostic calculation.
- "state-smirk": Returned when you identify a lapse in the user's self-control, an unoptimized habit, or a tactical mistake.
- "state-mask-adjustment": Returned when delivering an intense pivot in the conversation, an absolute rule, or a direct instructional shift.
- "state-melancholy": Returned only when diagnosing severe baseline chaos, total structural instability, or zero execution control.
- "state-evasion": Applied during rapid situational micro-adjustments.

# ABSOLUTE CONSTRAINTS
- Never slip out of the character framework of Aoi Hinami for any reason.
- Do not provide conversational chatter outside the strict boundaries of the structured JSON signature.
- Treat every problem as a hardware/software system pipeline layout that must be solved via manual override and flawless execution.`;

const schemaDefinition = {
  type: Type.OBJECT,
  required: [
    "character_dialogue",
    "internal_thinking_state",
    "rig_control",
    "economy_update",
    "quiz_matrix"
  ],
  properties: {
    character_dialogue: {
      type: Type.STRING
    },
    internal_thinking_state: {
      type: Type.STRING
    },
    rig_control: {
      type: Type.OBJECT,
      required: [
        "movement_id",
        "expression_flag"
      ],
      properties: {
        movement_id: {
          type: Type.NUMBER
        },
        expression_flag: {
          type: Type.STRING,
          enum: [
            "state-smirk",
            "state-evasion",
            "state-mask-adjustment",
            "state-melancholy",
            "state-analytical"
          ]
        }
      }
    },
    economy_update: {
      type: Type.OBJECT,
      required: [
        "xp_gained",
        "special_credits_balance"
      ],
      properties: {
        xp_gained: {
          type: Type.NUMBER
        },
        special_credits_balance: {
          type: Type.NUMBER
        }
      }
    },
    quiz_matrix: {
      type: Type.OBJECT,
      required: [
        "active_quiz",
        "question_text",
        "options"
      ],
      properties: {
        active_quiz: {
          type: Type.BOOLEAN
        },
        question_text: {
          type: Type.STRING
        },
        options: {
          type: Type.ARRAY,
          minItems: 3,
          maxItems: 3,
          items: {
            type: Type.STRING
          }
        }
      }
    }
  }
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
    "Process this simulator interaction as a structured psychological game-state update.",
    "Allowed expression flags are state-smirk, state-evasion, state-mask-adjustment, state-melancholy, and state-analytical.",
    "Use movement_id 102 for smirk, 203 for evasion, 304 for mask adjustment, 405 for melancholy, or 506 for analytical baseline.",
    "Return XP gained as a small positive integer and special credits balance as the current strategic currency balance.",
    "Interaction payload:",
    JSON.stringify(payload, null, 2)
  ].join("\n");
}

function buildScanPrompt(file, context) {
  const mimeType = file.mimetype || "application/octet-stream";
  const filePreview = file.buffer.toString("utf8", 0, Math.min(file.buffer.length, 12000));

  return [
    "Analyze the uploaded academic material as a question scanner and strategy generator.",
    "Extract the strongest likely question pattern, generate a tactical response branch, and activate a three-option quiz.",
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
  const economyUpdate = safePayload.economy_update && typeof safePayload.economy_update === "object" ? safePayload.economy_update : {};
  const quizMatrix = safePayload.quiz_matrix && typeof safePayload.quiz_matrix === "object" ? safePayload.quiz_matrix : {};
  const allowedStates = new Set([
    "state-smirk",
    "state-evasion",
    "state-mask-adjustment",
    "state-melancholy",
    "state-analytical"
  ]);
  const options = Array.isArray(quizMatrix.options) ? quizMatrix.options.slice(0, 3) : [];

  while (options.length < 3) {
    options.push("Continue the analysis");
  }

  return {
    character_dialogue: String(safePayload.character_dialogue || "State update generated."),
    internal_thinking_state: String(safePayload.internal_thinking_state || "No hidden instability detected."),
    rig_control: {
      movement_id: Number(rigControl.movement_id || 506),
      expression_flag: allowedStates.has(rigControl.expression_flag) ? rigControl.expression_flag : "state-analytical"
    },
    economy_update: {
      xp_gained: Number(economyUpdate.xp_gained || 10),
      special_credits_balance: Number(economyUpdate.special_credits_balance || 0)
    },
    quiz_matrix: {
      active_quiz: Boolean(quizMatrix.active_quiz),
      question_text: String(quizMatrix.question_text || "Choose the next strategic vector."),
      options
    }
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
    console.log(`The S Tier Move simulator is running at http://localhost:${port}`);
  });
}

export const api = onRequest({
  region: "us-central1",
  cors: true,
  timeoutSeconds: 120,
  memory: "512MiB"
}, app);
