import React from 'react';

import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import { AgeFormProps } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

interface AgeInputProps {
    index: number;
    value: AgeFormProps;
    error: Error<AgeFormProps> | undefined;
    onChange: (value: AgeFormProps, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
}

function AgeInput(p: AgeInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
    } = p;

    const onValueChange = useFormObject<number, AgeFormProps>(index, value, onChange);

    return (
        <div className={styles.ageInput}>
            <TextInput
                label="From"
                name="ageFrom"
                value={value.ageFrom}
                onChange={onValueChange}
                error={error?.fields?.ageFrom}
            />
            <TextInput
                label="To"
                name="ageTo"
                value={value.ageTo}
                onChange={onValueChange}
                error={error?.fields?.ageTo}
            />
            <TextInput
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
