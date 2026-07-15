import React, { useEffect } from "react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { t } = useLanguage();
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2500); // Show for 2.5 seconds
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Framer motion variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
    exit: { opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const line = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 1.5, ease: "easeInOut", delay: 0.5 } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-[#1a1a1a] flex flex-col items-center justify-center"
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="relative flex flex-col items-center">
        
        {/* Weave animation lines (warp and weft) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <motion.div className="w-[1px] h-[200px] bg-[#b45309]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }} />
          <motion.div className="w-[1px] h-[200px] bg-[#b45309] mx-4" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }} />
          <motion.div className="w-[1px] h-[200px] bg-[#b45309]" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }} />
          
          <motion.div className="absolute w-[200px] h-[1px] bg-white" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }} />
          <motion.div className="absolute w-[200px] h-[1px] bg-white mt-4" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, delay: 1.0, ease: "easeInOut" }} />
          <motion.div className="absolute w-[200px] h-[1px] bg-white -mt-4" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }} />
        </div>

        {/* Branding text */}
        <div className="z-10 bg-[#1a1a1a] p-4 text-center">
          <motion.h1 variants={item} className="text-4xl md:text-6xl font-serif font-bold text-white tracking-widest mb-2">
            {t("app.title").toUpperCase()}
          </motion.h1>
          <motion.div variants={line} className="h-[1px] w-full bg-[#b45309] origin-center my-3" />
          <motion.p variants={item} className="text-[10px] md:text-xs font-sans text-white/50 uppercase tracking-[0.3em]">
            {t("loading.subtitle")}
          </motion.p>
        </div>
        
      </div>
    </motion.div>
  );
}
