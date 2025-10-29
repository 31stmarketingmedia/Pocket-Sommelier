export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export interface PairingRecommendation {
  name: string;
  type: string;
  description: string;
  reasoning: string;
  estimatedPrice: string;
}

export interface Vendor {
  name: string;
  affiliateLink: string; // This is a template URL
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface NearbyPlace {
  title: string;
  uri: string;
}