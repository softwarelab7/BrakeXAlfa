const normalizeText = (text: string = '') =>
    String(text).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const debounce = (func: Function, delay: number) => {
    let timeout: number;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const getPlaceholderImage = (text: string) => {
    const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="'Inter', sans-serif" font-size="16" fill="#9ca3af" dy=".3em" text-anchor="middle">
            ${text}
        </text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

interface BadgeConfigItem {
    class: string;
    test: (ref: string) => boolean;
}
const BADGE_CONFIG: Record<string, BadgeConfigItem> = {
    'K': { class: 'ref-k', test: (ref) => ref.startsWith('K') },
    'SP': { class: 'ref-sp', test: (ref) => ref.startsWith('SP') },
    'INC': { class: 'ref-inc', test: (ref) => ref.endsWith('INC') },
    'BP': { class: 'ref-bp', test: (ref) => ref.endsWith('BP') },
    'BEX': { class: 'ref-bex', test: (ref) => ref.endsWith('BEX') },
};
const getRefBadgeClass = (ref: any) => {
    if (typeof ref !== 'string') {
        return 'ref-default';
    }
    const upperRef = ref.toUpperCase();
    for (const key in BADGE_CONFIG) {
        if (BADGE_CONFIG[key].test(upperRef)) {
            return BADGE_CONFIG[key].class;
        }
    }
    if (/^\d/.test(upperRef)) {
        return 'ref-num';
    }
    return 'ref-default';
};

const getSortableRefNumber = (refArray: any[]) => {
    if (!Array.isArray(refArray) || refArray.length === 0) return Infinity;
    let primaryRef = refArray.find(ref => typeof ref === 'string' && ref.toUpperCase().startsWith('K-'));
    if (!primaryRef) primaryRef = refArray[0];
    const match = String(primaryRef).match(/(\d+)/);
    return match ? parseInt(match[0], 10) : Infinity;
};
