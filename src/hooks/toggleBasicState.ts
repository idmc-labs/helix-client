import { useCallback, useState } from 'react';

export default function useBasicToggle(onReset?: () => void): [
    boolean,
    () => void,
    () => void,
] {
    const [value, setValue] = useState(false);

    const setAction = useCallback(() => {
        setValue(true);
    }, [setValue]);

    const resetAction = useCallback(() => {
        if (onReset) {
            onReset();
        }
        setValue(false);
    }, [setValue, onReset]);

    return [value, setAction, resetAction];
}
