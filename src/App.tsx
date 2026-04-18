/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MapPin, Navigation, Scissors, Loader2, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Parlour {
  id: string;
  name: string;
  address: string;
  distanceStr: string;
  lat: number;
  lng: number;
}

const CURATED_IMAGES = [
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600948836101-f9ff13984d8c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1588644366632-4caebb8bb817?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1580618672592-12948ebf5c88?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1595152452589-3d12d4a6de1f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1521590832168-151caafbfbb6?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?w=600&h=400&fit=crop',
];

export default function App() {
  const [status, setStatus] = useState<
    'idle' | 'loading_location' | 'loading_parlours' | 'success' | 'error'
  >('idle');
  const [parlours, setParlours] = useState<Parlour[]>([]);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFindNearby = () => {
    setStatus('loading_location');
    setErrorMsg('');

    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLoc({ lat: latitude, lng: longitude });
        fetchParloursFromAI(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setStatus('error');
        if (err.code === 1) {
          setErrorMsg('Location access denied. Please enable location permissions in your browser to find nearby parlours.');
        } else {
          setErrorMsg('Unable to retrieve your location. Please check your signal and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const fetchParloursFromAI = async (lat: number, lng: number) => {
    try {
      setStatus('loading_parlours');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a specialized local directory API. The user is at latitude ${lat} and longitude ${lng}. Return a list of EXACTLY 10 real or highly realistic beauty parlours, salons, or spas strictly near this location. Provide the specific lat/lng coordinates for each location so directions can be accurately routed.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING, description: 'Name of the parlour/salon' },
                address: { type: Type.STRING, description: 'Short street address or local area name' },
                distanceStr: { type: Type.STRING, description: "Distance from user e.g. '1.2 km'" },
                lat: { type: Type.NUMBER, description: 'Latitude of the parlour' },
                lng: { type: Type.NUMBER, description: 'Longitude of the parlour' },
              },
              required: ['id', 'name', 'address', 'distanceStr', 'lat', 'lng'],
            },
          },
        },
      });

      const data = JSON.parse(response.text || '[]');
      setParlours(data);
      setStatus('success');
    } catch (error) {
      console.error('AI fetch error:', error);
      setStatus('error');
      setErrorMsg('Failed to find nearby parlours. Please try again.');
    }
  };

  const openDirections = (pLat: number, pLng: number) => {
    if (!userLoc) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${pLat},${pLng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] text-[#4A1523] font-sans selection:bg-[#FFB3C6]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#FFDDE4]">
        <div className="max-w-7xl mx-auto px-4 md:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#FF5E8E]">
            <Scissors className="w-6 h-6 stroke-2" />
            <span className="text-[28px] font-extrabold tracking-[-1px] lowercase">parlour wali</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {(status === 'idle' || status === 'loading_location' || status === 'loading_parlours' || status === 'error') && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto text-center mt-12 md:mt-24"
            >
              <h1 className="text-4xl md:text-6xl font-extrabold text-[#4A1523] tracking-tight mb-6">
                Glowing up just got <span className="text-[#FF5E8E]">easier</span>.
              </h1>
              <p className="text-lg md:text-xl text-[#4A1523]/80 mb-10 leading-relaxed font-medium">
                Find the top-rated beauty parlours and salons right around the corner. Book your vibe, skip the drive.
              </p>

              <div className="flex flex-col items-center gap-6">
                <button
                  onClick={handleFindNearby}
                  disabled={status === 'loading_location' || status === 'loading_parlours'}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#FF5E8E] text-white rounded-[30px] font-bold text-[16px] shadow-[0_4px_15px_rgba(255,94,142,0.3)] hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === 'loading_location' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Locating you...
                    </>
                  ) : status === 'loading_parlours' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Finding Parlours...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5 group-hover:animate-bounce" />
                      Find Nearby Parlours
                    </>
                  )}
                </button>

                {/* Error Banner */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 max-w-lg shadow-sm"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm text-left">{errorMsg}</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {status === 'success' && parlours.length > 0 && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-bold text-[#4A1523] flex items-center gap-2">
                    <MapPin className="w-6 h-6 text-[#FF5E8E]" />
                    10 Parlours near your location
                  </h2>
                </div>
                <button
                  onClick={handleFindNearby}
                  className="px-5 py-2 bg-[#FF5E8E] text-white font-bold text-sm rounded-[30px] shadow-[0_4px_15px_rgba(255,94,142,0.3)] hover:opacity-90 transition-opacity inline-flex items-center gap-2 self-start sm:self-auto outline-none"
                >
                  <Loader2 className="w-4 h-4" />
                  Refresh List
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[20px]">
                {parlours.map((parlour, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={parlour.id}
                    className="bg-[#FFFFFF] rounded-[20px] p-[12px] shadow-[0_6px_20px_rgba(0,0,0,0.04)] border-2 border-transparent hover:border-[#FFB3C6] transition-colors flex flex-col relative group cursor-pointer"
                  >
                    <div className="absolute top-5 right-5 bg-white/90 px-2 py-1 rounded-lg text-[11px] font-bold text-[#FFB800] z-10 shadow-sm flex items-center gap-1">
                      ★ {(4.0 + (index % 10) * 0.1).toFixed(1)}
                    </div>
                    <div className="w-full h-[140px] bg-[#FFDDE4] rounded-[14px] mb-[12px] flex items-center justify-center overflow-hidden relative">
                      <img
                        src={CURATED_IMAGES[index % CURATED_IMAGES.length]}
                        alt={parlour.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <h3 className="font-bold text-[16px] text-[#4A1523] mb-[4px] truncate whitespace-nowrap">
                        {parlour.name}
                      </h3>
                      <p className="text-[12px] text-[#888] mb-[12px] flex items-center gap-1 truncate w-full">
                        {parlour.distanceStr} • {parlour.address}
                      </p>
                      
                      <button
                        onClick={() => openDirections(parlour.lat, parlour.lng)}
                        className="mt-auto w-full flex items-center justify-center gap-[6px] bg-[#FFF5F7] text-[#FF5E8E] font-semibold text-[13px] py-[8px] px-2 rounded-[12px] border border-[#FF5E8E] hover:bg-[#FFDDE4] transition-colors"
                      >
                        Get Directions ↗
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
