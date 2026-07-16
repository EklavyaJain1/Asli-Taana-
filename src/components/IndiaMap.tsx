import React from 'react';
import IndiaMapSvg from './IndiaMapSvg';

interface IndiaMapProps {
  grownInStates: string[];
  wovenInLocation: string;
}

// Approximate percentage coordinates (x, y) for states (0-100 scale on the SVG viewbox)
const STATE_COORDS: Record<string, { x: number; y: number }> = {
  "Jammu & Kashmir": { x: 35, y: 12 },
  "Himachal Pradesh": { x: 38, y: 22 },
  "Uttarakhand": { x: 42, y: 28 },
  "Punjab": { x: 30, y: 23 },
  "Haryana": { x: 35, y: 30 },
  "Rajasthan": { x: 22, y: 40 },
  "Gujarat": { x: 12, y: 53 },
  "Maharashtra": { x: 25, y: 65 },
  "Madhya Pradesh": { x: 38, y: 52 },
  "Uttar Pradesh": { x: 45, y: 38 },
  "Bihar": { x: 60, y: 42 },
  "West Bengal": { x: 70, y: 53 },
  "Jharkhand": { x: 60, y: 50 },
  "Chhattisgarh": { x: 52, y: 57 },
  "Odisha": { x: 62, y: 62 },
  "Telangana": { x: 42, y: 70 },
  "Andhra Pradesh": { x: 45, y: 78 },
  "Karnataka": { x: 32, y: 78 },
  "Tamil Nadu": { x: 40, y: 88 },
  "Kerala": { x: 32, y: 92 },
  "Assam": { x: 85, y: 38 },
  "Meghalaya": { x: 80, y: 42 },
  "Sikkim": { x: 67, y: 33 },
  "Arunachal Pradesh": { x: 92, y: 28 },
  "Nagaland": { x: 94, y: 37 },
  "Manipur": { x: 92, y: 43 },
  "Mizoram": { x: 88, y: 50 },
  "Tripura": { x: 82, y: 48 }
};

// Approximate percentage coordinates for specific weaver villages/cities
const VILLAGE_COORDS: Record<string, { x: number; y: number }> = {
  "Kanchipuram": { x: 42, y: 86 },
  "Paithan": { x: 25, y: 62 },
  "Kuthampully": { x: 33, y: 90 },
  "Bhagalpur": { x: 65, y: 43 },
  "Varanasi (Banaras)": { x: 50, y: 40 },
  "Chanderi": { x: 37, y: 47 },
  "Chettinad": { x: 39, y: 90 },
  "Mangalagiri": { x: 45, y: 75 },
  "Kota": { x: 26, y: 42 },
  "Mysore": { x: 31, y: 84 },
  "Dharmavaram": { x: 39, y: 78 },
  "Kullu": { x: 37, y: 20 },
  "Bhujodi": { x: 8, y: 50 },
  "Amritsar": { x: 28, y: 20 },
  "Phulia": { x: 72, y: 55 },
  "Surat": { x: 16, y: 55 },
  "Bhilwara": { x: 26, y: 45 },
  "Ludhiana": { x: 31, y: 22 },
  "Champa": { x: 52, y: 55 },
  "Gopalpur": { x: 65, y: 65 },
  "Bishnupur": { x: 67, y: 52 },
  "Sualkuchi": { x: 84, y: 38 },
  "Guwahati": { x: 85, y: 39 }
};

export default function IndiaMap({ grownInStates = [], wovenInLocation = "" }: IndiaMapProps) {
  const getWovenCoords = () => {
    if (VILLAGE_COORDS[wovenInLocation]) return VILLAGE_COORDS[wovenInLocation];
    return { x: 45, y: 55 }; // Default to central India
  };

  const wovenCoords = getWovenCoords();

  return (
    <div className="relative w-full h-full min-h-[250px] bg-[#f9f8f4] border border-[#1a1a1a]/10 overflow-hidden flex items-center justify-center">
      <IndiaMapSvg className="w-full h-full max-h-[300px] drop-shadow-sm opacity-90 p-2" preserveAspectRatio="xMidYMid meet">
        {/* Grown In States (Blue/Teal dots) */}
        {grownInStates.map((state, idx) => {
          const coords = STATE_COORDS[state];
          if (!coords) return null;
          // Scale coordinates by 10 since viewBox is 1000x1000
          const cx = coords.x * 10;
          const cy = coords.y * 10;
          return (
            <g key={`grown-${idx}`}>
              <circle cx={cx} cy={cy} r="15" fill="#026c7d" className="animate-pulse opacity-60" />
              <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
            </g>
          );
        })}

        {/* Woven In Location (Amber marker) */}
        {wovenInLocation && wovenCoords && (
          <g transform={`translate(${wovenCoords.x * 10}, ${wovenCoords.y * 10})`}>
            <circle cx="0" cy="0" r="25" fill="#b45309" className="animate-ping opacity-40" />
            <circle cx="0" cy="0" r="10" fill="#b45309" />
            <path d="M 0 -10 L 0 -35" stroke="#b45309" strokeWidth="5" />
            <circle cx="0" cy="-40" r="8" fill="#1a1a1a" />
          </g>
        )}
      </IndiaMapSvg>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex flex-col gap-1.5 bg-white/90 p-2 border border-[#1a1a1a]/10 shadow-xs">
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#026c7d]"></span>
           <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/70">Grown In</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#b45309]"></span>
           <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/70">Woven At</span>
         </div>
      </div>
    </div>
  );
}
