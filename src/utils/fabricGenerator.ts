/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A high-fidelity procedural textile weave generator
// This creates realistic fabric macro structures for handloom vs powerloom comparison.
// It uses seed-based random numbers so that the exact same "fingerprint" can be reproduced.

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Returns a number between 0 and 1
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  // Returns a number in range [min, max]
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export interface GeneratorOptions {
  type: "handloom" | "powerloom";
  mainColor: string;
  accentColor: string;
  patternStyle: "kasavu" | "silk" | "paithani" | "cotton";
  seed: number;
  rotation?: number; // degrees
  lighting?: "neutral" | "shop_warm";
  cameraNoise?: boolean;
}

export function generateFabricDataUrl(options: GeneratorOptions): string {
  // We can create an offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const rand = new SeededRandom(options.seed);

  // Clear background
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, 300, 300);

  // Apply camera transformation if specified (rotation / translation)
  ctx.save();
  ctx.translate(150, 150);
  if (options.rotation) {
    ctx.rotate((options.rotation * Math.PI) / 180);
  }
  ctx.translate(-150, -150);

  // Configure weaving parameters
  const threadSpacing = options.patternStyle === "silk" ? 10 : 12;
  const handloomNoiseAmplitude = options.type === "handloom" ? 1.5 : 0;
  const slubFrequency = options.type === "handloom" ? 0.08 : 0;

  // Draw background weave (base fabric structure)
  ctx.fillStyle = options.mainColor;
  ctx.fillRect(0, 0, 300, 300);

  // Draw vertical threads (Warp)
  for (let x = 0; x < 300; x += threadSpacing) {
    ctx.beginPath();
    
    // Add handloom irregularity to the straightness of the thread
    let currentX = x;
    ctx.moveTo(currentX, 0);

    const steps = 15;
    const stepSize = 300 / steps;

    for (let i = 1; i <= steps; i++) {
      const y = i * stepSize;
      let xOffset = 0;
      if (options.type === "handloom") {
        xOffset = rand.range(-handloomNoiseAmplitude, handloomNoiseAmplitude);
      }
      ctx.lineTo(x + xOffset, y);
    }

    // Thread thickness
    let baseWidth = options.patternStyle === "silk" ? 3 : 4;
    if (options.type === "handloom") {
      // Slub effect (human-spun thread has thin and thick sections)
      baseWidth += rand.range(-1, 1.5);
    }
    ctx.lineWidth = Math.max(1.5, baseWidth);

    // Thread color variation
    const brightnessDiff = rand.range(-15, 15);
    ctx.strokeStyle = adjustColorBrightness(options.mainColor, brightnessDiff);
    ctx.stroke();
  }

  // Draw horizontal threads (Weft)
  for (let y = 0; y < 300; y += threadSpacing) {
    ctx.beginPath();
    
    let currentY = y;
    ctx.moveTo(0, currentY);

    const steps = 15;
    const stepSize = 300 / steps;

    for (let i = 1; i <= steps; i++) {
      const x = i * stepSize;
      let yOffset = 0;
      if (options.type === "handloom") {
        yOffset = rand.range(-handloomNoiseAmplitude, handloomNoiseAmplitude);
      }
      ctx.lineTo(x, y + yOffset);
    }

    // Thread thickness with slubs
    let baseWidth = options.patternStyle === "silk" ? 3 : 4;
    if (options.type === "handloom") {
      if (rand.next() < slubFrequency) {
        // A "slub" or deliberate human imperfection
        baseWidth += rand.range(1.5, 3.5);
      } else {
        baseWidth += rand.range(-0.8, 0.8);
      }
    }
    ctx.lineWidth = Math.max(1.5, baseWidth);

    // Color variation for horizontal weft
    // Some are accent color if there's a pattern, else mainColor adjusted
    let threadColor = options.mainColor;
    if (options.patternStyle === "kasavu" && y % (threadSpacing * 3) === 0) {
      threadColor = options.accentColor; // Golden zari thread
    } else if (options.patternStyle === "paithani" && y % (threadSpacing * 2) === 0) {
      threadColor = options.accentColor; // Peacock color accents
    }

    const brightnessDiff = rand.range(-10, 10);
    ctx.strokeStyle = adjustColorBrightness(threadColor, brightnessDiff);
    
    // Add semi-transparent overlap effect for realistic textile weave
    ctx.globalAlpha = 0.85;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  // Restore transform state
  ctx.restore();

  // Apply lighting overlays
  if (options.lighting === "shop_warm") {
    // Simulated warm yellow overhead shop lighting
    const gradient = ctx.createRadialGradient(100, 100, 10, 150, 150, 250);
    gradient.addColorStop(0, "rgba(255, 230, 160, 0.35)");
    gradient.addColorStop(0.5, "rgba(255, 200, 120, 0.15)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
  } else {
    // Soft studio lighting
    const gradient = ctx.createRadialGradient(150, 150, 50, 150, 150, 220);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 300, 300);
  }

  // Add camera grain/noise if requested
  if (options.cameraNoise) {
    const imgData = ctx.getImageData(0, 0, 300, 300);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 15;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));     // R
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise)); // G
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise)); // B
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL("image/jpeg", 0.85);
}

// Utility to lighten or darken a hex color
function adjustColorBrightness(hex: string, percent: number): string {
  let R = parseInt(hex.substring(1, 3), 16);
  let G = parseInt(hex.substring(3, 5), 16);
  let B = parseInt(hex.substring(5, 7), 16);

  R = Math.min(255, Math.max(0, R + percent));
  G = Math.min(255, Math.max(0, G + percent));
  B = Math.min(255, Math.max(0, B + percent));

  const rHex = R.toString(16).padStart(2, "0");
  const gHex = G.toString(16).padStart(2, "0");
  const bHex = B.toString(16).padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`;
}
