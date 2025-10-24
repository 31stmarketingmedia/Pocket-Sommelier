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
    const shareText = `Pocket Sommelier recommends pairing ${pairing.name} with your dish!\n\nWhy it works: ${pairing.reasoning}`;
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 flex flex-col h-full transform hover:-translate-y-1 transition-transform duration-300">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-sky-600 uppercase tracking-wider">{pairing.type}</p>
            <h3 className="text-2xl font-bold text-gray-900">{pairing.name}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleFavorite}
              className="p-2 rounded-full text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <BookmarkIcon className={`h-6 w-6 transition-colors ${isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full text-gray-500 hover:bg-sky-100 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
              aria-label="Share pairing"
            >
              <ShareIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <p className="text-gray-600 italic mb-4">{pairing.description}</p>
        
        <div className="prose prose-sm max-w-none text-gray-700">
            <h4 className="text-gray-900 font-bold text-base">Why it works:</h4>
            <p>{pairing.reasoning}</p>
        </div>
      </div>
      
      <div className="bg-gray-50 px-6 py-4 mt-auto border-t border-gray-200">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Shop this pairing online:</h4>
          <div className="flex flex-wrap gap-2">
            {vendors.map(vendor => (
              <a
                key={vendor.name}
                href={vendor.affiliateLink.replace('{DRINK_NAME}', encodeURIComponent(pairing.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded-full hover:bg-gray-300 hover:text-black transition-colors"
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
             className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-sky-700 bg-sky-100 hover:bg-sky-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
           >
             <LocationIcon className="w-5 h-5 mr-2" />
             {nearbyInfo?.isLoading ? 'Searching...' : 'Find Nearby'}
           </button>

           {nearbyInfo && !nearbyInfo.isLoading && (
              <div className="mt-3">
                  {nearbyInfo.error && <p className="text-xs text-red-600">{nearbyInfo.error}</p>}
                  {nearbyInfo.places.length > 0 ? (
                      <ul className="space-y-1">
                          {nearbyInfo.places.slice(0, 3).map(place => (
                              <li key={place.uri}>
                                  <a href={place.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-700 hover:text-sky-600 hover:underline flex items-center group">
                                      {place.title}
                                      <ExternalLinkIcon className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </a>
                              </li>
                          ))}
                      </ul>
                  ) : !nearbyInfo.error && (
                      <p className="text-xs text-gray-500">No nearby locations found.</p>
                  )}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PairingCard;
