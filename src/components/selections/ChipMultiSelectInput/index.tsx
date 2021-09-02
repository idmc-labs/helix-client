import React, { useState, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
    Chip,
} from '@togglecorp/toggle-ui';
import { IoCloseCircleSharp } from 'react-icons/io5';

import QuickActionButton from '#components/QuickActionButton';
import styles from './styles.css';

type Def = { containerClassName?: string };
type OptionKey = string | number;

export type ChipSelectInputProps<
    T extends OptionKey,
    K extends string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def,
    > = SearchMultiSelectInputProps<T, K, O, P, 'onSearchValueChange' | 'onShowDropdownChange' | 'totalOptionsCount'>;

function ChipMultiSelectInput<
    T extends OptionKey,
    K extends string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def
>(
    props: ChipSelectInputProps<T, K, O, P>,
) {
    const {
        name,
        options,
        className,
        value,
        keySelector,
        labelSelector,
        searchOptions,
        ...otherProps
    } = props;

    const [optionList, setOptionList] = useState<T[] | null | undefined>();

    useEffect(() => {
        setOptionList(value);
    }, [value]);

    const handleCancelOption = React.useCallback((selectedKey) => {
        const selectedOptions = optionList?.filter((optionID) => optionID !== selectedKey);
        setOptionList(selectedOptions);
    }, [optionList]);

    return (
        <>
            <div className={styles.chipContainer}>
                <SearchMultiSelectInput
                    {...otherProps}
                    className={_cs(styles.chipMultiSelectInput, className)}
                    name={name}
                    options={options}
                    searchOptions={searchOptions}
                    value={optionList}
                    keySelector={keySelector}
                    labelSelector={labelSelector}
                />
                <div className={styles.chipCollection}>
                    {optionList?.map((key) => {
                        const option = options?.find((opt) => keySelector(opt) === key);
                        if (!option) {
                            return null;
                        }
                        const label = labelSelector(option);
                        return (
                            <Chip
                                className={styles.chipLayout}
                                key={key}
                                label={label}
                                action={(
                                    <QuickActionButton
                                        name={name}
                                        onClick={() => handleCancelOption(key)}
                                    >
                                        <IoCloseCircleSharp />
                                    </QuickActionButton>
                                )}
                            />
                        );
                    })}
                </div>
            </div>
        </>
    );
}

export default ChipMultiSelectInput;
