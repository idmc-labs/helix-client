import React from 'react';

export default function useBooleanState(initialValue: boolean) {
    const [value, setValue] = React.useState(initialValue);

    const setTrue = React.useCallback(() => {
        setValue(true);
    }, [setValue]);

    const setFalse = React.useCallback(() => {
        setValue(false);
    }, [setValue]);

    const toggleFn = React.useCallback(() => {
        setValue((oldValue) => !oldValue);
    }, [setValue]);

    return [value, setTrue, setFalse, setValue, toggleFn] as const;
}
