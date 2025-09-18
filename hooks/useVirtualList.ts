import { useState, useEffect, useMemo, RefObject } from 'react';

interface UseVirtualListOptions {
    itemCount: number;
    itemHeight: number;
    containerRef: RefObject<HTMLElement>;
    overscan?: number;
}

export const useVirtualList = ({
    itemCount,
    itemHeight,
    containerRef,
    overscan = 5,
}: UseVirtualListOptions) => {
    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    
    useEffect(() => {
        const handleScroll = () => {
            setScrollTop(window.scrollY);
        };
        const handleResize = () => {
            setViewportHeight(window.innerHeight);
        }

        handleResize(); // Initial set
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        }
    }, []);

    const { virtualItems } = useMemo(() => {
        const container = containerRef.current;
        if (!container) {
            return { virtualItems: [] };
        }

        const containerTop = container.offsetTop || 0;
        const relativeScrollTop = Math.max(0, scrollTop - containerTop);
        
        const start = Math.max(0, Math.floor(relativeScrollTop / itemHeight) - overscan);
        const end = Math.min(itemCount - 1, Math.floor((relativeScrollTop + viewportHeight) / itemHeight) + overscan);

        const items = [];
        for (let i = start; i <= end; i++) {
            items.push({
                index: i,
                style: {
                    transform: `translateY(${i * itemHeight}px)`,
                },
            });
        }
        return { virtualItems: items };
    }, [scrollTop, viewportHeight, itemHeight, itemCount, overscan, containerRef]);

    const totalHeight = itemCount * itemHeight;

    return { virtualItems, totalHeight };
};