/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import twilio from "twilio";

// Load .env.local first, then .env as fallback
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = 3000;

// Enable parsing of large base64 payloads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

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
    colors,
    weaverPhoto,
    referencePhoto,
    detectedStyle,
    styleConfidence,
    styleNotes,
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
    colors: colors || ["#f5f5f5", "#ffd700"],
    weaverPhoto: weaverPhoto || "",
    referencePhoto: referencePhoto || "",
    detectedStyle,
    styleConfidence: Number(styleConfidence) || 0,
    styleNotes,
  };

  registeredSarees.unshift(newSaree);
  saveDatabase(registeredSarees); // Persist to disk
  res.status(201).json(newSaree);
});

// 4. AI Style Classification (for registration)
app.post("/api/classify-style", async (req, res) => {
  const { referencePhoto } = req.body;
  if (!referencePhoto) {
    return res.status(400).json({ error: "Reference photo is required." });
  }

  const cleanBase64 = (base64Str: string) => base64Str.replace(/^data:image\/\w+;base64,/, "");
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey || openRouterKey === "MY_OPENROUTER_API_KEY") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return res.json({
      detectedStyle: "Kanchipuram Silk (Temple Border)",
      styleConfidence: 92,
      styleNotes: "Simulated detection based on heavy zari border and solid contrasting color blocks typical of Kanchipuram styles."
    });
  }

  try {
    const prompt = `You are a master handloom textile expert. Analyze the provided macro photograph of a fabric weave.
Identify the visual weaving style/motif (e.g. Kanchipuram, Paithani, Banarasi, Ikat, Chanderi, Bandhani, Kasavu, or "Unidentified/Other").
Provide a confidence score (0-100) and a brief 1-2 sentence explanation of the visual cues you used (e.g., motif type, border pattern, zari usage).

You MUST respond strictly in the following JSON format. Do not write any markdown, do not include any text before or after the JSON.
{
  "detectedStyle": "string",
  "styleConfidence": number,
  "styleNotes": "string"
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Asli Taana"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64(referencePhoto)}` } }
            ]
          }
        ]
      })
    });

    const json = await response.json();
    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));

    let resultText = json.choices[0].message.content || "{}";
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultJson = JSON.parse(resultText);
    res.json(resultJson);
  } catch (err: any) {
    console.error("OpenRouter style classification failed: ", err);
    res.status(500).json({ error: "Style classification failed." });
  }
});

// 5. AI-Powered Verification
app.post("/api/verify", async (req, res) => {
  const { sareeId, referencePhoto, shopperPhoto, scanType, weaverName } = req.body;

  if (!referencePhoto || !shopperPhoto) {
    return res
      .status(400)
      .json({ error: "Reference fingerprint photo and fresh shop scan photo are required." });
  }

  const cleanBase64 = (base64Str: string) =>
    base64Str.replace(/^data:image\/\w+;base64,/, "");

  const openRouterKey = process.env.OPENROUTER_API_KEY;

  // If no OpenRouter key, use high-fidelity simulation
  if (!openRouterKey || openRouterKey === "MY_OPENROUTER_API_KEY") {
    console.log("OpenRouter API key not found. Using high-fidelity local simulation.");
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (scanType === "matching" || scanType === "custom") {
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
        detectedStyle: "Kanchipuram Silk",
        styleConfidence: 94,
        styleNotes: "Visible dense temple border jacquard weaving with pure zari, consistent with Kanchipuram techniques."
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
        detectedStyle: "Powerloom Replica (Kanchipuram Style)",
        styleConfidence: 98,
        styleNotes: "The motif mimics a Kanchipuram border, but the absolute mathematical grid and lack of slubs indicates machine automation."
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
        detectedStyle: "Unidentified/Other",
        styleConfidence: 45,
        styleNotes: "The visual pattern is completely different from the registered item, lacking specific identifiable traditional motifs."
      });
    }
  }

  // Real OpenRouter Multimodal Comparison
  try {
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
  "recommendation": "A friendly authenticating statement or warning, mentioning the weaver name (${weaverName || "registered weaver"}).",
  "detectedStyle": "The visual weaving style/motif identified from the images (e.g. Kanchipuram Silk, Paithani, Ikat, etc.)",
  "styleConfidence": "Number between 0-100",
  "styleNotes": "1-2 sentences explaining the visual cues (motif type, border pattern, zari) used to identify the style"
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Asli Taana"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64(referencePhoto)}` } },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64(shopperPhoto)}` } }
            ]
          }
        ]
      })
    });

    const json = await response.json();
    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));

    let resultText = json.choices[0].message.content || "{}";
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const resultJson = JSON.parse(resultText);
    res.json({ isDemoFallback: false, ...resultJson });
  } catch (err: any) {
    console.error("OpenRouter API call failed: ", err);
    res
      .status(500)
      .json({ error: "AI matching failed. Please check backend logs or try again.", details: err.message });
  }
});

// 6. Fabric Identity Classification (Independent feature)
app.post("/api/identify-fabric", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Fabric image is required." });
  }

  const cleanBase64 = (base64Str: string) => base64Str.replace(/^data:image\/\w+;base64,/, "");
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey || openRouterKey === "MY_OPENROUTER_API_KEY") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const fallbackMapPath = path.join(process.cwd(), "data", "craft-origin-map.json");
    let mapData: any = {};
    if (fs.existsSync(fallbackMapPath)) {
      mapData = JSON.parse(fs.readFileSync(fallbackMapPath, "utf-8"));
    }
    const mockFiber = "silk";
    const fiberInfo = mapData[mockFiber] || { description: "Simulated silk", grown_in: [], woven_in: [] };
    
    return res.json({
      fiber_type: mockFiber,
      weave_pattern: "twill",
      confidence: 95,
      visible_indicators: ["smooth sheen", "fine thread thickness"],
      originData: fiberInfo
    });
  }

  try {
    const prompt = `You are a textile fiber classifier for a handloom authentication app.
Given this fabric image, identify:
1. fiber_type: one of [cotton, silk, wool, linen, synthetic_blend, tussar_silk, muga_silk, other]
2. weave_pattern: one of [plain_weave, twill, jacquard, jamdani, ikat, unknown]
3. confidence: 0-100
4. visible_indicators: 1-2 short phrases on visual cues (sheen, texture, thread thickness)
Respond ONLY in this JSON format, no extra text:
{"fiber_type": "", "weave_pattern": "", "confidence": 0, "visible_indicators": []}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Asli Taana"
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64(image)}` } }
            ]
          }
        ]
      })
    });

    const json = await response.json();
    if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));

    let resultText = json.choices[0].message.content || "{}";
    resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResult = JSON.parse(resultText);

    // Look up knowledge base
    const mapPath = path.join(process.cwd(), "data", "craft-origin-map.json");
    let originData = null;
    if (fs.existsSync(mapPath)) {
      const mapContent = fs.readFileSync(mapPath, "utf-8");
      const craftMap = JSON.parse(mapContent);
      if (aiResult.fiber_type && craftMap[aiResult.fiber_type]) {
        originData = craftMap[aiResult.fiber_type];
      }
    }

    res.json({
      ...aiResult,
      originData
    });
  } catch (err: any) {
    console.error("OpenRouter fabric identification failed: ", err);
    res.status(500).json({ error: "Fabric identification failed.", details: err.message });
  }
});

// ── WhatsApp Integration (Twilio) ─────────────────────────────────────────────

// In-memory session state for WhatsApp users
const whatsappSessions: Record<string, { step: number; data: any }> = {};

const WHATSAPP_QUESTIONS = [
  "Great! Let's start with your name. What is your full name?",
  "What Is Your Phone Number?",
  "Now, could you send a clear photo of yourself (a simple selfie or headshot works)? This will appear on your weaver profile so buyers can see the person behind the craft.",
  "Which village or town are you weaving in?",
  "Which district is that in?",
  "And which state?",
  "What's the PIN code of your area?",
  "What handloom style or craft do you weave? (e.g. Kanchipuram, Paithani, Banarasi, Chanderi, Jamdani, or your own regional style)",
  "How many years have you been weaving?",
  "What type of Material did you use?",
  "Are you part of a weaving cooperative or society? If yes, share its name. If not, type SKIP.",
  "What do you mainly weave? (e.g. saree, dupatta, stole, fabric by the metre)",
  "Now please send one clear photo of a sample of your fabric/product — this is different from your headshot above, and helps us verify your craft and build your Fabric Identity Card.",
  "To receive payments for orders through Asli Taana, please share your UPI ID or bank account number. You can type SKIP and add this later.",
  "For verification, please share your Aadhaar number or Weaver ID card number. This is kept private and only used to confirm your identity. Type SKIP to complete this at the offline verification stage instead.",
  "Last step! Do you agree to let Asli Taana store your details and display your name, photo, craft, and story (not your private ID/payment info) on your product's digital Fabric Identity Card? Reply YES or NO."
];

app.post("/api/whatsapp/webhook", async (req, res) => {
  const { Body, From, NumMedia, MediaUrl0 } = req.body;
  const twiml = new twilio.twiml.MessagingResponse();

  if (!whatsappSessions[From]) {
    whatsappSessions[From] = { step: 0, data: {} };
  }
  const session = whatsappSessions[From];

  try {
    const text = Body ? Body.trim() : "";

    // Image Upload Steps (Step 2 and Step 12)
    if (session.step === 3 || session.step === 13) {
      if (NumMedia && parseInt(NumMedia) > 0) {
        const imageRes = await fetch(MediaUrl0);
        const arrayBuffer = await imageRes.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');
        
        if (session.step === 3) {
          session.data.headshot_photo = `data:image/jpeg;base64,${base64Image}`;
        } else {
          session.data.fabric_sample_photo = `data:image/jpeg;base64,${base64Image}`;
        }
      } else {
        twiml.message("Please send a photo to continue.");
        res.writeHead(200, { 'Content-Type': 'text/xml' });
        return res.end(twiml.toString());
      }
    } else if (session.step > 0) {
      // Text Steps
      switch (session.step) {
        case 1: session.data.full_name = text; break;
        case 2: session.data.mobile_number = text; break;
        case 4: session.data.village_town = text; break;
        case 5: session.data.district = text; break;
        case 6: session.data.state = text; break;
        case 7: session.data.pin_code = text; break;
        case 8: session.data.weaving_style = text; break;
        case 9: session.data.years_experience = text; break;
        case 10: session.data.Material_Type = text; break;
        case 11: session.data.cooperative_society = text; break;
        case 12: session.data.product_type = text; break;
        case 14: session.data.bank_upi_id = text; break;
        case 15: session.data.id_proof_number = text; break;
        case 16: session.data.consent = text; break;
      }
    }

    if (session.step === 16) {
      // Registration complete, process data
      const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
      const id = `AT-2026-${randomSuffix}`;

      const newSaree = {
        id,
        weaverName: session.data.full_name || "Unknown",
        mobile_number: session.data.mobile_number || From,
        weaverAge: 45,
        years_experience: Number(session.data.years_experience) || 0,
        weaverBio: `A weaver from ${session.data.village_town}, ${session.data.district}, ${session.data.state}.`,
        village: session.data.village_town,
        district: session.data.district,
        state: session.data.state,
        pin_code: session.data.pin_code,
        cooperative: session.data.cooperative_society,
        material: session.data.Material_Type,
        product_type: session.data.product_type,
        bank_upi_id: session.data.bank_upi_id,
        id_proof_number: session.data.id_proof_number,
        consent: session.data.consent,
        daysOfLabor: 10,
        price: 0, // Not asked in new flow
        patternType: session.data.weaving_style,
        registeredDate: new Date().toISOString().split("T")[0],
        colors: ["#f5f5f5", "#ffd700"],
        weaverPhoto: session.data.headshot_photo || "",
        referencePhoto: session.data.fabric_sample_photo || "",
        detectedStyle: session.data.weaving_style || "WhatsApp Registration",
        styleConfidence: 100,
        styleNotes: "Registered manually via WhatsApp.",
      };

      registeredSarees.unshift(newSaree);
      saveDatabase(registeredSarees);

      twiml.message("🎉 Thank you! Your registration is submitted. Our team will verify your details and assign your unique QR Tag ID. You'll get a message here once it's ready. Namaste!");
      delete whatsappSessions[From]; // Reset session
    } else {
      twiml.message(WHATSAPP_QUESTIONS[session.step]);
      session.step++;
    }
  } catch (err) {
    console.error("WhatsApp Webhook Error:", err);
    twiml.message("Sorry, something went wrong. Please try again.");
    delete whatsappSessions[From];
  }

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
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
    console.log(`[AI] OpenRouter client: ${process.env.OPENROUTER_API_KEY ? "✅ Connected" : "⚠️  Simulation mode"}`);
  });
}

startServer();

// Export the app for Vercel serverless functions
export default app;
