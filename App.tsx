import React, { useState, useEffect, useCallback } from 'react';
import type { PairingRecommendation, Season, NearbyPlace, Coordinates } from './types';
import { VENDORS } from './constants';
import { getPairingRecommendations, findNearbyVenues } from './services/geminiService';
import Header from './components/Header';
import PairingCard from './components/PairingCard';
import SeasonalSuggestions from './components/SeasonalSuggestions';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LocationIcon } from './components/icons';

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const seasonInfo: Record<Season, { color: string, icon: string, ring: string, border: string }> = {
    Spring: { color: 'text-green-600', icon: '🌸', ring: 'focus:ring-green-500', border: 'border-green-500' },
    Summer: { color: 'text-yellow-600', icon: '☀️', ring: 'focus:ring-yellow-500', border: 'border-yellow-500' },
    Autumn: { color: 'text-orange-600', icon: '🍂', ring: 'focus:ring-orange-500', border: 'border-orange-500' },
    Winter: { color: 'text-blue-600', icon: '❄️', ring: 'focus:ring-blue-500', border: 'border-blue-500' },
};

const getCurrentSeason = (): Season => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
};

type NearbyPlacesState = Record<string, { places: NearbyPlace[], isLoading: boolean, error?: string }>;

const App: React.FC = () => {
  const [foodQuery, setFoodQuery] = useState<string>('');
  const [recommendations, setRecommendations] = useState<PairingRecommendation[] | null>(null);
  const [favorites, setFavorites] = useState<PairingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'favorites'>('recommendations');
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlacesState>({});

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationPermission('granted');
      },
      () => {
        setLocationPermission('denied');
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('sommelier-favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch (e) {
      console.error("Failed to parse favorites from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sommelier-favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a dish or menu.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setActiveTab('recommendations');
    setNearbyPlaces({});
    try {
      const results = await getPairingRecommendations(query, season);
      setRecommendations(results);
    } catch (err) {
      console.error(err);
      setError('Sorry, we couldn\'t find pairings for that. Please try another dish.');
    } finally {
      setIsLoading(false);
    }
  }, [season]);
  
  const handleFindNearby = useCallback(async (drinkName: string) => {
    if (!coordinates) {
        alert("Please enable location services to find nearby places.");
        return;
    }

    setNearbyPlaces(prev => ({
        ...prev,
        [drinkName]: { places: [], isLoading: true }
    }));

    try {
        const places = await findNearbyVenues(drinkName, coordinates);
        setNearbyPlaces(prev => ({
            ...prev,
            [drinkName]: { places, isLoading: false }
        }));
    } catch (err) {
        console.error(err);
        setNearbyPlaces(prev => ({
            ...prev,
            [drinkName]: { places: [], isLoading: false, error: "Could not find places nearby." }
        }));
    }
  }, [coordinates]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch(foodQuery);
  }

  const handleSuggestionClick = (suggestion: string) => {
    setFoodQuery(suggestion);
    handleSearch(suggestion);
  }

  const isFavorite = (pairing: PairingRecommendation) => favorites.some(fav => fav.name === pairing.name && fav.type === pairing.type);

  const toggleFavorite = (pairing: PairingRecommendation) => {
    setFavorites(prev => isFavorite(pairing) ? prev.filter(fav => fav.name !== pairing.name || fav.type !== pairing.type) : [...prev, pairing]);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-sky-600 mt-4 text-lg font-semibold">Finding the perfect pairings for {season}...</p>
        </div>
      );
    }

    if (error) return <div className="text-center py-12 text-red-500 font-semibold">{error}</div>;
    
    const dataSource = activeTab === 'recommendations' ? recommendations : favorites;

    if (!dataSource || dataSource.length === 0) {
      if (activeTab === 'favorites') return <div className="text-center py-12 text-gray-500">You haven't saved any favorite pairings yet.</div>;
      return <SeasonalSuggestions season={season} onSuggestionClick={handleSuggestionClick} />;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {dataSource.map((pairing, index) => (
          <PairingCard
            key={`${pairing.name}-${index}`}
            pairing={pairing}
            vendors={VENDORS}
            isFavorite={isFavorite(pairing)}
            onToggleFavorite={() => toggleFavorite(pairing)}
            onFindNearby={() => handleFindNearby(pairing.name)}
            nearbyInfo={nearbyPlaces[pairing.name]}
            isLocationEnabled={locationPermission === 'granted'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto mb-10 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-3xl sm:text-4xl text-center mb-4 text-gray-900 font-bold">Discover the Perfect Pairing</h2>
          <form onSubmit={handleFormSubmit}>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={foodQuery}
                onChange={(e) => setFoodQuery(e.target.value)}
                placeholder="e.g., BBQ Ribs, Pad Thai, Chocolate Cake..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-sky-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isLoading ? 'Searching...' : 'Find Pairings'}
              </button>
            </div>
          </form>
           {locationPermission === 'denied' && (
            <div className="mt-4 text-center text-sm text-gray-600 bg-yellow-100 p-3 rounded-lg border border-yellow-200">
              <LocationIcon className="h-5 w-5 inline mr-1" />
              Location is disabled. <button onClick={requestLocation} className="font-semibold text-sky-600 hover:underline">Enable</button> to find drinks nearby.
            </div>
          )}
          <div className="mt-6">
              <p className="text-center text-sm text-gray-500 mb-3">Select a season for tailored recommendations:</p>
              <div className="flex justify-center flex-wrap gap-2 sm:gap-4">
                  {SEASONS.map(s => (
                      <button
                          key={s}
                          onClick={() => setSeason(s)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white ${season === s ? `${seasonInfo[s].color} ${seasonInfo[s].border} bg-gray-100` : 'text-gray-500 border-transparent hover:bg-gray-200' } ${seasonInfo[s].ring}`}
                      >
                         <span className="mr-2">{seasonInfo[s].icon}</span> {s}
                      </button>
                  ))}
              </div>
          </div>
        </div>

        {(recommendations && recommendations.length > 0) || (activeTab === 'favorites' && favorites.length > 0) ? (
          <div className="flex justify-center border-b border-gray-200 mb-8">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-3 text-lg font-semibold transition-colors ${activeTab === 'recommendations' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500 hover:text-sky-500'}`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-3 text-lg font-semibold transition-colors relative ${activeTab === 'favorites' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500 hover:text-sky-500'}`}
              >
                Favorites
                {favorites.length > 0 && (
                  <span className="absolute top-2 right-0 -mt-1 -mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-xs font-bold text-white">
                    {favorites.length}
                  </span>
                )}
              </button>
          </div>
        ) : null}

        {renderContent()}

      </main>
      <footer className="text-center py-6 border-t border-gray-200 mt-12">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} Pocket Sommelier. Fun pairings, found locally.</p>
      </footer>
    </div>
  );
};

export default App;
