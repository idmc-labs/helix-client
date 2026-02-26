const FILTER_KEYS = ['report', 'crisis', 'crisisFigure', 'event', 'eventFigure', 'country', 'extractionEntry', 'extractionFigure'] as const;
export type PersistenceKeyType = typeof FILTER_KEYS[number];
const EXTRA_KEYS = ['options', 'filterVersion'] as const;
type ExtraKeyType = typeof EXTRA_KEYS[number];
type LocalStorageKeyType = ExtraKeyType | PersistenceKeyType;

const FILTER_VERSION = import.meta.env.REACT_APP_FILTER_VERSION;

export const filterStorage = {
    set: (key: LocalStorageKeyType, value: unknown) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to LocalStorage', e);
        }
    },
    get: (key: LocalStorageKeyType) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    clearAll: () => {
        [...FILTER_KEYS, ...EXTRA_KEYS].forEach((key) => localStorage.removeItem(key));
    },
    checkVersionAndClear: () => {
        const savedVersion = localStorage.getItem('filterVersion');
        if (savedVersion !== FILTER_VERSION) {
            filterStorage.clearAll();
            localStorage.setItem('filterVersion', FILTER_VERSION);
        }
    },
};
