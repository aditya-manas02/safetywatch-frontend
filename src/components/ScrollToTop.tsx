import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 400px
      if (window.pageYOffset > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9998]"
        >
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 h-11 px-5 rounded-full bg-[#2a2a2a] hover:bg-black text-white shadow-xl backdrop-blur-sm border border-white/10 group transition-all duration-300 hover:scale-105 active:scale-95"
            title="Scroll to Top"
          >
            <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/30 group-hover:border-white/60 transition-colors">
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </div>
            <span className="text-sm font-bold tracking-wide">Back to top</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
