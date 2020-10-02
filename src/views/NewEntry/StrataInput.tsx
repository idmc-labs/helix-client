import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import { StrataFormProps, PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

interface StrataInputProps {
    index: number;
    value: PartialForm<StrataFormProps>;
    error: Error<StrataFormProps> | undefined;
    onChange: (value: PartialForm<StrataFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
}

function StrataInput(props: StrataInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        className,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);

    return (
        <div className={_cs(className, styles.strataInput)}>
            <TextInput
                label="Date"
                name="date"
                value={value.date}
                onChange={onValueChange}
                error={error?.fields?.date}
            />
            <NumberInput
                label="To"
                name="value"
                value={value.value}
                onChange={onValueChange}
                error={error?.fields?.value}
            />
            <Button
                onClick={onRemove}
                name={index}
            >
                Remove
            </Button>
        </div>
    );
}

export default StrataInput;
