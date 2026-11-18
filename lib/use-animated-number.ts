'use client';

import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target: number, duration: number = 1200) {
    const [current, setCurrent] = useState(0);
    const requestRef = useRef<number>(0);
    const startTimeRef = useRef<number | null>(null);
    const previousTargetRef = useRef(target);

    // Easing function: Ease-out quart for a playful, fast-start, soft-landing feel
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    useEffect(() => {
        // Reset if the target changes significantly (e.g., new data fetched)
        if (previousTargetRef.current !== target) {
            setCurrent(0);
            startTimeRef.current = null;
            previousTargetRef.current = target;
        }

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            const easedProgress = easeOutQuart(progress);

            setCurrent(Math.floor(easedProgress * target));

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [target, duration]);

    return current;
}