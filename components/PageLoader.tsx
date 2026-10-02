'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PageLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loader"
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] bg-[#050505] flex items-center justify-center overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center relative px-4">
            
            {/* Elegant Compact Circular Loader */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              
              {/* Spinning White Accent Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                className="absolute -inset-2.5 rounded-full border border-white/25 border-t-white"
              />

              {/* White Circular Badge containing the video */}
              <div className="w-full h-full rounded-full bg-white overflow-hidden shadow-2xl flex items-center justify-center p-3 border border-white/20">
                <video
                  src="/assets/videos/mkurugenzi lllaunch.mp4"
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain scale-110 pointer-events-none"
                  onEnded={() => setIsLoading(false)}
                />
              </div>

            </div>

            {/* Brand Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-medium"
            >
              MKURUGENZI ® — NAIROBI
            </motion.div>

            {/* Enter Site Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              onClick={() => setIsLoading(false)}
              className="mt-6 px-5 py-2 rounded-full bg-white/10 hover:bg-white text-white hover:text-black border border-white/20 text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md transition-all shadow-lg"
            >
              ENTER SITE
            </motion.button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
