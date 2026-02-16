import React from 'react';
import type { PairingRecommendation, Vendor, NearbyPlace } from '../types';
import { BookmarkIcon, ShareIcon, LocationIcon, ExternalLinkIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface PairingCardProps {
  pairing: PairingRecommendation;
  vendors: Vendor[];
  isFavorite: boolean;
  isLocationEnabled: boolean;
  onToggleFavorite: () => void;
  onFindNearby: () => void;
  nearbyInfo?: {
      places: NearbyPlace[];
      isLoading: boolean;
      error?: string;
  };
}

const PairingCard: React.FC<PairingCardProps> = ({ pairing, vendors, isFavorite, isLocationEnabled, onToggleFavorite, onFindNearby, nearbyInfo }) => {
  const handleShare = async () => {
    const shareText = `My Pocket Bartender recommends pairing ${pairing.name} with your dish!\n\nWhy it works: ${pairing.reasoning}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Drink Pairing: ${pairing.name}`,
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        await navigator.clipboard.writeText(shareText);
        alert('Pairing copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      alert('Pairing copied to clipboard!');
    }
  };
  
  return (
    <div className="bg-card-brown rounded-lg shadow-lg overflow-hidden border border-accent-gold/50 flex flex-col h-full">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-3 mb-1">
              <p className="text-sm font-bold text-accent-gold uppercase tracking-wider">{pairing.type}</p>
              <span className="text-xs font-bold text-classic-brown bg-accent-gold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">{pairing.estimatedPrice}</span>
            </div>
            <h3 className="text-2xl font-bold text-text-white font-serif">{pairing.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleFavorite}
              className="p-2 rounded-full text-text-white/70 hover:bg-accent-gold/20 hover:text-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <BookmarkIcon className={`h-6 w-6 transition-colors ${isFavorite ? 'text-accent-gold fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-text-white/70 hover:bg-accent-gold/20 hover:text-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold"
              aria-label="Share pairing"
            >
              <ShareIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <p className="text-text-white/80 italic mb-4 font-sans">{pairing.description}</p>
        
        <div className="prose prose-sm max-w-none text-text-white/90 font-sans">
            <h4 className="text-text-white font-bold text-base font-serif">Why it works:</h4>
            <p>{pairing.reasoning}</p>
        </div>
      </div>
      
      <div className="bg-classic-brown px-6 py-4 mt-auto border-t border-accent-gold/40">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-text-white/70 mb-2">Shop this pairing online:</h4>
          <div className="flex flex-wrap gap-2">
            {vendors.map(vendor => (
              <a
                key={vendor.name}
                href={vendor.affiliateLink.replace('{DRINK_NAME}', encodeURIComponent(pairing.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-accent-blue text-text-white px-3 py-1 rounded-full hover:bg-blue-800 transition-colors border border-blue-400/50"
              >
                {vendor.name}
              </a>
            ))}
          </div>
        </div>
        
        <div>
           <button 
             onClick={onFindNearby} 
             disabled={!isLocationEnabled || nearbyInfo?.isLoading}
             className="w-full flex items-center justify-center px-4 py-2 border border-accent-gold text-sm font-medium rounded-md text-accent-gold bg-transparent hover:bg-accent-gold hover:text-classic-brown focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-classic-brown focus:ring-accent-gold disabled:border-text-white/30 disabled:text-text-white/50 disabled:cursor-not-allowed disabled:bg-transparent transition-colors font-serif"
           >
             <LocationIcon className="w-5 h-5 mr-2" />
             {nearbyInfo?.isLoading ? 'Searching...' : 'Find Nearby'}
           </button>

           {nearbyInfo && !nearbyInfo.isLoading && (
              <div className="mt-3">
                  {nearbyInfo.error && <p className="text-xs text-red-400">{nearbyInfo.error}</p>}
                  {nearbyInfo.places.length > 0 ? (
                      <ul className="space-y-1">
                          {nearbyInfo.places.slice(0, 3).map(place => (
                              <li key={place.uri}>
                                  <a href={place.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-text-white/70 hover:text-accent-gold hover:underline flex items-center group">
                                      {place.title}
                                      <ExternalLinkIcon className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                              </li>
                          ))}
                      </ul>
                  ) : !nearbyInfo.error && (
                      <p className="text-xs text-text-white/60">No nearby locations found.</p>
                  )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PairingCard;