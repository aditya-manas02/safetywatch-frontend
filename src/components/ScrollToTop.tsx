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
        <div className="fixed top-[90px] left-0 right-0 flex justify-center z-[9998] pointer-events-none w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pointer-events-auto flex justify-center"
          >
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full bg-card/95 hover:bg-accent text-foreground shadow-lg backdrop-blur-sm border border-border group transition-all duration-300 hover:scale-105 active:scale-95"
              title="Scroll to Top"
            >
              <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full border border-foreground/20 group-hover:border-foreground/50 transition-colors">
                <ArrowUp className="h-2.5 w-2.5 transition-transform duration-300 group-hover:-translate-y-0.5 text-foreground/80 group-hover:text-foreground" />
              </div>
              <span className="text-[10px] font-bold tracking-wide uppercase">Back to top</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
