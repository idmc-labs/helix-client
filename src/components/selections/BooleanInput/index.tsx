import React, { useCallback } from 'react';
import { SelectInput } from '@togglecorp/toggle-ui';

type BooleanString = 'true' | 'false';

function stringToBoolean(value: BooleanString | null | undefined) {
    switch (value) {
        case 'true':
            return true;
        case 'false':
            return false;
        default:
            return undefined;
    }
}

function booleanToString(value: boolean | null | undefined): BooleanString | null | undefined {
    switch (value) {
        case true:
            return 'true';
        case false:
            return 'false';
        default:
            return value;
    }
}

interface Option {
    name: string;
    value: BooleanString;
}

const keySelector = (d: Option) => d.value;

const labelSelector = (d: Option) => d.name;

interface Props<K extends string> {
    className?: string;
    name: K;
    value: boolean | null | undefined;
    onChange: (
        value: boolean | undefined,
        name: K,
    ) => void;
    label?: string;
    error?: string;
    disabled?: boolean;
    readOnly?: boolean;
}

const options: Option[] = [
    {
        name: 'Yes',
        value: 'true',
    },
    {
        name: 'No',
        value: 'false',
    },
];

function BooleanInput<K extends string>(props: Props<K>) {
    const {
        className,
        name,
        value,
        onChange,
        ...otherProps
    } = props;

    const currentValue = booleanToString(value);

    const handleChange = useCallback(
        (val: BooleanString | undefined) => {
            onChange(stringToBoolean(val), name);
        },
        [onChange, name],
    );

    return (
        <SelectInput
            className={className}
            keySelector={keySelector}
            labelSelector={labelSelector}
            options={options}
            value={currentValue}
            onChange={handleChange}
            name={name}
            {...otherProps}
        />
    );
}
export default BooleanInput;
