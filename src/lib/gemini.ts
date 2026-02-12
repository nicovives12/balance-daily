import { FoodItem, MealType } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const FOOD_ANALYSIS_PROMPT = `Eres un nutricionista experto. Analiza la siguiente descripción de comida y devuelve un JSON con los alimentos detectados.

REGLAS:
- Devuelve SOLO un JSON válido, sin markdown ni texto adicional.
- Estima las calorías y macronutrientes de forma realista para porciones estándar.
- Si se menciona "desayuno", "almuerzo", "cena" o "snack", incluye el campo "mealType".
- Si no se menciona, intenta deducirlo por el tipo de comida y la hora habitual.

FORMATO DE RESPUESTA:
{
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "foods": [
    {
      "name": "Nombre del alimento",
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fat": 8
    }
  ]
}`;

const IMAGE_ANALYSIS_PROMPT = `Eres un nutricionista experto. Analiza la imagen de comida y devuelve un JSON con los alimentos que puedes identificar.

REGLAS:
- Devuelve SOLO un JSON válido, sin markdown ni texto adicional.
- Identifica cada alimento visible en la imagen.
- Estima las calorías y macronutrientes de forma realista basándote en el tamaño de la porción visible.
- Intenta deducir el tipo de comida (mealType) por lo que ves.

FORMATO DE RESPUESTA:
{
  "mealType": "breakfast" | "lunch" | "dinner" | "snack",
  "foods": [
    {
      "name": "Nombre del alimento",
      "calories": 250,
      "protein": 20,
      "carbs": 30,
      "fat": 8
    }
  ]
}`;

export interface GeminiAnalysisResult {
    mealType?: MealType;
    foods: FoodItem[];
}

function parseGeminiResponse(text: string): GeminiAnalysisResult {
    // Remove markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(cleaned);

    if (!data.foods || !Array.isArray(data.foods) || data.foods.length === 0) {
        throw new Error('No se pudieron detectar alimentos');
    }

    return {
        mealType: data.mealType as MealType | undefined,
        foods: data.foods.map((f: any) => ({
            name: f.name || 'Alimento',
            calories: Math.round(f.calories || 0),
            protein: Math.round(f.protein || 0),
            carbs: Math.round(f.carbs || 0),
            fat: Math.round(f.fat || 0),
        })),
    };
}

/**
 * Analyze food from a text description using Gemini.
 */
export async function analyzeTextWithGemini(description: string): Promise<GeminiAnalysisResult> {
    if (!GEMINI_API_KEY) throw new Error('API key de Gemini no configurada');

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: `${FOOD_ANALYSIS_PROMPT}\n\nDescripción: ${description}` }
                ]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
            }
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error de API (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía de Gemini');

    return parseGeminiResponse(text);
}

/**
 * Analyze food from an image using Gemini Vision.
 * @param base64Image - Base64 encoded image data (without the data:... prefix)
 * @param mimeType - Image MIME type (e.g., 'image/jpeg')
 */
export async function analyzeImageWithGemini(
    base64Image: string,
    mimeType: string
): Promise<GeminiAnalysisResult> {
    if (!GEMINI_API_KEY) throw new Error('API key de Gemini no configurada');

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: IMAGE_ANALYSIS_PROMPT },
                    {
                        inlineData: {
                            mimeType,
                            data: base64Image,
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
            }
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error de API (${response.status})`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respuesta vacía de Gemini');

    return parseGeminiResponse(text);
}

/**
 * Convert a File to base64.
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data:image/...;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
