import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                    <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative inline-block">
                            <div className="h-24 w-24 bg-critical/10 rounded-full flex items-center justify-center border border-critical/20 mb-4 mx-auto">
                                <AlertTriangle className="h-12 w-12 text-critical" />
                            </div>
                            <div className="absolute inset-0 bg-critical/20 blur-3xl rounded-full"></div>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-3xl font-black tracking-tight tracking-tighter">System Interrupted</h1>
                            <p className="text-muted-foreground font-medium">SafetyWatch encountered an unexpected logic error. Our security logs have been updated.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-foreground text-background font-black hover:bg-foreground/90 h-12 rounded-xl"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" /> REBOOT SYSTEM
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => window.location.href = '/'}
                                className="w-full text-muted-foreground hover:text-foreground h-12"
                            >
                                <Home className="mr-2 h-4 w-4" /> RETURN TO BASE
                            </Button>
                        </div>

                        <div className="mt-8 p-4 bg-surface-overlay/40 border border-border/50 rounded-xl text-left overflow-auto max-h-32">
                            <p className="text-[10px] font-bold text-critical mb-1 uppercase tracking-wider">Error Details for Support:</p>
                            <pre className="text-[10px] text-critical/80 whitespace-pre-wrap font-mono select-all">
                                {this.state.error?.message || "Unknown Error"}
                                {import.meta.env.DEV && this.state.error?.stack && `\n\n${this.state.error.stack}`}
                            </pre>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
