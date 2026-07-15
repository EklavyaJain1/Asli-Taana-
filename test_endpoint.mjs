import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const pixel = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function test() {
  try {
    const response = await fetch("http://localhost:3000/api/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sareeId: "TEST-ID",
        weaverName: "Test Weaver",
        scanType: "matching",
        referencePhoto: `data:image/png;base64,${pixel}`,
        shopperPhoto: `data:image/png;base64,${pixel}`
      })
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

test();
