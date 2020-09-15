import { useReducer, useCallback, useRef, useLayoutEffect } from 'react';

import {
    accumulateDifferentialErrors,
    accumulateErrors,
    analyzeErrors,
    accumulateValues,
} from '#utils/schema';
import type { Schema, Error } from '#utils/schema';

export type EntriesAsList<T> = {
    [K in keyof T]: [T[K], K, ...unknown[]];
}[keyof T];

export type EntriesAsKeyValue<T> = {
    [K in keyof T]: {key: K, value: T[K] };
}[keyof T];

// eslint-disable-next-line @typescript-eslint/ban-types
function useForm<T extends object>(
    initialFormValue: T,
    schema: Schema<T>,
    handleSubmit: (value: T) => void,
) {
    // const [errors, setErrors] = useState<Error<T> | undefined>(undefined);

    type ErrorAction = { type: 'SET_ERROR', error: Error<T> | undefined };
    type ValueAction = EntriesAsKeyValue<T> & { type: 'SET_VALUE_FIELD' };

    function formReducer(
        prevState: { value: T, error: Error<T> | undefined },
        action: ValueAction | ErrorAction,
    ) {
        if (action.type === 'SET_VALUE_FIELD') {
            const { key, value } = action;
            const oldValue = prevState.value;
            const oldError = prevState.error;

            const newValue = {
                ...oldValue,
                [key]: value,
            };
            const newError = accumulateDifferentialErrors(
                oldValue,
                newValue,
                oldError,
                schema,
            );

            return {
                ...prevState,
                value: newValue,
                error: newError,
            };
        }
        if (action.type === 'SET_ERROR') {
            const { error } = action;
            return {
                ...prevState,
                error,
            };
        }
        console.error('Action is not supported');
        return prevState;
    }

    const [state, dispatch] = useReducer(
        formReducer,
        { value: initialFormValue, error: undefined },
    );

    const onValueChange = useCallback(
        (...entries: EntriesAsList<T>) => {
            const action: ValueAction = {
                type: 'SET_VALUE_FIELD',
                key: entries[1],
                value: entries[0],
            };
            dispatch(action);
        },
        [],
    );

    const onSubmit = useCallback(
        () => {
            const stateErrors = accumulateErrors(state.value, schema);
            const stateErrored = analyzeErrors(stateErrors);
            const action: ErrorAction = {
                type: 'SET_ERROR',
                error: stateErrors,
            };
            dispatch(action);

            if (!stateErrored) {
                const validatedValues = accumulateValues(
                    state.value,
                    schema,
                    { noFalsyValues: true, falsyValue: undefined },
                );
                handleSubmit(validatedValues);
            }
        },
        [handleSubmit, schema, state],
    );

    const onFormSubmit = useCallback(
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onSubmit();
        },
        [onSubmit],
    );

    return { value: state.value, error: state.error, onValueChange, onSubmit, onFormSubmit };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function useFormObject<K extends string | number, T extends object>(
    name: K,
    value: T,
    onChange: (newValue: T, name: K) => void,
) {
    const ref = useRef<T>(value);
    const onValueChange = useCallback(
        (...entries: EntriesAsList<T>) => {
            const newValue = {
                ...ref.current,
                [entries[1]]: entries[0],
            };
            onChange(newValue, name);
        },
        [name, onChange],
    );

    useLayoutEffect(
        () => {
            ref.current = value;
        },
        [value],
    );
    return onValueChange;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function useFormArray<K extends string, T extends object>(
    name: K,
    value: T[],
    onChange: (newValue: T[], name: K) => void,
) {
    const ref = useRef<T[]>(value);
    const onValueChange = useCallback(
        (val: T, index: number) => {
            const newValue = [
                ...ref.current,
            ];
            newValue[index] = val;
            onChange(newValue, name);
        },
        [name, onChange],
    );

    const onValueRemove = useCallback(
        (index: number) => {
            const newValue = [
                ...ref.current,
            ];
            newValue.splice(index, 1);
            onChange(newValue, name);
        },
        [name, onChange],
    );

    useLayoutEffect(
        () => {
            ref.current = value;
        },
        [value],
    );
    return { onValueChange, onValueRemove };
}

export default useForm;
