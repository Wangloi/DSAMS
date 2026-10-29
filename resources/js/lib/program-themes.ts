/**
 * Program Theme Color Configuration
 *
 * Maps academic programs to their respective color themes:
 * - Business Administration: Yellow / Amber
 * - Criminology: Light Blue / Sky
 * - Hospitality Management: Green / Emerald
 * - Information Technology: Maroon / Crimson
 * - Secondary & Elementary Education: Blue / Royal Navy
 */

export interface ProgramTheme {
    key: 'business' | 'criminology' | 'hospitality' | 'it' | 'education' | 'default';
    name: string;
    logoUrl: string;
    headerGradient: string;
    hoverBarGradient: string;
    heroGradient: string;
    accentColor: string;
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
}

export function getProgramTheme(program?: { code?: string; name?: string } | string | null): ProgramTheme {
    const raw = typeof program === 'string'
        ? program
        : `${program?.code || ''} ${program?.name || ''}`;

    const text = (raw || '').toUpperCase().trim();

    // 1. Business Administration -> Yellow
    if (
        text.includes('BSBA') ||
        text.includes('BUSINESS') ||
        text.includes('ADMINISTRATION')
    ) {
        return {
            key: 'business',
            name: 'Business Administration',
            logoUrl: '/images/logos/BA.jpg',
            headerGradient: 'from-[#854d0e] via-[#ca8a04] to-[#eab308]',
            hoverBarGradient: 'from-[#854d0e] via-[#ca8a04] to-[#eab308]',
            heroGradient: 'from-[#854d0e] via-[#ca8a04] to-[#eab308]',
            accentColor: '#ca8a04',
            badgeBg: 'bg-amber-500/20',
            badgeBorder: 'border-amber-400/30',
            badgeText: 'text-amber-100',
        };
    }

    // 2. Criminology -> Light Blue
    if (
        text.includes('CRIM') ||
        text.includes('CRIMINOLOGY') ||
        text.includes('CRIMINAL')
    ) {
        return {
            key: 'criminology',
            name: 'Criminology',
            logoUrl: '/images/logos/CRIM.jpg',
            headerGradient: 'from-[#0369a1] via-[#0284c7] to-[#38bdf8]',
            hoverBarGradient: 'from-[#0369a1] via-[#0284c7] to-[#38bdf8]',
            heroGradient: 'from-[#0369a1] via-[#0284c7] to-[#38bdf8]',
            accentColor: '#0284c7',
            badgeBg: 'bg-sky-500/20',
            badgeBorder: 'border-sky-400/30',
            badgeText: 'text-sky-100',
        };
    }

    // 3. Hospitality Management -> Green
    if (
        text.includes('BSHM') ||
        text.includes('HOSPITALITY') ||
        text.includes('HOTEL') ||
        text.includes('HRM') ||
        text.includes('TOURISM')
    ) {
        return {
            key: 'hospitality',
            name: 'Hospitality Management',
            logoUrl: '/images/logos/HM.jpg',
            headerGradient: 'from-[#065f46] via-[#059669] to-[#10b981]',
            hoverBarGradient: 'from-[#065f46] via-[#059669] to-[#10b981]',
            heroGradient: 'from-[#065f46] via-[#059669] to-[#10b981]',
            accentColor: '#059669',
            badgeBg: 'bg-emerald-500/20',
            badgeBorder: 'border-emerald-400/30',
            badgeText: 'text-emerald-100',
        };
    }

    // 4. Information Technology -> Maroon
    if (
        text.includes('BSIT') ||
        text.includes('INFORMATION TECHNOLOGY') ||
        text.includes('COMPUTER') ||
        text.includes('BSCS')
    ) {
        return {
            key: 'it',
            name: 'Information Technology',
            logoUrl: '/images/logos/IT.png',
            headerGradient: 'from-[#4c0519] via-[#881337] to-[#9f1239]',
            hoverBarGradient: 'from-[#4c0519] via-[#881337] to-[#be123c]',
            heroGradient: 'from-[#4c0519] via-[#881337] to-[#9f1239]',
            accentColor: '#881337',
            badgeBg: 'bg-rose-500/20',
            badgeBorder: 'border-rose-400/30',
            badgeText: 'text-rose-100',
        };
    }

    // 5. Secondary Education and Elementary Education -> Blue
    if (
        text.includes('BSED') ||
        text.includes('BEED') ||
        text.includes('EDUCATION') ||
        text.includes('ELEMENTARY') ||
        text.includes('SECONDARY') ||
        text.includes('TEACHER')
    ) {
        return {
            key: 'education',
            name: 'Education',
            logoUrl: '/images/SRCB.png',
            headerGradient: 'from-[#0b2d66] via-[#1e3a8a] to-[#0B4DFF]',
            hoverBarGradient: 'from-[#0b2d66] via-[#23509A] to-[#1e40af]',
            heroGradient: 'from-[#0b2d66] via-[#1e3a8a] to-[#0B4DFF]',
            accentColor: '#1e3a8a',
            badgeBg: 'bg-blue-500/20',
            badgeBorder: 'border-blue-400/30',
            badgeText: 'text-blue-100',
        };
    }

    // Default fallback -> Blue
    return {
        key: 'default',
        name: 'Default',
        logoUrl: '/images/SRCB.png',
        headerGradient: 'from-[#0b2d66] via-[#1e3a8a] to-[#0B4DFF]',
        hoverBarGradient: 'from-[#0b2d66] via-[#23509A] to-[#1e40af]',
        heroGradient: 'from-[#0b2d66] via-[#1e3a8a] to-[#0B4DFF]',
        accentColor: '#0b2d66',
        badgeBg: 'bg-blue-500/20',
        badgeBorder: 'border-blue-400/30',
        badgeText: 'text-blue-100',
    };
}
