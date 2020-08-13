import { useReducer } from 'react';

export type EntriesAsList<T> = {
    [K in keyof T]: [T[K], K, ...any[]];
}[keyof T];

export type EntriesAsKeyValue<T> = {
    [K in keyof T]: {key: K, value: T[K]};
}[keyof T];

function useForm<T extends Record<keyof T, T[keyof T]>>(initialFormValue: T) {
    function formReducer(
        prevState: T,
        { value, key }: EntriesAsKeyValue<T>,
    ): T {
        const updatedElement = {
            ...prevState,
            [key]: value,
        };
        return updatedElement;
    }

    const [state, dispatch] = useReducer(formReducer, initialFormValue);

    // FIXME: use callback
    function onStateChange(...entries: EntriesAsList<T>) {
        dispatch({ key: entries[1], value: entries[0] });
    }

    return { state, onStateChange };
}

export default useForm;
