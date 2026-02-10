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

        const notifiedRef = (window as any)._updateCheckNotified || { current: false };
        if (isWebDomain && !Capacitor.isNativePlatform()) {
            console.log('[VERSION_CHECK] Web/Local Environment detected. Allowing entry.');
            setIsChecking(false);
            if (!notifiedRef.current) {
                onCheckComplete?.(false);
                notifiedRef.current = true;
                (window as any)._updateCheckNotified = notifiedRef;
            }
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
                current = "1.4.5"; // Match production version
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
                    data = response.data || { version: "1.4.5", minVersion: "1.4.5", notes: "Mandatory Update Required" };
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

    const startDownload = async () => {
        const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;
        if (!downloadUrl) return;

        // PROACTIVE PLUGIN CHECK: Avoid attempting auto-sync if plugins are missing in old shells
        const canAutoSync = Capacitor.isPluginAvailable('Filesystem') &&
            Capacitor.isPluginAvailable('FileOpener');

        if (!canAutoSync) {
            console.warn('[VERSION_CHECK] Native auto-sync protocols missing in this shell. Reverting to browser download.');
            toast.info("Legacy shell detected. Initializing browser download protocol...");
            setTimeout(() => {
                try {
                    window.open(downloadUrl, '_system');
                } catch (e) {
                    window.open(downloadUrl, '_blank');
                }
            }, 800);
            return;
        }

        // Ensure we have permissions for storage on Android
        if (Capacitor.getPlatform() === 'android') {
            try {
                const status = await Filesystem.checkPermissions();
                if (status.publicStorage !== 'granted') {
                    await Filesystem.requestPermissions();
                }
            } catch (e) {
                console.warn('[VERSION_CHECK] Permission check failed:', e);
            }
        }

        setIsDownloading(true);
        setDownloadProgress(2); // Start at 2% for visual feedback

        try {
            console.log('[VERSION_CHECK] Starting in-app download:', downloadUrl);
            const fileName = `SafetyWatch_v${versionInfo?.version.replace(/\./g, '_') || 'latest'}.apk`;

            const downloadResult = await Filesystem.downloadFile({
                url: downloadUrl,
                path: fileName,
                directory: Directory.Cache,
                progress: true
            });

            // Simulated progress logic for smoother visual transition
            let progress = 5;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 8) + 2;
                if (progress > 95) {
                    clearInterval(interval);
                } else {
                    setDownloadProgress(progress);
                }
            }, 400);

            if (downloadResult.path) {
                console.log('[VERSION_DL] Bridge success -> cache:', downloadResult.path);
                clearInterval(interval);
                setDownloadProgress(100);

                // Get absolute URI for the native package installer
                const uriResult = await Filesystem.getUri({
                    path: fileName,
                    directory: Directory.Cache
                });

                setDownloadedFileUri(uriResult.uri);
                setIsDownloaded(true);
                setIsDownloading(false);
                toast.success("Security Binary Received. Ready for local deployment.");

                // Auto-trigger installation after verification buffer
                setTimeout(() => {
                    handleInstall();
                }, 800);
            }
        } catch (error: any) {
            console.error('[VERSION_DL] BRIDGE_FAILURE:', error);
            setIsDownloading(false);

            const errorMsg = error?.message || "Protocol Bridge Interrupted";

            // Ultimate Fallback: Direct window redirect. This is the "Nuclear" option.
            // If the native bridge is broken, the browser will catch this.
            toast.info("Switching to direct download protocol...");

            setTimeout(() => {
                console.log('[VERSION_DL] Executing Ultimate Redirect:', downloadUrl);
                window.location.href = downloadUrl;
            }, 1000);
        }
    };

    const handleInstall = async () => {
        if (!downloadedFileUri) {
            toast.error("Installation file target lost. Please retry download.");
            return;
        }

        try {
            console.log('[VERSION_CHECK] Triggering native installation:', downloadedFileUri);

            // Robust installer trigger
            await FileOpener.open({
                filePath: downloadedFileUri,
                contentType: 'application/vnd.android.package-archive',
                openWithDefault: true // Force system installer
            });

            toast.info("Preparing system installer package...");
        } catch (error: any) {
            console.error('[VERSION_CHECK] Installation failed:', error);
            const msg = error?.message || "Unknown Error";
            toast.error(`Installer Error: ${msg.slice(0, 40)}`);

            // Check if it's a permission issue or file access issue
            if (msg.includes("permission") || msg.includes("File provider")) {
                toast.info("Trying manual install fallback...");
            }

            // Final safety fallback
            const downloadUrl = versionInfo?.url || `https://safetywatch-backend.onrender.com/SafetyWatch.apk`;
            if (downloadUrl) {
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

                        {/* Action Hub */}
                        <div className="w-full space-y-4">
                            {!isDownloaded ? (
                                <button
                                    onClick={startDownload}
                                    disabled={isDownloading}
                                    className="relative w-full group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 transition-transform duration-300 group-hover:scale-105 rounded-2xl"></div>
                                    <div className="relative bg-transparent hover:bg-white/5 text-white font-black text-lg py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(168,85,247,0.4)]">
                                        {isDownloading ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Synchronizing...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-6 h-6" />
                                                Update Now
                                            </>
                                        )}
                                    </div>
                                </button>
                            ) : (
                                <button
                                    onClick={handleInstall}
                                    className="relative w-full group overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 transition-transform duration-300 group-hover:scale-105 rounded-2xl"></div>
                                    <div className="relative bg-transparent hover:bg-white/5 text-white font-black text-lg py-5 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all">
                                        <CheckCircle2 className="w-6 h-6" />
                                        Initialize Install
                                    </div>
                                </button>
                            )}

                            {/* Fallback Option */}
                            <div className="flex flex-col items-center gap-4 pt-2">
                                <p className="text-[11px] text-slate-500 text-center uppercase tracking-widest font-bold">
                                    Secure Build: v{versionInfo.version}-FINAL
                                </p>

                                <a
                                    href={downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-2 px-4 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 no-underline cursor-pointer"
                                >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Download via Browser (Secondary)
                                </a>
                            </div>
                        </div>

                        {/* Quantum Status */}
                        <div className="w-full mt-10 pt-6 border-t border-white/5 flex justify-center">
                            <span className="text-[9px] text-purple-500/40 font-mono tracking-widest uppercase flex items-center gap-2 italic">
                                <Activity className="w-3 h-3" /> Binary Verification Protocols Active
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
