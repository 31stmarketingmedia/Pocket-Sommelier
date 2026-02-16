import React from 'react';
import { XIcon } from './icons';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-classic-brown/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-card-brown rounded-lg shadow-2xl border border-accent-gold/60 max-w-2xl w-full mx-auto relative transform transition-all duration-300 ease-out scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-text-white/70 hover:bg-accent-gold/20 hover:text-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold"
          aria-label="Close modal"
        >
          <XIcon className="h-6 w-6" />
        </button>

        <div className="p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-accent-gold mb-4 font-serif">
            About My Pocket Bartender
          </h2>
          <div className="space-y-4 text-text-white/90 font-sans text-base leading-relaxed">
            <p>
              Welcome to your personal AI sommelier and mixologist! My Pocket Bartender is designed to elevate your dining experiences by providing expert drink pairing recommendations for any meal, from a quick snack to a gourmet dinner.
            </p>
            <p>
              Simply enter the dish you're having, select the current season, and optionally provide a budget. Our advanced AI, powered by Google's Gemini, analyzes flavor profiles and seasonal ingredients to curate a perfect list of cocktails, wines, beers, and non-alcoholic beverages.
            </p>
            <p>
              Discover new tastes, save your favorite pairings to your personal "Cellar," and even find local spots to purchase your recommended drink using our "Find Nearby" feature.
            </p>
            <p className="font-semibold text-accent-gold pt-2">
              Cheers to perfect pairings!
            </p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AboutModal;
