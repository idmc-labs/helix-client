import React, { useCallback } from 'react';
import {
    _cs,
    listToMap,
} from '@togglecorp/fujs';
import {
    SelectInputContainer,
    SelectInputContainerProps,
} from '@togglecorp/toggle-ui';
import { MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';

import Loading from '#components/Loading';

import styles from './styles.css';

type OptionKey = string | number;

interface OptionProps {
    children: React.ReactNode;
    isActive: boolean;
}
function Option(props: OptionProps) {
    const {
        children,
        isActive,
    } = props;

    return (
        <>
            <div className={styles.icon}>
                { isActive ? <MdCheckBox /> : <MdCheckBoxOutlineBlank /> }
            </div>
            <div className={styles.label}>
                { children }
            </div>
        </>
    );
}

interface DefaultEmptyComponentProps {
    optionsPending?: boolean;
    isFiltered?: boolean;
}

function DefaultEmptyComponent(props: DefaultEmptyComponentProps) {
    const {
        isFiltered = false,
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

    if (isFiltered) {
        return (
            <div className={styles.empty}>
                No matching results
            </div>
        );
    }

    return (
        <div className={styles.empty}>
            No options available
        </div>
    );
}

type Def = { containerClassName?: string };

// eslint-disable-next-line @typescript-eslint/ban-types
export type MultiSelectInputProps<
    T extends OptionKey,
    K,
    // eslint-disable-next-line @typescript-eslint/ban-types
    O extends object,
    P extends Def,
> = {
    value: T[] | undefined | null;
    onChange: (newValue: T[], name: K) => void;
    options: O[] | undefined | null;
    searchOptions: O[] | undefined | null,
    keySelector: (option: O) => T;
    labelSelector: (option: O) => string;
    searchPlaceholder?: string;
    onSearchValueChange: (searchVal: string) => void,
    optionsEmptyComponent?: React.ReactNode;
    name: K;
    disabled?: boolean;
    readOnly?: boolean;
} & Omit<
    SelectInputContainerProps<T, K, O, P>,
        'optionsEmptyComponent'
        | 'optionKeySelector'
        | 'optionRenderer'
        | 'optionRendererParams'
        | 'onOptionClick'
        | 'name'
        | 'valueDisplay'
        | 'onSearchInputChange'
        | 'onClear'
    >;

const emptyList: unknown[] = [];

// eslint-disable-next-line @typescript-eslint/ban-types
function MultiSelectInput<T extends OptionKey, K extends string, O extends object, P extends Def>(
    props: MultiSelectInputProps<T, K, O, P>,
) {
    const {
        value: valueFromProps,
        onChange,
        options: optionsFromProps,
        keySelector,
        labelSelector,
        searchPlaceholder = 'Type to search',
        optionsEmptyComponent = <DefaultEmptyComponent />,
        onSearchValueChange,
        searchOptions,
        name,
        ...otherProps
    } = props;

    const options = optionsFromProps ?? (emptyList as O[]);
    const value = valueFromProps ?? (emptyList as T[]);

    const [searchInputValue, setSearchInputValue] = React.useState('');

    const handleSearchValueChange = useCallback((newValue: string) => {
        setSearchInputValue(newValue);
        onSearchValueChange(newValue);
    }, [setSearchInputValue, onSearchValueChange]);

    const optionsLabelMap = React.useMemo(() => (
        listToMap(options, keySelector, labelSelector)
    ), [options, keySelector, labelSelector]);

    const optionRendererParams = React.useCallback((key, option) => {
        // TODO: optimize using map
        const isActive = value.indexOf(key) !== -1;

        return {
            children: labelSelector(option),
            containerClassName: _cs(styles.option, isActive && styles.active),
            isActive,
        };
    }, [value, labelSelector]);

    const handleOptionClick = React.useCallback((optionKey: T) => {
        const optionKeyIndex = value.findIndex((d) => d === optionKey);
        const newValue = [...value];

        if (optionKeyIndex !== -1) {
            newValue.splice(optionKeyIndex, 1);
        } else {
            newValue.push(optionKey);
        }

        onChange(newValue, name);
    }, [value, onChange, name]);

    const valueDisplay = React.useMemo(() => (
        value.map((v) => optionsLabelMap[v]).join(', ')
    ), [value, optionsLabelMap]);

    const handleClear = useCallback(
        () => {
            onChange([], name);
        },
        [name, onChange],
    );

    return (
        <SelectInputContainer
            {...otherProps}
            name={name}
            options={(
                searchInputValue?.length > 0
                    ? searchOptions
                    : optionsFromProps
            )}
            optionKeySelector={keySelector}
            optionRenderer={Option}
            optionRendererParams={optionRendererParams}
            onOptionClick={handleOptionClick}
            optionContainerClassName={styles.optionContainer}
            onSearchInputChange={handleSearchValueChange}
            valueDisplay={valueDisplay}
            searchPlaceholder={searchPlaceholder}
            optionsEmptyComponent={optionsEmptyComponent ?? (
                <DefaultEmptyComponent
                    isFiltered={searchInputValue?.length > 0}
                    optionsPending={otherProps.optionsPending}
                />
            )}
            persistentOptionPopup
            optionsPopupClassName={styles.optionsPopup}
            onClear={handleClear}
        />
    );
}

export default MultiSelectInput;
