import React, { useCallback } from 'react';
import {
    _cs,
    listToMap,
} from '@togglecorp/fujs';
import { SelectInputContainer, SelectInputContainerProps } from '@togglecorp/toggle-ui';
import { MdCheck } from 'react-icons/md';

import Loading from '#components/Loading';

import styles from './styles.css';

interface OptionProps {
    children: React.ReactNode;
}
function Option(props: OptionProps) {
    const { children } = props;
    return (
        <>
            <div className={styles.icon}>
                <MdCheck />
            </div>
            <div className={styles.label}>
                { children }
            </div>
        </>
    );
}

interface DefaultEmptyComponentProps {
    optionsPending?: boolean;
}

function DefaultEmptyComponent(props: DefaultEmptyComponentProps) {
    const {
        optionsPending = false,
    } = props;

    if (optionsPending) {
        return (
            <Loading
                className={styles.empty}
                message="Fetching options"
            />
        );
    }

    return (
        <div className={styles.empty}>
            No options available
        </div>
    );
}

type Def = { containerClassName?: string };
type OptionKey = string | number;
export type SelectInputProps<
    T extends OptionKey,
    K,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def,
> = {
    value: T | undefined | null,
    options: O[] | undefined | null,
    searchOptions: O[] | undefined | null,
    keySelector: (option: O) => T,
    labelSelector: (option: O) => string | undefined,
    onSearchValueChange: (searchVal: string) => void,
    searchPlaceholder?: string;
    optionsEmptyComponent?: React.ReactNode;
    name: K;
    disabled?: boolean;
    readOnly?: boolean;
} & (
    { nonClearable: true; onChange: (newValue: T, name: K) => void }
    | { nonClearable?: false; onChange: (newValue: T | undefined, name: K) => void }
) & Omit<
    SelectInputContainerProps<T, K, O, P>,
        'optionsEmptyComponent'
        | 'optionKeySelector'
        | 'optionRenderer'
        | 'optionRendererParams'
        | 'onOptionClick'
        | 'name'
        | 'valueDisplay'
        | 'onSearchInputChange'
        | 'nonClearable'
        | 'onClear'
    >;

const emptyList: unknown[] = [];

// eslint-disable-next-line @typescript-eslint/ban-types
function SelectInput<T extends OptionKey, K extends string, O extends object, P extends Def>(
    props: SelectInputProps<T, K, O, P>,
) {
    const {
        name,
        value,
        onChange,
        options: optionsFromProps,
        searchOptions,
        keySelector,
        labelSelector,
        searchPlaceholder = 'Type to search',
        optionsEmptyComponent,
        optionsPopupClassName,
        onSearchValueChange,
        nonClearable,
        ...otherProps
    } = props;

    const options = optionsFromProps ?? (emptyList as O[]);

    const [, setSearchInputValue] = React.useState('');

    const handleSearchValueChange = useCallback((newValue: string) => {
        setSearchInputValue(newValue);
        onSearchValueChange(newValue);
    }, [setSearchInputValue, onSearchValueChange]);

    const optionsLabelMap = React.useMemo(() => (
        listToMap(options, keySelector, labelSelector)
    ), [options, keySelector, labelSelector]);

    const optionRendererParams = React.useCallback(
        (key: OptionKey, option: O) => {
            const isActive = key === value;

            return {
                children: labelSelector(option),
                containerClassName: _cs(styles.option, isActive && styles.active),
                isActive,
            };
        },
        [value, labelSelector],
    );

    const handleClear = useCallback(
        () => {
            if (!nonClearable) {
                onChange(undefined, name);
            }
        },
        [name, onChange, nonClearable],
    );

    return (
        <SelectInputContainer
            {...otherProps}
            nonClearable={nonClearable}
            name={name}
            options={searchOptions}
            optionKeySelector={keySelector}
            optionRenderer={Option}
            optionRendererParams={optionRendererParams}
            onOptionClick={onChange}
            onSearchInputChange={handleSearchValueChange}
            valueDisplay={value ? optionsLabelMap[value] : ''}
            searchPlaceholder={searchPlaceholder}
            optionsEmptyComponent={optionsEmptyComponent ?? (
                <DefaultEmptyComponent
                    optionsPending={otherProps.optionsPending}
                />
            )}
            optionsPopupClassName={_cs(optionsPopupClassName, styles.optionsPopup)}
            onClear={handleClear}
        />
    );
}

export default SelectInput;
