import { NextResponse } from "next/server";
import { ALL_CATEGORIES, classifyByRules, defaultCategory, UNCLASSIFIED } from "@/lib/categories";

interface ClassifyItem {
  id: string;
  description: string;
  amount: number;
}

const BATCH_SIZE = 150;

export async function POST(request: Request) {
  let items: ClassifyItem[];
  try {
    const body = await request.json();
    items = body.transactions;
    if (!Array.isArray(items)) throw new Error("transactions debe ser un array");
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Primera pasada: reglas locales (gratis y deterministas)
  const categories: Record<string, string> = {};
  const pending: ClassifyItem[] = [];
  for (const item of items) {
    const byRule = classifyByRules(item.description, item.amount);
    if (byRule !== UNCLASSIFIED) categories[item.id] = byRule;
    else pending.push(item);
  }

  // Segunda pasada: Gemini para lo que las reglas no cubren
  const apiKey = process.env.GEMINI_API_KEY;
  let aiUsed = false;
  let aiError: string | undefined;

  if (apiKey && pending.length > 0) {
    try {
      for (let i = 0; i < pending.length; i += BATCH_SIZE) {
        const batch = pending.slice(i, i + BATCH_SIZE);
        const result = await classifyWithGemini(batch, apiKey);
        Object.assign(categories, result);
      }
      aiUsed = true;
    } catch (err) {
      aiError = err instanceof Error ? err.message : "Error desconocido de Gemini";
    }
  }

  // Cierre de huecos: lo que quede sin clasificar recibe categoría genérica
  for (const item of items) {
    if (!categories[item.id] || !ALL_CATEGORIES.includes(categories[item.id])) {
      categories[item.id] = defaultCategory(item.amount);
    }
  }

  return NextResponse.json({ categories, aiUsed, aiError, aiPending: pending.length });
}

async function classifyWithGemini(
  batch: ClassifyItem[],
  apiKey: string
): Promise<Record<string, string>> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const lines = batch
    .map((t, i) => `${i}|${t.amount >= 0 ? "INGRESO" : "GASTO"}|${t.description.slice(0, 120)}`)
    .join("\n");

  const prompt = `Eres un asistente de contabilidad para autónomos y pequeñas empresas en España.
Clasifica cada movimiento bancario en UNA de estas categorías exactas:
${ALL_CATEGORIES.map((c) => `- ${c}`).join("\n")}

Movimientos (formato índice|tipo|concepto):
${lines}

Responde SOLO con un array JSON de objetos {"i": <índice>, "c": "<categoría exacta de la lista>"}. Sin explicaciones.`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini ${response.status}: ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Respuesta vacía de Gemini");

  const parsed: { i: number; c: string }[] = JSON.parse(raw);
  const result: Record<string, string> = {};
  for (const { i, c } of parsed) {
    const item = batch[i];
    if (item && ALL_CATEGORIES.includes(c)) result[item.id] = c;
  }
  return result;
}
