/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";


// Load .env.local first, then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

// Enable parsing of large base64 payloads
app.use(express.json({ limit: "15mb" }));

// ── File-Based Database ──────────────────────────────────────────────────────
const DB_PATH = process.env.VERCEL 
  ? path.join("/tmp", "db.json") 
  : path.join(process.cwd(), "db.json");

// Seed data to initialize a fresh database
const SEED_DATA = [
  {
    id: "AT-2026-948F",
    weaverName: "Lakshmi Devi",
    weaverAge: 52,
    weaverBio:
      "A third-generation master weaver from Kuthampully, Kerala, specializing in traditional Kasavu cotton weave with pure silver and gold borders. She has been weaving since she was 14 years old.",
    village: "Kuthampully",
    cooperative: "Kuthampully Handloom Weavers Cooperative Society",
    material: "Traditional Kasavu Cotton (Fine 100s count) with Pure Silver-Gilt Zari",
    daysOfLabor: 12,
    price: 14500,
    patternType: "Traditional Kasavu Saree",
    registeredDate: "2026-06-15",
    patternStyle: "kasavu",
    mainColor: "#faf6f0",
    accentColor: "#d4af37",
    seed: 4891,
  },
  {
    id: "AT-2026-302K",
    weaverName: "Ramanathan K.",
    weaverAge: 61,
    weaverBio:
      "Awarded the National Handloom Merit Certificate in 2018. Specialist in pure double-warp Kanchipuram silk with complex structural jacquard-style border patterns.",
    village: "Kanchipuram",
    cooperative: "Kanchipuram Silk-Weavers Cooperative Society Ltd.",
    material: "100% Pure Mulberry Silk (Double Warp) with 22k Gold Threading",
    daysOfLabor: 18,
    price: 38500,
    patternType: "Temple Border Silk Saree",
    registeredDate: "2026-07-01",
    patternStyle: "silk",
    mainColor: "#7d051c",
    accentColor: "#d4af37",
    seed: 7102,
  },
  {
    id: "AT-2026-715M",
    weaverName: "Savita Patwardhan",
    weaverAge: 39,
    weaverBio:
      "Highly recognized for reviving traditional Peshwai borders and intricate peacock pallus. She operates a workshop supporting 15 local women weavers.",
    village: "Paithan",
    cooperative: "Maharashtra State Handlooms Development Corporation",
    material: "Fine Mulberry Silk with Pure Zari Border and Peacock Pallu",
    daysOfLabor: 24,
    price: 52000,
    patternType: "Paithani Traditional Peacock Saree",
    registeredDate: "2026-07-09",
    patternStyle: "paithani",
    mainColor: "#026c7d",
    accentColor: "#e65c00",
    seed: 3345,
  },
];

function loadDatabase(): any[] {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[DB] Loaded ${parsed.length} sarees from db.json`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[DB] Could not read db.json, using seed data.", err);
  }
  // First run — write seed data
  saveDatabase(SEED_DATA);
  return [...SEED_DATA];
}

function saveDatabase(data: any[]) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[DB] Failed to write db.json:", err);
  }
}

// Load persisted sarees on startup
let registeredSarees: any[] = loadDatabase();

// ── Gemini Client ────────────────────────────────────────────────────────────
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ── API Routes ───────────────────────────────────────────────────────────────

// 1. Get all registered sarees
app.get("/api/sarees", (_req, res) => {
  res.json(registeredSarees);
});

// 2. Get single saree by ID
app.get("/api/sarees/:id", (req, res) => {
  const saree = registeredSarees.find((s) => s.id === req.params.id);
  if (!saree) return res.status(404).json({ error: "Saree not found." });
  res.json(saree);
});

// 3. Register a new saree
app.post("/api/register", (req, res) => {
  const {
    weaverName,
    weaverAge,
    weaverBio,
    village,
    cooperative,
    material,
    daysOfLabor,
    price,
    patternType,
    patternStyle,
    mainColor,
    accentColor,
    seed,
    referencePhoto,
  } = req.body;

  if (!weaverName || !village || !cooperative || !material) {
    return res.status(400).json({ error: "Missing required fields for registration." });
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
  const id = `AT-2026-${randomSuffix}`;

  const newSaree = {
    id,
    weaverName,
    weaverAge: Number(weaverAge) || 45,
    weaverBio: weaverBio || "Dedicated traditional handloom artisan.",
    village,
    cooperative,
    material,
    daysOfLabor: Number(daysOfLabor) || 10,
    price: Number(price) || 12000,
    patternType: patternType || "Traditional Handwoven Fabric",
    registeredDate: new Date().toISOString().split("T")[0],
    patternStyle: patternStyle || "cotton",
    mainColor: mainColor || "#f5f5f5",
    accentColor: accentColor || "#ffd700",
    seed: Number(seed) || Math.floor(Math.random() * 10000),
    referencePhoto: referencePhoto || "",
  };

  registeredSarees.unshift(newSaree);
  saveDatabase(registeredSarees); // Persist to disk
  res.status(201).json(newSaree);
});

// 4. AI-Powered Verification
app.post("/api/verify", async (req, res) => {
  const { sareeId, referencePhoto, shopperPhoto, scanType, weaverName } = req.body;

  if (!referencePhoto || !shopperPhoto) {
    return res
      .status(400)
      .json({ error: "Reference fingerprint photo and fresh shop scan photo are required." });
  }

  const cleanBase64 = (base64Str: string) =>
    base64Str.replace(/^data:image\/\w+;base64,/, "");

  const ai = getGeminiClient();

  // If no Gemini client, use high-fidelity simulation
  if (!ai) {
    console.log("Gemini API key not found. Using high-fidelity local simulation.");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (scanType === "matching") {
      return res.json({
        isDemoFallback: true,
        isMatch: true,
        matchScore: 97,
        reasoning: `Weave Fingerprint Match Verified. Meticulous texture alignment shows identical handwoven signature warp-weft crossovers. Slight coordinate variations align perfectly within natural handloom structural tolerances. Micro-imperfections are identical in both reference and scan.`,
        detailedAnalysis: {
          weaveStructure:
            "A high-precision horizontal and vertical spacing cross-correlation of 98.4% indicates that both snapshots contain identical thread densities and crossing coordinates.",
          threadTension:
            "Identical micro-laxity and human-tension patterns are visible. The natural hand-weaving weave signatures match perfectly.",
          patternAlignment:
            "The border pattern intersections and horizontal transitions line up perfectly with a minor 1.2-degree angle correction applied.",
        },
        recommendation: `✅ Genuine Handloom. Fabric authenticated as woven by ${weaverName || "the registered artisan"}.`,
      });
    } else if (scanType === "powerloom") {
      return res.json({
        isDemoFallback: true,
        isMatch: false,
        matchScore: 12,
        reasoning: `MISMATCH DETECTED: Powerloom Fake. While the colors match, the store scan displays absolute mathematical grid-uniformity. Hand-weaving organic slubs and slight horizontal tension variations present in the registered reference fingerprint are completely absent in the scanned saree, indicating automated machine replication.`,
        detailedAnalysis: {
          weaveStructure:
            "The scanned saree has a mathematically perfect weave. Warp and weft threads maintain an absolute parallel grid, which is physically impossible on a hand-operated traditional loom.",
          threadTension:
            "Tension variance index is 0.0%, displaying absolute uniform machine tension. The registered saree has an organic 4.7% human tension signature which this scan lacks.",
          patternAlignment:
            "A perfect geometric repetition signature is present, confirming this is a machine-made copy (powerloom fake) exploiting a duplicated sticker.",
        },
        recommendation: `❌ Mismatch. This piece is a machine-made powerloom imitation! It does not match the registered handwoven fingerprint.`,
      });
    } else {
      return res.json({
        isDemoFallback: true,
        isMatch: false,
        matchScore: 5,
        reasoning: `NO MATCH FOUND. The store scan represents an entirely different fabric pattern, material density, and color weave profile. There is zero structural correlation with the registered fingerprint for ID ${sareeId || "Asli Taana"}.`,
        detailedAnalysis: {
          weaveStructure:
            "Color channels and thread count ratios are entirely different. There is no weave intersection match.",
          threadTension:
            "No correlation found between the registered human tension profiles and this scanned item.",
          patternAlignment:
            "Completely unrelated visual pattern. This is either a mismatched item or a counterfeit tag.",
        },
        recommendation: `❌ Mismatch. The cloth weave does not match the registered item.`,
      });
    }
  }

  // Real Gemini Multimodal Comparison
  try {
    const referenceImagePart = {
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: cleanBase64(referencePhoto),
      },
    };

    const shopperImagePart = {
      inlineData: {
        mimeType: "image/jpeg" as const,
        data: cleanBase64(shopperPhoto),
      },
    };

    const prompt = `You are the AI textile matching engine for "Asli Taana" ("The Real Thread"), a high-impact national-level hackathon platform designed to verify handloom authenticity.
You are given two magnified, close-up macro photographs of a fabric weave:
- Image 1 (First Part): The officially registered "Reference Thread Fingerprint" taken at the weaver cooperative.
- Image 2 (Second Part): The "Fresh Shop Scan" taken by a shopper/inspector in a retail outlet.

Your job is to compare the weave in Image 1 with the weave in Image 2.
1. Determine if they represent the EXACT same piece of cloth at the exact same spot (with tolerance for small differences in lighting, camera rotation up to 10 degrees, or image resolution).
2. Note that handloom cloth has a unique "fingerprint" composed of tiny random inconsistencies in thread thickness (slubs), micro-tension variations (slightly tighter or looser weave), and minor natural waviness in threads.
3. Powerloom cloth is perfectly uniform with an absolute geometric grid of identical, perfectly parallel threads and zero slubs. If the fresh scan is a powerloom copy, it will look perfectly uniform and regular, unlike the organic variations in the handloom reference.
4. Calculate a matchScore (0 to 100) representing confidence that they are the same spot. A genuine match of the same handloom spot with slight angle/lighting changes should score 85-100. A powerloom copy should score very low (under 20) because it lacks the organic irregularities of the original handloom weave. An entirely different fabric should score extremely low (under 10).

You MUST respond strictly in the following JSON format. Do not write any markdown, do not include any text before or after the JSON.
{
  "isMatch": boolean,
  "matchScore": number,
  "reasoning": "A concise paragraph summarizing your visual comparison, referencing warp-weft alignment, handloom irregularities, and whether it represents the original registered cloth or a fake.",
  "detailedAnalysis": {
    "weaveStructure": "Analysis of the thread count, densities, warp and weft crossing points.",
    "threadTension": "Analysis of human-tension organic variations (handloom) vs mathematically perfect spacing (powerloom).",
    "patternAlignment": "Analysis of pattern coordinates, color transitions, and camera tilt correction."
  },
  "recommendation": "A friendly authenticating statement or warning, mentioning the weaver name (${weaverName || "registered weaver"})."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [referenceImagePart, shopperImagePart, { text: prompt }],
      config: {
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText.trim());
    res.json({ isDemoFallback: false, ...resultJson });
  } catch (err: any) {
    console.error("Gemini API call failed: ", err);
    res
      .status(500)
      .json({ error: "AI matching failed. Please check backend logs or try again.", details: err.message });
  }
});

// ── Vite / Static Serving ─────────────────────────────────────────────────────
async function startServer() {
  if (process.env.VERCEL) {
    // Vercel serverless environment: do not start Vite or listen on port
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Asli Taana Server] running on http://0.0.0.0:${PORT}`);
    console.log(`[DB] Persistent database: ${DB_PATH}`);
    console.log(`[AI] Gemini client: ${getGeminiClient() ? "✅ Connected" : "⚠️  Simulation mode"}`);
  });
}

startServer();

// Export the app for Vercel serverless functions
export default app;
