const FILTER_KEYS = ['report', 'crisis', 'crisisFigure', 'event', 'eventFigure', 'country', 'extractionEntry', 'extractionFigure'] as const;
export type PersistenceKeyType = typeof FILTER_KEYS[number];
const EXTRA_KEYS = ['options', 'filterVersion'] as const;
type ExtraKeyType = typeof EXTRA_KEYS[number];
type LocalStorageKeyType = ExtraKeyType | PersistenceKeyType;

// NOTE: Update this if there are any changes made to filters
export const FILTER_VERSION = '1';

export const filterStorage = {
    set: (key: LocalStorageKeyType, value: unknown) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to LocalStorage', e);
        }
    },
    get: (key: LocalStorageKeyType) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : undefined;
        } catch (e) {
            localStorage.removeItem(key);
            console.error('Error parsing JSON from LocalStorage', e);
            return undefined;
        }
    },
    clearAll: () => {
        try {
            [...FILTER_KEYS, ...EXTRA_KEYS].forEach((key) => localStorage.removeItem(key));
        } catch (e) {
            console.error('Error clearing local storage', e);
        }
    },
    checkVersionAndClear: () => {
        const savedVersion = filterStorage.get('filterVersion');
        if (savedVersion !== FILTER_VERSION) {
            filterStorage.clearAll();
            filterStorage.set('filterVersion', FILTER_VERSION);
        }
    },
};
