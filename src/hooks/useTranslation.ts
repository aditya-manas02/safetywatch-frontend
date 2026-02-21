import { useState, useEffect } from "react";
import { API_BASE, VERSION_HEADERS } from "@/lib/api";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

const CACHE_KEY = "translation_cache_v2";

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
        let translatedText = text;
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
            try {
                const res = await CapacitorHttp.post({
                    url: `${API_BASE}/translate`,
                    headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
                    data: { text, targetLanguage: targetLang },
                    connectTimeout: 10000,
                    readTimeout: 10000
                });

                console.log("[TRANSLATE] Native response:", res.status, typeof res.data);

                if (res.status >= 200 && res.status < 300 && res.data) {
                    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    translatedText = data.translatedText || text;
                } else {
                    console.warn(`[TRANSLATE] Native failure: ${res.status}`);
                }
            } catch (nativeErr) {
                console.error("[TRANSLATE] CapacitorHttp failed, trying fetch fallback:", nativeErr);
                // Last ditch effort
                const fRes = await fetch(`${API_BASE}/translate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
                    body: JSON.stringify({ text, targetLanguage: targetLang })
                });
                if (fRes.ok) {
                    const fData = await fRes.json();
                    translatedText = fData.translatedText || text;
                }
            }
        } else {
            const res = await fetch(`${API_BASE}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
                body: JSON.stringify({ text, targetLanguage: targetLang })
            });
            if (res.ok) {
                const data = await res.json();
                translatedText = data.translatedText || text;
            }
        }

        if (translatedText !== text) {
            // Save to cache
            const newCache = getCache();
            if (!newCache[targetLang]) newCache[targetLang] = {};
            newCache[targetLang][text] = translatedText;
            saveCache(newCache);
        }

        return translatedText;
    } catch (err) {
        console.error("Translation error:", err);
        return text;
    }
};

export const translateBatch = async (texts: string[], targetLang: string): Promise<string[]> => {
    if (!texts.length || targetLang === "en") return texts;

    const cache = getCache();
    const result: string[] = new Array(texts.length);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    // Check cache first
    texts.forEach((text, i) => {
        if (cache[targetLang] && cache[targetLang][text]) {
            result[i] = cache[targetLang][text];
        } else {
            missingIndices.push(i);
            missingTexts.push(text);
        }
    });

    if (missingTexts.length === 0) return result;

    try {
        let translatedTexts = null;
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
            try {
                const res = await CapacitorHttp.post({
                    url: `${API_BASE}/translate/batch`,
                    headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
                    data: { texts: missingTexts, targetLanguage: targetLang },
                    connectTimeout: 15000,
                    readTimeout: 15000
                });

                console.log("[TRANSLATE/batch] Native response:", res.status, typeof res.data);

                if (res.status >= 200 && res.status < 300 && res.data) {
                    const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
                    translatedTexts = data.translatedTexts;
                }
            } catch (nativeErr) {
                console.error("[TRANSLATE/batch] CapacitorHttp failed:", nativeErr);
            }
        } else {
            const res = await fetch(`${API_BASE}/translate/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...VERSION_HEADERS },
                body: JSON.stringify({ texts: missingTexts, targetLanguage: targetLang })
            });
            if (res.ok) {
                const data = await res.json();
                translatedTexts = data.translatedTexts;
            }
        }

        if (!translatedTexts) {
            // Fill missing with originals on failure
            missingIndices.forEach((idx, i) => {
                result[idx] = missingTexts[i];
            });
            return result;
        }

        // Update result and cache
        const finalCache = getCache();
        if (!finalCache[targetLang]) finalCache[targetLang] = {};

        missingIndices.forEach((originalIdx, i) => {
            const translated = translatedTexts[i] || missingTexts[i];
            result[originalIdx] = translated;
            finalCache[targetLang][missingTexts[i]] = translated;
        });

        saveCache(finalCache);
        return result;
    } catch (err) {
        console.error("Batch translation error:", err);
        missingIndices.forEach((idx, i) => {
            result[idx] = missingTexts[i];
        });
        return result;
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
