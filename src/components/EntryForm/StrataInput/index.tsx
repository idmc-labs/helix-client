import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import NonFieldError from '#components/NonFieldError';

import { StrataFormProps } from '../types';
import styles from './styles.css';

interface StrataInputProps {
    index: number;
    value: PartialForm<StrataFormProps>;
    error: Error<StrataFormProps> | undefined;
    onChange: (value: PartialForm<StrataFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    reviewMode?: boolean;
}

function StrataInput(props: StrataInputProps) {
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
        <div className={_cs(className, styles.strataInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <TextInput
                label="Date *"
                name="date"
                value={value.date}
                onChange={onValueChange}
                error={error?.fields?.date}
                disabled={disabled}
                readOnly={reviewMode}
            />
            <NumberInput
                label="To *"
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

export default StrataInput;
