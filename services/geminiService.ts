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
      }
    },
    required: ['name', 'type', 'description', 'reasoning'],
    propertyOrdering: ["name", "type", "description", "reasoning"],
  },
};

export async function getPairingRecommendations(food: string, season: Season): Promise<PairingRecommendation[]> {
  const prompt = `You are a fun, friendly, and expert sommelier with a vast knowledge of food and drink pairings. It is currently ${season}. For the following dish: "${food}", provide a list of 5 ideal and creative drink pairings that are seasonally appropriate.
  
  For ${season}, focus on pairings that complement the weather and typical ingredients of the season. For example, in summer, suggest refreshing options, and in winter, suggest warmer, richer drinks.

  Please include a diverse and fun range of options, such as:
  - At least one wine (red, white, or sparkling).
  - At least one beer.
  - At least one cocktail or spirit (like Tequila, Gin, or Whiskey).
  - At least one non-alcoholic option.
  
  For each pairing, provide the drink's specific name, its general type, a brief description of the drink, and a detailed reasoning for why it's a great match for the dish. Focus on flavor interactions, contrasts, and complements in a fun and accessible way.`;

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
