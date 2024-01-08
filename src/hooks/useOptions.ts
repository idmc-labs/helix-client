import { useContext, useCallback, SetStateAction } from 'react';
import { unique } from '@togglecorp/fujs';
import OptionContext, { Options } from '#components/OptionContext';

function useOptions<K extends keyof Options>(key: K) {
    const { options, setOptions } = useContext(OptionContext);

    const setIndividualOption = useCallback(
        (value: SetStateAction<Options[K] | null | undefined>) => {
            setOptions((oldValue) => {
                const oldValueForKey = oldValue[key];
                const newValueForKey = typeof value !== 'function'
                    ? value
                    : value(oldValueForKey);

                // NOTE: we should always have the newValues
                // before oldValues so that we can update
                // the option values
                const concatenatedValueForKey = [
                    ...(newValueForKey ?? []),
                    ...(oldValueForKey ?? []),
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
