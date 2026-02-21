import { useState, useEffect } from "react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";

const CACHE_KEY = "translation_cache_v1";

interface Cache {
    [lang: string]: {
        [text: string]: string;
    };
}

const getCache = (): Cache => {
    try {
        return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
    } catch {
        return {};
    }
};

const saveCache = (cache: Cache) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

export const translateText = async (text: string, targetLang: string): Promise<string> => {
    if (!text || targetLang === "en") return text;

    const cache = getCache();
    if (cache[targetLang] && cache[targetLang][text]) {
        return cache[targetLang][text];
    }

    try {
        const res = await fetch(`${API_BASE}/translate`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
            body: JSON.stringify({ text, targetLanguage: targetLang })
        });
        if (!res.ok) return text;
        const data = await res.json();
        const translatedText = data.translatedText || text;

        // Save to cache
        const newCache = getCache();
        if (!newCache[targetLang]) newCache[targetLang] = {};
        newCache[targetLang][text] = translatedText;
        saveCache(newCache);

        return translatedText;
    } catch (err) {
        console.error("Translation error:", err);
        return text;
    }
};

export function useTranslation() {
    const [currentLang, setCurrentLang] = useState(localStorage.getItem("app_lang") || "en");

    useEffect(() => {
        const handleLangChange = (e: any) => {
            setCurrentLang(e.detail.lang);
        };
        window.addEventListener("languageChanged", handleLangChange);
        return () => window.removeEventListener("languageChanged", handleLangChange);
    }, []);

    const t = async (text: string) => {
        return await translateText(text, currentLang);
    };

    return { t, currentLang };
}
