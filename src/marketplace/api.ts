/**
 * Client helpers for the marketplace modules' AI calls.
 *
 * `suggestProduct()` calls the real /api/suggest-product endpoint. If the
 * backend is unreachable (e.g. a static-only deploy), it falls back to a local
 * heuristic so the photo-first onboarding demo never breaks.
 */
export interface ProductSuggestion {
  title: string;
  category: string;
  material: string;
  confidence: number;
  isMock: boolean;
}

export async function suggestProduct(photo: string): Promise<ProductSuggestion> {
  try {
    const res = await fetch("/api/suggest-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) return data as ProductSuggestion;
    }
  } catch {
    /* fall through to local heuristic */
  }
  // Local fallback (no backend / no key) — still returns something sensible.
  await new Promise((r) => setTimeout(r, 900));
  return {
    title: "Handwoven Fabric Piece",
    category: "Fabric",
    material: "Cotton or silk blend",
    confidence: 70,
    isMock: true,
  };
}
