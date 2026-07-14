import { useEffect, useRef, useState } from 'react';

export function useChartWidth() {
    const ref = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            const next = Math.floor(entry?.contentRect?.width ?? 0);
            if (next > 0) setWidth(next);
        });

        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return { ref, width };
}
