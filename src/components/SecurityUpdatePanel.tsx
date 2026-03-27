import { useEffect, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Download, AlertTriangle, ArrowRight, RefreshCw, ExternalLink, CheckCircle2, Loader2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BASE_URL, VERSION_HEADERS } from "@/lib/api";

interface VersionInfo {
    version: string;
    minVersion: string;
    url: string;
    notes: string;
}

interface AppUpdateCheckerProps {
    onCheckComplete?: (isBlocking: boolean) => void;
}

export function SecurityUpdatePanel({ onCheckComplete }: AppUpdateCheckerProps) {
    const [showUpdate, setShowUpdate] = useState(false);
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [currentVersion, setCurrentVersion] = useState<string>('');
    const [isMandatory, setIsMandatory] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    // Download state
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloaded, setIsDownloaded] = useState(false);
    const [downloadedFileUri, setDownloadedFileUri] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    useEffect(() => {
        checkForUpdates();

        const listener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkForUpdates();
            }
        });

        return () => {
            listener.then(handle => handle.remove());
        };
    }, []);

    const checkForUpdates = async () => {
        setIsChecking(true);

        // ROBUST WEB BYPASS: Official web domains and localhost are always allowed to bypass
        const isWebDomain = window.location.hostname.includes('vercel.app') ||
            window.location.hostname.includes('safetywatch.live') ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        if (isWebDomain && !Capacitor.isNativePlatform()) {
            console.log('[VERSION_CHECK] Web/Local Environment detected. Allowing entry.');
            setIsChecking(false);
            onCheckComplete?.(false);
            return;
        }

        // Robust platform detection for older shells
        const isCapacitor = (window as any).Capacitor;
        const isNative = Capacitor.isNativePlatform() ||
            (isCapacitor && isCapacitor.platform !== 'web') ||
            window.location.protocol === 'capacitor:';

        if (!isNative) {
            // Check for potential webview indicators without aggressive width heuristics
            const isWebview = !!(window as any).webkit?.messageHandlers?.bridge ||
                !!(window as any).AndroidBridge;

            if (!isWebview) {
                console.log('[VERSION_CHECK] Web Environment. Allowing entry.');
                setIsChecking(false);
                onCheckComplete?.(false);
                return;
            }
        }

        console.log('[VERSION_CHECK] Native/Shell Environment Detected. Forcing verification.');

        try {
            let current = "0.0.0";
            try {
                const appInfo = await CapacitorApp.getInfo();
                current = appInfo.version;
                setCurrentVersion(current);
            } catch (e) {
                console.warn('[VERSION_CHECK] Could not get app info, assuming very old version:', e);
                current = "0.0.0"; // Force update for undetectable versions
                setCurrentVersion(current);
            }

            const versionUrl = `${BASE_URL}/version.json?v=${Date.now()}`;

            console.log(`[VERSION_CHECK] Native Shell Detected. Current: ${current}. Fetching latest...`);

            let data: VersionInfo;
            try {
                const options = {
                    url: versionUrl,
                    headers: VERSION_HEADERS
                };
                const response = await CapacitorHttp.get(options);

                if (response.status === 200 && response.data) {
                    data = response.data;
                } else if (response.status === 426) {
                    // Backend explicitly rejected this version
                    console.warn('[VERSION_CHECK] Backend rejected version with 426.');
                    data = response.data || { version: "1.4.6", minVersion: "1.4.6", notes: "Mandatory Update Required" };
                } else {
                    throw new Error(`Status ${response.status}`);
                }
            } catch (e) {
                console.warn('[VERSION_CHECK] CapacitorHttp failed, using fetch:', e);
                const response = await fetch(versionUrl, {
                    headers: VERSION_HEADERS
                });
                if (response.status === 426) {
                    data = await response.json();
                } else {
                    if (!response.ok) throw new Error('Fetch failed');
                    data = await response.json();
                }
            }

            setVersionInfo(data);

            // USE LOCAL 'current' VARIABLE, NOT THE STATE 'currentVersion'
            const updateAvailable = isOutdated(current, data.version);
            const updateMandatory = isOutdated(current, data.minVersion);

            console.log(`[VERSION_CHECK] COMPLETED - Latest: ${data.version}, MinRequired: ${data.minVersion}, Mandatory: ${updateMandatory}`);

            if (updateAvailable || updateMandatory) {
                setShowUpdate(true);
                setIsMandatory(updateMandatory || true); // If any logic says outdated, we block in "Red Alert" mode
                setIsChecking(false);
                onCheckComplete?.(true); // ALWAYS BLOCK if outdated in this refined logic
            } else {
                setIsChecking(false);
                onCheckComplete?.(false);
            }
        } catch (error: any) {
            console.error('[VERSION_CHECK] SYSTEM ERROR:', error);
            setIsChecking(false);

            // CRITICAL: On native error, we BLOCK entry if we can't verify safety.
            setIsMandatory(true);
            setShowUpdate(true);
            setVersionInfo({
                version: "Checking...",
                minVersion: "1.4.3",
                url: `https://safetywatch-backend.onrender.com/SafetyWatch.apk`,
                notes: `Connection error. Please check your internet. (Error: ${error?.message || 'Unknown'})`
            });
            onCheckComplete?.(true); // Treat as blocking error
        }
    };

    const isOutdated = (current: string, latest: string): boolean => {
        if (!current || !latest) return false;
        // Strip any v prefix and focus on major.minor.patch
        const currClean = current.replace(/^v/, '').split('-')[0];
        const latestClean = latest.replace(/^v/, '').split('-')[0];

        const c = currClean.split('.').map(Number);
        const l = latestClean.split('.').map(Number);

        while (c.length < 3) c.push(0);
        while (l.length < 3) l.push(0);

        for (let i = 0; i < 3; i++) {
            const cv = isNaN(c[i]) ? 0 : c[i];
            const lv = isNaN(l[i]) ? 0 : l[i];
            if (cv < lv) return true;
            if (cv > lv) return false;
        }
        return false;
    };

    const forceExternalDownload = async (url: string) => {
        console.log('[VERSION_DL] Initializing single-stream download fallback:', url);

        try {
            // Method 1: Capacitor Browser Plugin (Most reliable for modern shells)
            if (Capacitor.isPluginAvailable('Browser')) {
                try {
                    await Browser.open({ url });
                    return;
                } catch (e) {
                    console.warn('[VERSION_DL] Capacitor Browser.open failed, falling back...');
                }
            }

            // Method 2: System Browser Trigger (Standard Capacitor backup)
            if (Capacitor.isNativePlatform()) {
                try {
                    window.open(url, '_system');
                    return;
                } catch (e) {
                    console.warn('[VERSION_DL] window.open _system failed');
                }
            }

            // Method 3: Absolute Redirection (Web fallback)
            window.location.href = url;

        } catch (e) {
            console.error('[VERSION_DL] Hyper-fallback failed:', e);
            toast.error("Please copy the URL manually and open in Chrome.");
        }
    };

    const copyToClipboard = (text: string) => {
        try {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    toast.success("URL copied to clipboard.");
                }).catch(() => legacyCopy(text));
            } else {
                legacyCopy(text);
            }
        } catch (e) {
            legacyCopy(text);
        }
    };

    const legacyCopy = (text: string) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                toast.success("Manual Link Secured (Copied)");
            } else {
                throw new Error("Copy failed");
            }
        } catch (err) {
            console.error('[VERSION_DL] Copy failed:', err);
            toast.error("Could not copy. Please long-press the URL.");
        }
    };

    const getFileName = () => {
        return `SafetyWatch_v${versionInfo?.version.replace(/\./g, '_') || 'latest'}.apk`;
    };

    const startDownload = async () => {
        const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;
        if (!downloadUrl) {
            toast.error("Update source URL missing.");
            return;
        }

        console.log('[VERSION_CHECK] Update sequence initiated. Verifying native bridge...');
        setIsDownloading(true);
        setDownloadProgress(5);

        try {
            const fileName = getFileName();
            console.log('[VERSION_DL] Target:', fileName);

            // PRE-SYNC CLEANUP
            try {
                await Filesystem.deleteFile({
                    path: fileName,
                    directory: Directory.Cache
                });
            } catch (e) { }

            let downloadSuccessful = false;
            let finalPath = '';

            // STRATEGY A: Modern Capacitor Download (Best performance, uses native stream)
            try {
                console.log('[VERSION_DL] Protocol A: Native Direct Stream');
                const downloadResult = await Filesystem.downloadFile({
                    url: downloadUrl,
                    path: fileName,
                    directory: Directory.Cache,
                    progress: true
                });

                if (downloadResult.path) {
                    finalPath = downloadResult.path;
                    downloadSuccessful = true;
                    console.log('[VERSION_DL] Protocol A Success');
                }
            } catch (err: any) {
                console.warn('[VERSION_DL] Protocol A Failed (likely older shell):', err.message);

                // STRATEGY B: Single-Shot Sync (Avoids base64 corruption)
                try {
                    console.log('[VERSION_DL] Protocol B: Single-Shot Sync');
                    setDownloadProgress(11);

                    const response = await fetch(downloadUrl);
                    if (!response.ok) throw new Error(`Server returned ${response.status}`);

                    const blob = await response.blob();
                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const fr = new FileReader();
                        fr.onload = () => resolve((fr.result as string).split(',')[1]);
                        fr.onerror = reject;
                        fr.readAsDataURL(blob);
                    });

                    await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: Directory.Cache
                    });

                    console.log('[VERSION_DL] Single-Shot Sync Complete.');
                    downloadSuccessful = true;

                } catch (errB: any) {
                    console.error('[VERSION_DL] Protocol B Failure:', errB.message);
                    throw errB;
                }
            }

            if (downloadSuccessful) {
                setDownloadProgress(100);

                const uriResult = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Cache
                });

                console.log('[VERSION_DL] Binary verified at:', uriResult.uri);
                setDownloadedFileUri(uriResult.uri);
                setIsDownloaded(true);
                setIsDownloading(false);
                toast.success("Security Binary Received.");

                setTimeout(() => handleInstall(), 800);
            }
        } catch (error: any) {
            console.error('[VERSION_DL] ALL_PROTOCOLS_FAILED:', error);
            setIsDownloading(false);

            let errorMsg = error?.message || "Sync Bridge Interrupted";

            // Detect missing native plugin (Legacy v1.4.0 indicator)
            if (errorMsg.toLowerCase().includes("not implemented") || errorMsg.toLowerCase().includes("plugin not found")) {
                errorMsg = "LEGACY_SHELL_INCOMPATIBILITY";
            }

            setDownloadError(errorMsg);
            toast.error("Bridge Connection Failed.");
        }
    };



    const handleInstall = async () => {
        let installUri = downloadedFileUri;

        // SELF-HEALING: If URI is lost, re-resolve from multiple directories (Cache first for v1.4.6)
        if (!installUri) {
            console.log('[VERSION_CHECK] URI missing from state. Searching directories...');
            const fileName = getFileName();
            const directories = [Directory.Cache, Directory.Data, Directory.Documents];

            for (const dir of directories) {
                try {
                    const stat = await Filesystem.stat({ path: fileName, directory: dir });
                    if (stat) {
                        const result = await Filesystem.getUri({ path: fileName, directory: dir });
                        installUri = result.uri;
                        console.log(`[VERSION_CHECK] Found at ${dir}:`, installUri);
                        setDownloadedFileUri(installUri);
                        toast.info(`Recovered binary from ${dir}`);
                        break;
                    }
                } catch (e) { }
            }
        }

        const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;

        if (!installUri) {
            console.warn('[VERSION_CHECK] LOCAL_FILE_NOT_FOUND. Failing forward to browser.');
            toast.error("Local package lost. Bridging to browser sync...");
            if (downloadUrl) window.open(downloadUrl, '_system');
            return;
        }

        try {
            console.log('[VERSION_CHECK] Triggering native installation:', installUri);
            toast.info("Launching system installer...");

            // Robust installer trigger
            await FileOpener.open({
                filePath: installUri,
                contentType: 'application/vnd.android.package-archive',
                openWithDefault: true // Force system installer
            });

            toast.success("Installer package handed to system.");
        } catch (error: any) {
            console.error('[VERSION_CHECK] Installation failed:', error);
            const msg = error?.message || "Unknown Error";

            // Check if it's a permission issue or file access issue
            if (msg.includes("permission") || msg.includes("File provider") || msg.includes("not find") || msg.includes("ActivityNotFound")) {
                toast.error("System block or missing provider. Falling back to browser.");
            } else {
                toast.error(`Installer Error: ${msg.slice(0, 40)}`);
            }

            // FINAL SAFETY FALLBACK: Trigger browser download if native fails
            const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;
            if (downloadUrl) {
                console.log('[VERSION_CHECK] Falling back to system browser...');
                window.open(downloadUrl, '_system');
            }
        }
    };

    const handleHardReload = () => {
        window.location.href = window.location.origin + '/index.html?t=' + Date.now();
    };

    if (!showUpdate || !versionInfo) return null;

    const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md overflow-hidden"
            >
                {/* Digital Noise Background Overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="relative w-full max-w-md bg-[#09090b] border border-purple-500/30 rounded-[2rem] shadow-[0_0_100px_-20px_rgba(168,85,247,0.3)] p-8 md:p-10 overflow-hidden"
                >
                    {/* Interior Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

                    <div className="flex flex-col items-center text-center">
                        {/* Nexus AI Logo */}
                        <div className="relative mb-8">
                            <div className="absolute -inset-4 bg-purple-600/20 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative p-4 bg-purple-950/30 rounded-2xl border border-purple-500/40 shadow-2xl">
                                <img
                                    src="/assets/splash.png"
                                    alt="Nexus AI"
                                    className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]"
                                />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-tighter mb-4 flex items-center gap-2">
                            UPDATE <span className="text-purple-500">AVAILABLE</span>
                        </h2>

                        <p className="text-[15px] text-slate-400 mb-6 leading-relaxed">
                            A new security layer is ready for deployment. Please update now to continue using the
                            <span className="text-white font-bold px-2 py-0.5 bg-purple-500/10 rounded ml-1 border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">SafetyWatch</span> app.
                        </p>

                        <div className="w-full space-y-2 mb-8 text-[13px] font-mono tracking-wider">
                            <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-slate-500 uppercase">Current</span>
                                <span className="text-white font-bold">{currentVersion || '1.4.3'}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <span className="text-purple-400 uppercase">Target</span>
                                <span className="text-white font-bold">{versionInfo.version}</span>
                            </div>
                        </div>

                        {/* Progress Section (Always visible when downloading) */}
                        <AnimatePresence>
                            {isDownloading && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="w-full mb-8 space-y-3"
                                >
                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-2">
                                            <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                                            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-widest">Encrypting Sync...</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-white">{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)] rounded-full"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${downloadProgress}%` }}
                                            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Section */}
                        <AnimatePresence>
                            {downloadError && !isDownloading && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="w-full mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-left"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-500 font-bold text-[13px] uppercase tracking-wider mb-1">
                                                {downloadError === "LEGACY_SHELL_INCOMPATIBILITY" ? "Legacy Version Detected" : "Update Interrupted"}
                                            </p>
                                            <p className="text-red-200/70 text-[12px] leading-tight italic">
                                                {downloadError === "LEGACY_SHELL_INCOMPATIBILITY"
                                                    ? "Your current app shell (v1.4.0) is too old for in-app syncing."
                                                    : `Reason: ${downloadError}`}
                                            </p>
                                        </div>
                                    </div>

                                    {downloadError === "LEGACY_SHELL_INCOMPATIBILITY" ? (
                                        <div className="space-y-4">
                                            <p className="text-slate-400 text-[11px] leading-relaxed">
                                                This is a one-time requirement. Please perform a **manual upgrade** to v1.5.0 using the
                                                secondary button below. This will enable the automatic update engine for all future versions.
                                            </p>
                                            <Button
                                                onClick={() => forceExternalDownload(downloadUrl)}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black tracking-tighter uppercase rounded-xl py-6 h-auto shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Manual Upgrade to v1.5.0
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                                                Persistence error detected in native bridge. If retrying fails repeatedly, please use the
                                                <span className="text-white font-semibold mx-1 text-[12px]">secondary browser option</span> below.
                                            </p>
                                            <Button
                                                onClick={() => {
                                                    setDownloadError(null);
                                                    startDownload();
                                                }}
                                                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 font-black tracking-tighter uppercase rounded-xl py-6 h-auto"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Retry Update
                                            </Button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Buttons */}
                        {!isDownloaded ? (
                            <div className="w-full space-y-4">
                                <Button
                                    onClick={startDownload}
                                    disabled={isDownloading}
                                    className={`w-full group relative overflow-hidden h-16 rounded-2xl text-white font-black text-lg tracking-tight shadow-2xl transition-all duration-500 ${isDownloading ? 'bg-slate-800' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-[1.02] hover:shadow-purple-500/25 active:scale-95'
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rotate-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                    <span className="relative flex items-center justify-center gap-3 italic">
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                SYNCING...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-6 h-6 group-hover:animate-bounce" />
                                                UPDATE NOW
                                            </>
                                        )}
                                    </span>
                                </Button>

                                <button
                                    onClick={() => forceExternalDownload(downloadUrl)}
                                    className="w-full h-14 flex items-center justify-center gap-2 text-slate-500 hover:text-purple-400 font-bold text-[13px] hover:bg-purple-500/5 rounded-2xl border border-transparent hover:border-purple-500/20 transition-all duration-300 group"
                                >
                                    <ExternalLink className="w-4 h-4 group-hover:scale-110" />
                                    SECONDARY OPTION: BROWSER SYNC
                                </button>
                            </div>
                        ) : (
                            <Button
                                onClick={handleInstall}
                                className="relative w-full group overflow-hidden h-16 rounded-2xl text-white font-black text-lg tracking-tight shadow-2xl transition-all duration-500 bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.02] hover:shadow-emerald-500/25 active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rotate-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                <span className="relative flex items-center justify-center gap-3 italic">
                                    <CheckCircle2 className="w-6 h-6" />
                                    INITIALIZE INSTALL
                                </span>
                            </Button>
                        )}

                        {/* Fallback Option */}
                        <div className="flex flex-col items-center gap-4 pt-2">
                            <p className="text-[11px] text-slate-500 text-center uppercase tracking-widest font-bold">
                                Secure Build: v{versionInfo.version}-FINAL
                            </p>

                            <div className="w-full space-y-3">
                                <a
                                    href={downloadUrl}
                                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-3 px-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 no-underline cursor-pointer"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Bypass Gate (Direct Browser Link)
                                </a>

                                <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                                    <p className="text-[10px] text-purple-400 font-bold uppercase mb-2 tracking-widest">Manual Download URL (Copy & Paste)</p>
                                    <input
                                        readOnly
                                        value={downloadUrl}
                                        onClick={() => copyToClipboard(downloadUrl)}
                                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-slate-300 focus:outline-none cursor-pointer"
                                    />
                                    <div className="mt-2 text-[9px] text-slate-500 font-bold text-center italic">
                                        If the button fails, copy this link and open in Chrome.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quantum Status */}
                    <div className="w-full mt-10 pt-6 border-t border-white/5 flex justify-center">
                        <span className="text-[9px] text-purple-500/40 font-mono tracking-widest uppercase flex items-center gap-2 italic">
                            <Activity className="w-3 h-3" /> Binary Verification Protocols Active
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
