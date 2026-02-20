import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
];

export function LanguageSelector() {
    const [currentLang, setCurrentLang] = useState(localStorage.getItem("app_lang") || "en");

    const handleLanguageChange = (code: string) => {
        setCurrentLang(code);
        localStorage.setItem("app_lang", code);
        // Dispatch custom event so other components can listen
        window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang: code } }));
    };

    const selectedLang = languages.find(l => l.code === currentLang);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2 px-3 border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md rounded-xl">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {selectedLang?.name}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-slate-950/90 border-white/10 backdrop-blur-xl rounded-2xl p-2 shadow-2xl z-[100]">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${currentLang === lang.code
                                ? "bg-primary/20 text-primary"
                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                            }`}
                    >
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">{lang.name}</span>
                            <span className="text-[10px] opacity-50">{lang.nativeName}</span>
                        </div>
                        {currentLang === lang.code && <Check className="h-3 w-3" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
