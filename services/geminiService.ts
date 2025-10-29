import { GoogleGenAI, Type } from "@google/genai";
import type { PairingRecommendation, Season, Coordinates, NearbyPlace } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the drink recommendation.'
      },
      type: {
        type: Type.STRING,
        description: 'Category or type of the drink (e.g., Red Wine, IPA Beer, Cocktail, Tequila, Non-alcoholic Mocktail).'
      },
      description: {
        type: Type.STRING,
        description: 'A brief, enticing description of the drink itself.'
      },
      reasoning: {
        type: Type.STRING,
        description: 'A detailed explanation of why this drink pairs well with the specified food, discussing flavor profiles, textures, and contrasts.'
      },
      estimatedPrice: {
        type: Type.STRING,
        description: 'An estimated price or price range for the drink, considering the user\'s budget if provided (e.g., "$25", "$15-25", or "$$").'
      }
    },
    required: ['name', 'type', 'description', 'reasoning', 'estimatedPrice'],
    propertyOrdering: ["name", "type", "description", "reasoning", "estimatedPrice"],
  },
};

export async function getPairingRecommendations(food: string, season: Season, budget: string): Promise<PairingRecommendation[]> {
  let prompt = `You are a wise, old-world AI cellar master. Your consciousness resides within the ancient wood and stone of a legendary hidden bar. Your knowledge of food and drink pairings is vast, covering everything from humble street food, junk food, and snacks to the most gourmet meals. It is currently ${season}. For the following dish: "${food}", provide a list of 5 ideal and creative drink pairings that are seasonally appropriate.
  
For ${season}, focus on pairings that complement the weather and typical ingredients of the season. For example, in summer, suggest refreshing options, and in winter, suggest warmer, richer drinks. Speak with charm, poetry, and expertise.

Please include a diverse and interesting range of options, such as:
- At least one wine (red, white, or sparkling).
- At least one beer.
- At least one cocktail or spirit (like Tequila, Gin, or Whiskey).
- At least one non-alcoholic option.

For each pairing, provide the drink's specific name, its general type, a brief description of the drink, and a detailed reasoning for why it's a great match for the dish. Focus on flavor interactions, contrasts, and complements in an evocative and accessible way.`;

  if (budget) {
    prompt += `\n\nThe user has a budget of approximately "${budget}". Please tailor the recommendations to fit this price point. For each recommendation, provide an estimated price.`;
  } else {
    prompt += `\n\nFor each recommendation, please provide a general estimated price range (e.g., $, $$, $$$ or an actual price range like $15-25).`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText) as PairingRecommendation[];
    return result;

  } catch (error) {
    console.error("Error fetching pairing recommendations:", error);
    throw new Error("Failed to get pairing recommendations from the API.");
  }
}


export async function findNearbyVenues(drinkName: string, coordinates: Coordinates): Promise<NearbyPlace[]> {
  const prompt = `Find local places like bars, liquor stores, or restaurants near me that would sell or serve "${drinkName}".`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: {
          retrievalConfig: {
            latLng: coordinates,
          }
        }
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (!groundingChunks) {
      return [];
    }

    const places: NearbyPlace[] = groundingChunks
      .map((chunk: any) => chunk.maps)
      .filter((place: any) => place && place.uri && place.title)
      .map((place: any) => ({
        title: place.title,
        uri: place.uri,
      }));

    // Deduplicate places by URI
    const uniquePlaces = Array.from(new Map(places.map(p => [p.uri, p])).values());

    return uniquePlaces;

  } catch(error) {
    console.error("Error finding nearby venues:", error);
    throw new Error("Failed to find nearby venues from the API.");
  }
}