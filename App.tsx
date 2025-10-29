import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PairingRecommendation, Season, NearbyPlace, Coordinates } from './types';
import { VENDORS } from './constants';
import { getPairingRecommendations, findNearbyVenues } from './services/geminiService';
import Header from './components/Header';
import PairingCard from './components/PairingCard';
import SeasonalSuggestions from './components/SeasonalSuggestions';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LocationIcon, MicrophoneIcon } from './components/icons';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const seasonInfo: Record<Season, { color: string, icon: string, ring: string, border: string, bg: string }> = {
    Spring: { color: 'text-green-300', icon: '🌸', ring: 'focus:ring-green-400', border: 'border-green-500', bg: 'bg-green-500/20' },
    Summer: { color: 'text-yellow-300', icon: '☀️', ring: 'focus:ring-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/20' },
    Autumn: { color: 'text-orange-300', icon: '🍂', ring: 'focus:ring-orange-400', border: 'border-orange-400', bg: 'bg-orange-400/20' },
    Winter: { color: 'text-blue-300', icon: '❄️', ring: 'focus:ring-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/20' },
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
  const [budget, setBudget] = useState<string>('');
  const [recommendations, setRecommendations] = useState<PairingRecommendation[] | null>(null);
  const [favorites, setFavorites] = useState<PairingRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'favorites'>('recommendations');
  const [season, setSeason] = useState<Season>(getCurrentSeason());
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlacesState>({});
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any | null>(null);

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
      const results = await getPairingRecommendations(query, season, budget);
      setRecommendations(results);
    } catch (err) {
      console.error(err);
      setError('Sorry, we couldn\'t find pairings for that. Please try another dish.');
    } finally {
      setIsLoading(false);
    }
  }, [season, budget]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFoodQuery(transcript);
      handleSearch(transcript);
    };
    
    recognitionRef.current = recognition;
  }, [handleSearch]);

  const handleVoiceSearch = () => {
    if (isListening || !recognitionRef.current) {
      recognitionRef.current?.stop();
    } else {
      setFoodQuery('');
      setError(null);
      recognitionRef.current.start();
    }
  };

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('bartender-favorites');
      if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    } catch (e) {
      console.error("Failed to parse favorites from localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('bartender-favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);
  
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
          <p className="text-rich-gold mt-4 text-lg font-semibold font-serif">Mixing up the perfect pairings for {season}...</p>
        </div>
      );
    }

    if (error) return <div className="text-center py-12 text-deep-crimson font-semibold">{error}</div>;
    
    const dataSource = activeTab === 'recommendations' ? recommendations : favorites;

    if (!dataSource || dataSource.length === 0) {
      if (activeTab === 'favorites') return <div className="text-center py-12 text-off-white/70">Your favorite shelf is empty. Discover and save some pairings!</div>;
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
    <div className="min-h-screen bg-dark-wood/50">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto mb-10 bg-polished-oak/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-rich-gold/30 ring-1 ring-rich-gold/20">
          <h2 className="text-3xl sm:text-4xl text-center mb-4 text-off-white font-serif">Uncork Your Perfect Pairing</h2>
          <form onSubmit={handleFormSubmit}>
              <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                      <input
                          type="text"
                          value={foodQuery}
                          onChange={(e) => setFoodQuery(e.target.value)}
                          placeholder="What's on your menu tonight?"
                          className="w-full pl-4 pr-12 py-3 bg-dark-wood border border-rich-gold/30 rounded-full focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-colors placeholder-off-white/50 text-off-white text-base font-sans"
                      />
                      <button
                          type="button"
                          onClick={handleVoiceSearch}
                          className={`absolute inset-y-0 right-0 flex items-center pr-4 text-off-white/60 hover:text-rich-gold transition-colors ${isListening ? 'text-deep-crimson animate-pulse' : ''}`}
                          aria-label="Use microphone"
                      >
                          <MicrophoneIcon className="h-6 w-6" />
                      </button>
                  </div>
                  <div className="flex-shrink-0 flex gap-3">
                      <input
                          type="text"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          placeholder="Budget?"
                          className="w-full md:w-36 px-4 py-3 bg-dark-wood border border-rich-gold/30 rounded-full focus:ring-2 focus:ring-rich-gold focus:border-rich-gold transition-colors placeholder-off-white/50 text-off-white text-base font-sans"
                      />
                      <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full md:w-auto px-8 py-3 bg-rich-gold text-dark-wood font-bold rounded-full hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-polished-oak focus:ring-rich-gold transition-all duration-300 transform hover:scale-105 disabled:bg-polished-oak disabled:text-off-white/50 disabled:cursor-not-allowed flex-shrink-0 font-serif"
                      >
                          {isLoading ? '...' : 'Discover'}
                      </button>
                  </div>
              </div>
          </form>
           {locationPermission === 'denied' && (
            <div className="mt-4 text-center text-sm text-yellow-200 bg-yellow-900/50 p-3 rounded-lg border border-rich-gold/50">
              <LocationIcon className="h-5 w-5 inline mr-1" />
              Location is disabled. <button onClick={requestLocation} className="font-semibold text-rich-gold hover:underline">Enable</button> to find drinks nearby.
            </div>
          )}
          <div className="mt-6">
              <p className="text-center text-sm text-off-white/60 mb-3">Select a season for tailored recommendations:</p>
              <div className="flex justify-center flex-wrap gap-2 sm:gap-4">
                  {SEASONS.map(s => (
                      <button
                          key={s}
                          onClick={() => setSeason(s)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-polished-oak ${season === s ? `${seasonInfo[s].color} ${seasonInfo[s].border} ${seasonInfo[s].bg}` : 'text-off-white/60 border-transparent hover:bg-white/10' } ${seasonInfo[s].ring}`}
                      >
                         <span className="mr-2">{seasonInfo[s].icon}</span> {s}
                      </button>
                  ))}
              </div>
          </div>
        </div>

        {(recommendations && recommendations.length > 0) || (activeTab === 'favorites' && favorites.length > 0) ? (
          <div className="flex justify-center border-b border-rich-gold/20 mb-8">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-3 text-lg font-serif transition-colors ${activeTab === 'recommendations' ? 'text-rich-gold border-b-2 border-rich-gold' : 'text-off-white/60 hover:text-rich-gold'}`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-3 text-lg font-serif transition-colors relative ${activeTab === 'favorites' ? 'text-rich-gold border-b-2 border-rich-gold' : 'text-off-white/60 hover:text-rich-gold'}`}
              >
                My Cellar
                {favorites.length > 0 && (
                  <span className="absolute top-2 right-0 -mt-1 -mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-rich-gold text-xs font-bold text-dark-wood">
                    {favorites.length}
                  </span>
                )}
              </button>
          </div>
        ) : null}

        {renderContent()}

      </main>
      <footer className="text-center py-6 border-t border-rich-gold/20 mt-12">
        <p className="text-off-white/50 text-sm">&copy; {new Date().getFullYear()} My Pocket Bartender. Fun pairings, found locally.</p>
      </footer>
    </div>
  );
};

export default App;