import { useEffect, useRef } from 'react';

type VantaOptions = {
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    color2?: number;
    backgroundColor?: number;
    maxDistance?: number;
    showDots?: boolean;
};

type VantaEffect = 'globe' | 'net';

type Props = {
    effect?: VantaEffect;
    className?: string;
    options?: VantaOptions;
    children?: React.ReactNode;
};

export default function VantaGlobeBackground({
    effect = 'globe',
    className,
    options,
    children,
}: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const effectRef = useRef<any>(null);

    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            if (!containerRef.current) return;

            const [THREE, vantaModule] = await Promise.all([
                import('three'),
                effect === 'net'
                    ? import('vanta/dist/vanta.net.min')
                    : import('vanta/dist/vanta.globe.min'),
            ]);

            if (cancelled || !containerRef.current) return;

            const VantaEffectFactory: any = (vantaModule as any).default;

            effectRef.current = VantaEffectFactory({
                el: containerRef.current,
                THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: 1.0,
                scaleMobile: 1.0,
                vertexColors: false,
                color: 0x543fff,
                color2: 0xf2f2f2,
                backgroundColor: 0xf2f2f2,
                ...(options ?? {}),
                ...(effect === 'net'
                    ? {
                          showDots: true,
                          maxDistance: 0,
                      }
                    : null),
            });
        };

        init();

        return () => {
            cancelled = true;
            if (effectRef.current) {
                effectRef.current.destroy();
                effectRef.current = null;
            }
        };
    }, [effect, options]);

    return (
        <div ref={containerRef} className={className ?? ''}>
            {children ? <div className="relative z-10">{children}</div> : null}
        </div>
    );
}
