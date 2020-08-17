import { useReducer, useCallback } from 'react';

import {
    accumulateDifferentialErrors,
    accumulateErrors,
    analyzeErrors,
    accumulateValues,
} from '#utils/schema';
import type { Schema, Error } from '#utils/schema';

export type EntriesAsList<T> = {
    [K in keyof T]: [T[K], K, ...any[]];
}[keyof T];

export type EntriesAsKeyValue<T> = {
    [K in keyof T]: {key: K, value: T[K] };
}[keyof T];

function useForm<T extends Record<keyof T, T[keyof T]>>(
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
        (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

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
                    { noFalsyValues: false, falsyValue: null },
                );
                handleSubmit(validatedValues);
            }
        },
        [handleSubmit, schema, state],
    );

    return { value: state.value, error: state.error, onValueChange, onSubmit };
}

export default useForm;
