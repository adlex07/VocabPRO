import React from 'react';
import { FocusSettings } from '../types';

interface FocusOverlayProps {
  settings: FocusSettings;
}

const FocusOverlay: React.FC<FocusOverlayProps> = ({ settings }) => {
  if (!settings.enabled) return null;

  // Calculate opacity based on intensity (0.1 to 0.9)
  const opacity = Math.max(0.1, Math.min(0.9, settings.intensity));

  return (
    <div className="fixed inset-0 z-40 pointer-events-none animate-fade-in">
      {/* Top Mask */}
      <div 
        className="absolute top-0 left-0 w-full h-[40vh] bg-black transition-all duration-500 ease-out backdrop-blur-[1px]"
        style={{ opacity }}
      ></div>
      
      {/* Center Reading Lane (Transparent) */}
      <div className="absolute top-[40vh] left-0 w-full h-[20vh] transition-all duration-500">
         {/* Optional: Add a subtle guideline or border if intensity is high */}
         {settings.intensity > 0.5 && (
            <>
              <div className="absolute top-0 left-0 w-full h-px bg-white/10"></div>
              <div className="absolute bottom-0 left-0 w-full h-px bg-white/10"></div>
            </>
         )}
      </div>

      {/* Bottom Mask */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[40vh] bg-black transition-all duration-500 ease-out backdrop-blur-[1px]"
        style={{ opacity }}
      ></div>
    </div>
  );
};

export default FocusOverlay;
