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
    Spring: { color: 'text-green-600' },
    Summer: { color: 'text-yellow-600' },
    Autumn: { color: 'text-orange-600' },
    Winter: { color: 'text-blue-600' },
};

const SeasonalSuggestions: React.FC<SeasonalSuggestionsProps> = ({ season, onSuggestionClick }) => {
    const currentSuggestions = suggestions[season];
    const { color } = seasonInfo[season];

    return (
        <div className="text-center py-8 px-4 bg-white rounded-2xl border border-gray-200">
            <h3 className={`text-2xl font-bold mb-4 ${color}`}>
                Try a Seasonal Favorite
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">Click a suggestion to instantly find perfect pairings for the current season.</p>
            <div className="flex flex-wrap justify-center gap-3">
                {currentSuggestions.map(suggestion => (
                    <button
                        key={suggestion}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-gray-700 font-medium hover:bg-gray-200 hover:text-black transition-colors transform hover:scale-105"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SeasonalSuggestions;
