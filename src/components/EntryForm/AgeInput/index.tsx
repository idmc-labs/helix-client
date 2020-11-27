import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import NonFieldError from '#components/NonFieldError';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import { AgeFormProps } from '../types';
import styles from './styles.css';

interface AgeInputProps {
    index: number;
    value: PartialForm<AgeFormProps>;
    error: Error<AgeFormProps> | undefined;
    onChange: (value: PartialForm<AgeFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    reviewMode?: boolean;
}

function AgeInput(props: AgeInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        className,
        disabled,
        reviewMode,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);

    return (
        <div className={_cs(className, styles.ageInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <NumberInput
                label="From *"
                name="ageFrom"
                value={value.ageFrom}
                onChange={onValueChange}
                error={error?.fields?.ageFrom}
                disabled={disabled}
                readOnly={reviewMode}
            />
            <NumberInput
                label="To *"
                name="ageTo"
                value={value.ageTo}
                onChange={onValueChange}
                error={error?.fields?.ageTo}
                disabled={disabled}
                readOnly={reviewMode}
            />
            <NumberInput
                label="Value *"
                name="value"
                value={value.value}
                onChange={onValueChange}
                error={error?.fields?.value}
                disabled={disabled}
                readOnly={reviewMode}
            />
            <Button
                onClick={onRemove}
                name={index}
                disabled={disabled || reviewMode}
            >
                Remove
            </Button>
        </div>
    );
}

export default AgeInput;
