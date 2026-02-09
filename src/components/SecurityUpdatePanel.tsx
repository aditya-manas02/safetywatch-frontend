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
                url: `${BASE_URL}/SafetyWatch-v1.4.5.apk`,
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
        const downloadUrl = versionInfo?.url || `${BASE_URL}/SafetyWatch-v1.4.5.apk`;
        if (!downloadUrl) return;

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

            // Priority Fallback: Direct Browser Download (Matches "Opens Chrome" button intent)
            toast.error(`Auto-sync failed: ${errorMsg.slice(0, 30)}. Reverting to manual protocol...`);

            // Use window.open with _system to force external browser
            setTimeout(() => {
                window.open(downloadUrl, '_system');
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
            const downloadUrl = versionInfo?.url || `${BASE_URL}/SafetyWatch-v1.4.5.apk`;
            if (downloadUrl) {
                window.open(downloadUrl, '_system');
            }
        }
    };

    const handleHardReload = () => {
        window.location.href = window.location.origin + '/index.html?t=' + Date.now();
    };

    if (!showUpdate || !versionInfo) return null;

    const downloadUrl = versionInfo?.url || `${BASE_URL}/SafetyWatch-v1.4.5.apk`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-hidden"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="relative w-full max-w-md bg-[#0a0f18] border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8"
                >
                    <div className="flex flex-col items-start text-left">
                        {/* Header Section */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">System Update Required</h2>
                        </div>

                        <p className="text-[15px] text-slate-300 mb-4 leading-relaxed">
                            A critical security update is required to continue. Your current version
                            <span className="text-white font-bold px-1.5 py-0.5 bg-white/5 rounded mx-1">({currentVersion || 'Legacy'})</span>
                            is discontinued.
                        </p>

                        <div className="space-y-1 mb-4">
                            <p className="text-[15px] text-white font-bold">Latest Security Version: {versionInfo.version}</p>
                            <p className="text-[13px] text-red-500 font-medium italic">Emergency Sync: Version 1.4.5 is now mandatory.</p>
                        </div>

                        {/* What's New Section */}
                        {versionInfo.notes && (
                            <div className="w-full bg-[#111827] border border-white/5 rounded-xl p-5 mb-8">
                                <p className="text-[12px] font-bold text-blue-400 uppercase tracking-wider mb-2">Security Patch Notes:</p>
                                <p className="text-[14px] text-slate-300 leading-relaxed italic">
                                    "{versionInfo.notes}"
                                </p>
                            </div>
                        )}

                        {/* Progress Section (Only if downloading) */}
                        {isDownloading && (
                            <div className="w-full mb-6 space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[11px] font-bold text-blue-400 uppercase">Synchronizing Binary</span>
                                    <span className="text-[11px] font-mono text-white">{downloadProgress}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <motion.div
                                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${downloadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Action Hub */}
                        <div className="w-full space-y-3">
                            {!isDownloaded ? (
                                <button
                                    onClick={() => window.open(downloadUrl, '_system')}
                                    className="w-full bg-red-700 hover:bg-red-600 text-white font-black text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_10px_30px_rgba(185,28,28,0.2)]"
                                >
                                    <Download className="w-6 h-6" />
                                    Update Now (Opens Chrome)
                                </button>
                            ) : (
                                <button
                                    onClick={handleInstall}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all"
                                >
                                    <CheckCircle2 className="w-6 h-6" />
                                    Install Now (Local Sync)
                                </button>
                            )}

                            {/* Secondary Actions */}
                            <div className="flex flex-col items-center gap-4 pt-4 w-full">
                                <p className="text-[11px] text-slate-500 text-center max-w-[80%]">
                                    Clicking the button will redirect you to your web browser to download the updated SafetyWatch.apk
                                </p>

                                <div className="flex items-center gap-3 text-[12px]">
                                    <button
                                        onClick={startDownload}
                                        disabled={isDownloading}
                                        className="text-blue-500 hover:underline font-bold disabled:opacity-50"
                                    >
                                        Try In-App Sync
                                    </button>
                                    <span className="text-slate-700">|</span>
                                    <a
                                        href={downloadUrl}
                                        target="_system"
                                        className="text-blue-500 hover:underline font-bold"
                                    >
                                        Direct Link
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="w-full mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
                            <button
                                onClick={handleHardReload}
                                className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors bg-white/5 px-4 py-2 rounded-lg"
                            >
                                Force System Cache Reset
                            </button>

                            <span className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
                                BUILD: 1.4.5-RED-ALERT-ENFORCED
                            </span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
