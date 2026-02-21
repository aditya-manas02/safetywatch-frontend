import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 80;
    const MAX_PULL = 150;

    useEffect(() => {
        let startY = 0;
        let currentY = 0;
        let isAtTop = true;

        const handleTouchStart = (e: TouchEvent) => {
            // Only allow pull to refresh if we're at the very top of the scroll
            isAtTop = window.scrollY <= 0;
            startY = e.touches[0].pageY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isAtTop || isRefreshing) return;

            currentY = e.touches[0].pageY;
            const diff = currentY - startY;

            if (diff > 0) {
                // Prevent default only when pulling down at the top
                if (e.cancelable) e.preventDefault();

                // Logarithmic resistance
                const distance = Math.min(diff * 0.4, MAX_PULL);
                setPullDistance(distance);
            } else {
                setPullDistance(0);
            }
        };

        const handleTouchEnd = async () => {
            if (pullDistance > PULL_THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                setPullDistance(PULL_THRESHOLD);

                try {
                    await onRefresh();
                } finally {
                    setIsRefreshing(false);
                    setPullDistance(0);
                }
            } else {
                setPullDistance(0);
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [pullDistance, isRefreshing, onRefresh]);

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Indicator */}
            <div
                className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
                style={{
                    top: 0,
                    transform: `translateY(${pullDistance - 40}px)`,
                    opacity: pullDistance > 20 ? 1 : 0,
                    transition: isRefreshing ? 'none' : 'transform 0.1s ease-out, opacity 0.2s'
                }}
            >
                <div className={`p-2 rounded-full bg-background border shadow-xl flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
                    <RefreshCw
                        className="w-5 h-5 text-primary"
                        style={{
                            transform: `rotate(${pullDistance * 2}deg)`,
                            opacity: isRefreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1)
                        }}
                    />
                </div>
            </div>

            {/* Content wrapper with displacement */}
            <motion.div
                animate={{ y: pullDistance }}
                transition={isRefreshing ? { type: "spring", stiffness: 300, damping: 30 } : { type: "tween", duration: 0.1 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
