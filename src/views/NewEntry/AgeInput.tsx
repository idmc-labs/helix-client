import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import { AgeFormProps, PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

interface AgeInputProps {
    index: number;
    value: PartialForm<AgeFormProps>;
    error: Error<AgeFormProps> | undefined;
    onChange: (value: PartialForm<AgeFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
}

function AgeInput(props: AgeInputProps) {
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
        <div className={_cs(className, styles.ageInput)}>
            <NumberInput
                label="From"
                name="ageFrom"
                value={value.ageFrom}
                onChange={onValueChange}
                error={error?.fields?.ageFrom}
            />
            <NumberInput
                label="To"
                name="ageTo"
                value={value.ageTo}
                onChange={onValueChange}
                error={error?.fields?.ageTo}
            />
            <NumberInput
                label="Value"
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

export default AgeInput;
