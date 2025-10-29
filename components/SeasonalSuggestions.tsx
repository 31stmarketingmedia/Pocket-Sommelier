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
    Spring: { color: 'text-green-300' },
    Summer: { color: 'text-yellow-300' },
    Autumn: { color: 'text-orange-300' },
    Winter: { color: 'text-blue-300' },
};

const SeasonalSuggestions: React.FC<SeasonalSuggestionsProps> = ({ season, onSuggestionClick }) => {
    const currentSuggestions = suggestions[season];
    const { color } = seasonInfo[season];

    return (
        <div className="text-center py-8 px-4 bg-dark-wood/50 rounded-2xl border border-rich-gold/20">
            <h3 className={`text-2xl font-bold mb-4 ${color} font-serif`}>
                Try a Seasonal Favorite
            </h3>
            <p className="text-off-white/70 mb-6 max-w-2xl mx-auto">Click a suggestion to instantly find perfect pairings for the current season.</p>
            <div className="flex flex-wrap justify-center gap-3">
                {currentSuggestions.map(suggestion => (
                    <button
                        key={suggestion}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="bg-polished-oak border border-rich-gold/30 px-4 py-2 rounded-full text-off-white/80 font-medium hover:bg-rich-gold hover:text-dark-wood hover:border-rich-gold transition-colors transform hover:scale-105"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SeasonalSuggestions;