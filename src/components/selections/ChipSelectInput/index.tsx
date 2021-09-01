import React from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
    Chip,
} from '@togglecorp/toggle-ui';

import styles from './styles.css';

type Def = { containerClassName?: string };
type OptionKey = string | number;

export type ChipSelectInputProps<
    T extends OptionKey,
    K extends string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def,
    > = SearchMultiSelectInputProps<T, K, O, P, 'onSearchValueChange' | 'searchOptions' | 'onShowDropdownChange' | 'totalOptionsCount'>;

// eslint-disable-next-line @typescript-eslint/ban-types
function ChipSelectInput<T extends OptionKey, K extends string, O extends object, P extends Def>(
    props: ChipSelectInputProps<T, K, O, P>,
) {
    const {
        name,
        options,
        className,
        value,
        keySelector,
        labelSelector,
        ...otherProps
    } = props;

    return (
        <>
            <div className={styles.chipContainer}>
                <SearchMultiSelectInput
                    {...otherProps}
                    className={_cs(styles.chipMultiSelectInput, className)}
                    name={name}
                    options={options}
                    value={value}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                />
                <div>
                    {value?.map((key) => {
                        const option = options?.find((opt) => keySelector(opt) === key);
                        if (!option) {
                            return null;
                        }
                        const label = labelSelector(option);
                        return (
                            <Chip
                                key={key}
                                label={label}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default ChipSelectInput;
