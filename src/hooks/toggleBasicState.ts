import React, { useCallback, useState } from 'react';

export default function useBasicToggle(
    onReset?: () => void,
): [
        boolean,
        () => void,
        () => void,
    ] {
    const [value, setValues] = useState(false);

    const setAction = useCallback(() => {
        setValues(true);
    }, [setValues]);

    const resetAction = useCallback(() => {
        if (onReset) {
            onReset();
        }
        setValues(false);
    }, [setValues, onReset]);

    return [value, setAction, resetAction];
}
