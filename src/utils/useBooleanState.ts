import React, { useState, useCallback } from 'react';

type SetTrueFn = () => void;
type SetFalseFn = () => void;
type ToggleFn = () => void;
type SetValueFn = React.Dispatch<React.SetStateAction<boolean>>;

export default function useBooleanState(initialValue: boolean): [
    boolean,
    SetTrueFn,
    SetFalseFn,
    SetValueFn,
    ToggleFn,
] {
    const [value, setValue] = useState(initialValue);

    const setTrue = useCallback(() => {
        setValue(true);
    }, [setValue]);

    const setFalse = useCallback(() => {
        setValue(false);
    }, [setValue]);

    const toggleFn = useCallback(() => {
        setValue((oldValue) => !oldValue);
    }, [setValue]);

    return [value, setTrue, setFalse, setValue, toggleFn];
}
