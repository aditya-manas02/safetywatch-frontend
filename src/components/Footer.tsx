// src/components/Footer.tsx
import React from "react";
import { Shield, LifeBuoy, Instagram, Github, Linkedin, Code2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Footer() {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // If not on the homepage, navigate home first
      navigate("/", { state: { scrollTo: id } });
    }
  };

  return (
    <footer className="bg-background border-t mt-20 pt-16 pb-8">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* BRAND */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-background border border-border/50 rounded-lg shadow-lg shadow-primary/10">
              <img
                src="/assets/splash.png"
                alt="Nexus AI"
                className="h-6 w-6 object-contain mix-blend-normal"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SafetyWatch</span>
          </div>
          <p className="text-muted-foreground max-w-sm leading-relaxed font-medium">
            Empowering neighborhoods with real-time transparency and collective oversight. Together, we build safer communities through verified reporting and instant communication.
          </p>

          {/* Developer Section */}
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Code2 className="h-4 w-4 text-primary" />
              <h5 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                Developer
              </h5>
            </div>
            <p className="text-xs text-muted-foreground/80 mb-3 font-medium">
              Crafted with passion by Aditya Manas
            </p>
            <div className="flex items-center gap-3">
              <motion.a
                href="https://www.instagram.com/_aditya_manas_"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg hover:shadow-pink-500/50 transition-shadow"
              >
                <Instagram className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://github.com/aditya-manas02"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-slate-500/50 transition-shadow"
              >
                <Github className="h-5 w-5" />
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/in/adityamanas08/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:shadow-blue-500/50 transition-shadow"
              >
                <Linkedin className="h-5 w-5" />
              </motion.a>
            </div>
          </div>
        </div>

        {/* LINKS */}
        <div>
          <h5 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-6">Platform</h5>
          <ul className="space-y-4">
            <li>
              <button onClick={() => navigate("/profile")} className="text-foreground/80 hover:text-primary font-medium transition-colors">
                My Profile
              </button>
            </li>
            <li>
              <button onClick={() => scrollTo("recent-reports")} className="text-foreground/80 hover:text-primary font-medium transition-colors">
                Recent Reports
              </button>
            </li>
            <li>
              <button onClick={() => scrollTo("how-it-works")} className="text-foreground/80 hover:text-primary font-medium transition-colors">
                How It Works
              </button>
            </li>
            <li>
              <button onClick={() => scrollTo("real-heatmap")} className="text-foreground/80 hover:text-primary font-medium transition-colors">
                Heatmap View
              </button>
            </li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-sm uppercase tracking-widest text-muted-foreground mb-6">Company</h5>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => navigate("/privacy")}
                className="text-foreground/80 hover:text-primary font-medium transition-colors whitespace-nowrap"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/terms")}
                className="text-foreground/80 hover:text-primary font-medium transition-colors whitespace-nowrap"
              >
                Terms of Service
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/support")}
                className="text-foreground/80 hover:text-primary font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <LifeBuoy className="h-4 w-4" /> Support
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto px-6 mt-16 pt-8 border-t border-border">
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black text-primary mb-2">Want SafetyWatch for your area?</h3>
            <p className="text-sm md:text-base text-muted-foreground font-medium">Bringing SafetyWatch to your neighborhood or security team — contact us to get started.</p>
          </div>
          <a href="mailto:safetywatch4neighbour@gmail.com" className="shrink-0 inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-primary text-white text-base font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]">
            Email: safetywatch4neighbour@gmail.com
          </a>
        </div>
        <div className="text-center text-sm font-medium text-muted-foreground pb-8">
          &copy; {new Date().getFullYear()} SafetyWatch Global. Designed for safer neighborhoods.
        </div>
      </div>
    </footer>
  );
}
