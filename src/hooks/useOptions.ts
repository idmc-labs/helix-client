import { useContext, useCallback, useEffect, SetStateAction } from 'react';
import { unique } from '@togglecorp/fujs';
import OptionContext, { Options } from '#components/OptionContext';
import { filterStorage } from '#utils/filterStorage';
import useDebouncedValue from '#hooks/useDebouncedValue';

function useOptions<K extends keyof Options>(key: K) {
    const { options, setOptions } = useContext(OptionContext);

    const debouncedOptions = useDebouncedValue(options);
    useEffect(() => {
        filterStorage.set('options', debouncedOptions);
    }, [debouncedOptions]);

    const setIndividualOption = useCallback(
        (value: SetStateAction<Options[K] | null | undefined>) => {
            setOptions((oldValue) => {
                const oldValueForKey: NonNullable<Options[K]> = oldValue[key] ?? [];
                const newValueForKey: NonNullable<Options[K]> = typeof value !== 'function'
                    ? value ?? []
                    : value(oldValueForKey) ?? [];

                // NOTE: we should always have the newValues
                // before oldValues so that we can update
                // the option values
                const concatenatedValueForKey = [
                    ...newValueForKey,
                    ...oldValueForKey,
                ];

                const finalValueForKey = unique(
                    concatenatedValueForKey,
                    (item) => item.id,
                );
                return ({
                    ...oldValue,
                    [key]: finalValueForKey,
                });
            });
        },
        [key, setOptions],
    );

    return [options[key], setIndividualOption] as const;
}

export default useOptions;
