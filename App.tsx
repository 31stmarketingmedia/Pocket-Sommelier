
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { PairingRecommendation, Season, NearbyPlace, Coordinates } from './types';
import { VENDORS } from './constants';
import { getPairingRecommendations, findNearbyVenues } from './services/geminiService';
import Header from './components/Header';
import PairingCard from './components/PairingCard';
import SeasonalSuggestions from './components/SeasonalSuggestions';
import { LoadingSpinner } from './components/LoadingSpinner';
import { LocationIcon, MicrophoneIcon, ClockIcon } from './components/icons';
import AboutModal from './components/AboutModal';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

const seasonInfo: Record<Season, { icon: string }> = {
    Spring: { icon: '🌸' },
    Summer: { icon: '☀️' },
    Autumn: { icon: '🍂' },
    Winter: { icon: '❄️' },
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
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Initialize history lazily to prevent overwriting with empty array on re-renders if logic was different
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
        const storedHistory = localStorage.getItem('bartender-search-history');
        return storedHistory ? JSON.parse(storedHistory) : [];
    } catch (e) {
        console.error("Failed to parse search history", e);
        return [];
    }
  });

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

  // Persist search history
  useEffect(() => {
    try {
        localStorage.setItem('bartender-search-history', JSON.stringify(searchHistory));
    } catch (e) {
        console.error("Failed to save search history", e);
    }
  }, [searchHistory]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setError('Please enter a dish or menu.');
      return;
    }
    
    // Update Search History
    setSearchHistory(prev => {
        const cleanQuery = query.trim();
        // Remove duplicates (case-insensitive) but keep new casing
        const filtered = prev.filter(item => item.toLowerCase() !== cleanQuery.toLowerCase());
        // Keep top 5 most recent
        return [cleanQuery, ...filtered].slice(0, 5);
    });

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
          <p className="text-accent-gold mt-4 text-lg font-semibold font-serif">Mixing up the perfect pairings for {season}...</p>
        </div>
      );
    }

    if (error) return <div className="text-center py-12 text-red-400 font-semibold">{error}</div>;
    
    const dataSource = activeTab === 'recommendations' ? recommendations : favorites;

    if (!dataSource || dataSource.length === 0) {
      if (activeTab === 'favorites') return <div className="text-center py-12 text-text-white/70">Your favorite shelf is empty. Discover and save some pairings!</div>;
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
    <div className="min-h-screen bg-classic-brown flex flex-col">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        <div className="max-w-4xl mx-auto mb-10 bg-card-brown p-6 rounded-lg shadow-lg border border-accent-gold/50">
          <h2 className="text-3xl sm:text-4xl text-center mb-4 text-text-white font-serif">Uncork Your Perfect Pairing</h2>
          <form onSubmit={handleFormSubmit}>
              <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-grow">
                      <input
                          type="text"
                          value={foodQuery}
                          onChange={(e) => setFoodQuery(e.target.value)}
                          placeholder="What's on your menu tonight?"
                          className="w-full pl-4 pr-12 py-3 bg-classic-brown border border-accent-gold/70 rounded-full focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-colors placeholder-text-white/50 text-text-white text-base font-sans"
                      />
                      <button
                          type="button"
                          onClick={handleVoiceSearch}
                          className={`absolute inset-y-0 right-0 flex items-center pr-4 text-text-white/60 hover:text-accent-gold transition-colors ${isListening ? 'text-red-400 animate-pulse' : ''}`}
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
                          className="w-full md:w-36 px-4 py-3 bg-classic-brown border border-accent-gold/70 rounded-full focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-colors placeholder-text-white/50 text-text-white text-base font-sans"
                      />
                      <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full md:w-auto px-8 py-3 bg-accent-gold text-classic-brown font-bold rounded-full hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-brown focus:ring-accent-gold transition-all duration-300 transform hover:scale-105 disabled:bg-card-brown disabled:text-text-white/50 disabled:cursor-not-allowed flex-shrink-0 font-serif"
                      >
                          {isLoading ? '...' : 'Discover'}
                      </button>
                  </div>
              </div>
          </form>

          {searchHistory.length > 0 && (
            <div className="mt-5 border-t border-accent-gold/20 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-text-white/40 uppercase tracking-wider flex items-center gap-1">
                        <ClockIcon className="w-3 h-3" /> Recent Searches
                    </span>
                    <button 
                        type="button" 
                        onClick={() => setSearchHistory([])} 
                        className="text-xs text-text-white/40 hover:text-red-400 transition-colors"
                    >
                        Clear History
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {searchHistory.map((historyItem, idx) => (
                        <button
                            key={`${historyItem}-${idx}`}
                            onClick={() => {
                                setFoodQuery(historyItem);
                                handleSearch(historyItem);
                            }}
                            type="button"
                            className="px-3 py-1.5 rounded-md bg-classic-brown/50 border border-text-white/10 text-text-white/70 text-sm hover:border-accent-gold/50 hover:text-accent-gold hover:bg-classic-brown transition-all font-sans"
                        >
                            {historyItem}
                        </button>
                    ))}
                </div>
            </div>
          )}

           {locationPermission === 'denied' && (
            <div className="mt-4 text-center text-sm text-yellow-200 bg-yellow-900 p-3 rounded-lg border border-accent-gold/80">
              <LocationIcon className="h-5 w-5 inline mr-1" />
              Location is disabled. <button onClick={requestLocation} className="font-semibold text-accent-gold hover:underline">Enable</button> to find drinks nearby.
            </div>
          )}
          <div className="mt-6">
              <p className="text-center text-sm text-text-white/60 mb-3">Select a season for tailored recommendations:</p>
              <div className="flex justify-center flex-wrap gap-2 sm:gap-4">
                  {SEASONS.map(s => (
                      <button
                          key={s}
                          onClick={() => setSeason(s)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-brown ${season === s ? `text-accent-gold border-accent-gold` : 'text-text-white/60 border-transparent hover:border-text-white/50' }`}
                      >
                         <span className="mr-2">{seasonInfo[s].icon}</span> {s}
                      </button>
                  ))}
              </div>
          </div>
        </div>

        {(recommendations && recommendations.length > 0) || (activeTab === 'favorites' && favorites.length > 0) ? (
          <div className="flex justify-center border-b border-accent-gold/40 mb-8">
              <button
                onClick={() => setActiveTab('recommendations')}
                className={`px-6 py-3 text-lg font-serif transition-colors ${activeTab === 'recommendations' ? 'text-accent-gold border-b-2 border-accent-gold' : 'text-text-white/60 hover:text-accent-gold'}`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`px-6 py-3 text-lg font-serif transition-colors relative ${activeTab === 'favorites' ? 'text-accent-gold border-b-2 border-accent-gold' : 'text-text-white/60 hover:text-accent-gold'}`}
              >
                My Cellar
                {favorites.length > 0 && (
                  <span className="absolute top-2 right-0 -mt-1 -mr-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold text-xs font-bold text-classic-brown">
                    {favorites.length}
                  </span>
                )}
              </button>
          </div>
        ) : null}

        {renderContent()}

      </main>
      <footer className="text-center py-6 border-t border-accent-gold/30 mt-auto">
        <p className="text-text-white/50 text-sm mb-2">&copy; {new Date().getFullYear()} My Pocket Bartender. Fun pairings, found locally.</p>
        <button 
          onClick={() => setIsAboutModalOpen(true)}
          className="text-accent-gold text-sm font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-accent-gold rounded"
        >
          About This App
        </button>
      </footer>
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  );
};

export default App;
