import React from 'react';
import type { Season } from '../types';

interface SeasonalSuggestionsProps {
  season: Season;
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions: Record<Season, string[]> = {
  Spring: ["Lemon Herb Chicken", "Asparagus Risotto", "Strawberry Salad"],
  Summer: ["Grilled BBQ Ribs", "Caprese Salad", "Spicy Fish Tacos"],
  Autumn: ["Butternut Squash Soup", "Roast Turkey", "Apple Crumble"],
  Winter: ["Hearty Beef Stew", "Rich Chocolate Fondue", "Coq au Vin"],
};

const seasonInfo: Record<Season, { color: string }> = {
    Spring: { color: 'text-green-400' },
    Summer: { color: 'text-yellow-300' },
    Autumn: { color: 'text-orange-400' },
    Winter: { color: 'text-blue-300' },
};

const SeasonalSuggestions: React.FC<SeasonalSuggestionsProps> = ({ season, onSuggestionClick }) => {
    const currentSuggestions = suggestions[season];

    return (
        <div className="text-center py-8 px-4 bg-card-brown rounded-lg border border-accent-gold/40">
            <h3 className={`text-2xl font-bold mb-4 text-accent-gold font-serif`}>
                Try a Seasonal Favorite for {season}
            </h3>
            <p className="text-text-white/70 mb-6 max-w-2xl mx-auto">Click a suggestion to instantly find perfect pairings for the current season.</p>
            <div className="flex flex-wrap justify-center gap-3">
                {currentSuggestions.map(suggestion => (
                    <button
                        key={suggestion}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="bg-accent-blue border border-blue-400/50 px-4 py-2 rounded-full text-text-white font-medium hover:bg-blue-800 transition-colors transform hover:scale-105"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SeasonalSuggestions;