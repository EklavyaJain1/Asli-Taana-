import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const openRouterKey = process.env.OPENROUTER_API_KEY;

const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function test() {
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
            { type: "text", text: "Hello, reply strictly with this JSON: {\"isMatch\": true, \"matchScore\": 100, \"reasoning\": \"It is a match.\", \"detailedAnalysis\": {\"weaveStructure\": \"Ok\", \"threadTension\": \"Ok\", \"patternAlignment\": \"Ok\"}, \"recommendation\": \"Good\", \"detectedStyle\": \"Saree\", \"styleConfidence\": 100, \"styleNotes\": \"Notes\"}" },
            { type: "image_url", image_url: { url: `data:image/png;base64,${pixel}` } },
            { type: "image_url", image_url: { url: `data:image/png;base64,${pixel}` } }
          ]
        }
      ]
    })
  });
  
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
}

test();
