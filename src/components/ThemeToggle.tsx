import { Palette } from "lucide-react";
import { useTheme } from "next-themes";
import { THEME_LIST } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const currentIndex = THEME_LIST.findIndex((t) => t.id === theme);
    const nextIndex = (currentIndex + 1) % THEME_LIST.length;
    setTheme(THEME_LIST[nextIndex].id);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={(e) => {
            // Prevent dropdown from opening on simple click, we want to cycle instead
            // Only open dropdown on long press or right click (handled by context menu normally)
            // Actually, for accessibility, it's better to just have the button open the dropdown,
            // or have a split button. Let's make it a simple dropdown for now.
          }}
          className="p-2 flex items-center justify-center rounded-full border border-border hover:bg-muted transition-colors relative"
          aria-label="Toggle theme"
        >
          <Palette className="h-4 w-4 text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {THEME_LIST.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`cursor-pointer flex items-center justify-between ${
              theme === t.id ? "bg-accent/10 text-accent font-bold" : ""
            }`}
          >
            <span>{t.name}</span>
            {theme === t.id && (
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
