import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

// Map of theme names to whether they are "dark" themed
const THEME_TYPE_MAP: Record<string, "dark" | "light"> = {
  "tactical-calm": "dark",
  "civic-daylight": "light",
  "midnight-command": "dark",
  "high-contrast": "dark",
  "desert-ops": "dark",
};

export const THEME_LIST = [
  { id: "tactical-calm", name: "Tactical Calm", description: "Dark command center with teal accents", type: "dark" as const },
  { id: "civic-daylight", name: "Civic Daylight", description: "Clean, bright professional light theme", type: "light" as const },
  { id: "midnight-command", name: "Midnight Command", description: "Deep indigo with electric violet", type: "dark" as const },
  { id: "high-contrast", name: "High Contrast", description: "Maximum readability, accessibility-first", type: "dark" as const },
  { id: "desert-ops", name: "Desert Ops", description: "Warm earth tones, easy on the eyes", type: "dark" as const },
];

export const THEME_IDS = THEME_LIST.map((t) => t.id);

/**
 * Syncs the data-theme-type attribute on <html> so Tailwind's dark: variants
 * continue to work correctly based on whether the active theme is dark or light.
 */
function ThemeTypeSync() {
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "tactical-calm";
      const themeType = THEME_TYPE_MAP[currentTheme] || "dark";
      document.documentElement.setAttribute("data-theme-type", themeType);
      // Also toggle the 'dark' class for any remaining .dark CSS selectors in index.css utilities
      if (themeType === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Set initial value
    const currentTheme = document.documentElement.getAttribute("data-theme") || "tactical-calm";
    const themeType = THEME_TYPE_MAP[currentTheme] || "dark";
    document.documentElement.setAttribute("data-theme-type", themeType);
    if (themeType === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    return () => observer.disconnect();
  }, []);

  return null;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="tactical-calm"
      storageKey="safetywatch-theme"
      themes={THEME_IDS}
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      <ThemeTypeSync />
      {children}
    </NextThemesProvider>
  );
}
