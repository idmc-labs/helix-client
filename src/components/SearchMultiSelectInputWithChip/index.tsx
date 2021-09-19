import React, { useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    SearchMultiSelectInput,
    SearchMultiSelectInputProps,
    Chip,
    Button,
} from '@togglecorp/toggle-ui';
import { IoClose } from 'react-icons/io5';

import styles from './styles.css';

type Def = { containerClassName?: string };
type OptionKey = string | number;

export type Props<
    T extends OptionKey,
    K extends string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def,
> = SearchMultiSelectInputProps<T, K, O, P, never> & { wrapperContainer?: string };

function SearchMultiSelectInputWithChip<
    T extends OptionKey,
    K extends string,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def
>(props: Props<T, K, O, P>) {
    const {
        name,
        options,
        value,
        keySelector,
        labelSelector,
        searchOptions,
        onChange,
        wrapperContainer,
        disabled,
        readOnly,
        ...otherProps
    } = props;

    const handleCancelOption = useCallback(
        (selectedKey) => {
            const newValue = value?.filter((optionID) => optionID !== selectedKey) ?? [];
            onChange(newValue, name);
        },
        [value, onChange, name],
    );

    return (
        <div className={_cs(styles.inputContainer, wrapperContainer)}>
            <SearchMultiSelectInput
                {...otherProps}
                name={name}
                options={options}
                searchOptions={searchOptions}
                value={value}
                keySelector={keySelector}
                labelSelector={labelSelector}
                onChange={onChange}
                disabled={disabled}
                readOnly={readOnly}
            />
            {value && value.length > 0 && (
                <div className={styles.chipCollection}>
                    {value.map((key) => {
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
                                action={!disabled && !readOnly && (
                                    <Button
                                        name={key}
                                        onClick={handleCancelOption}
                                        title="Remove"
                                        transparent
                                        compact
                                    >
                                        <IoClose />
                                    </Button>
                                )}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default SearchMultiSelectInputWithChip;
