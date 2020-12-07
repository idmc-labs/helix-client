import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    TextInput,
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import {
    PartialForm,
    ReviewInputFields,
} from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import { getStrataReviewProps } from '../utils';
import { StrataFormProps } from '../types';
import styles from './styles.css';

type StrataInputValue = PartialForm<StrataFormProps>;

interface StrataInputProps {
    index: number;
    value: StrataInputValue;
    error: Error<StrataFormProps> | undefined;
    onChange: (value: PartialForm<StrataFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: string, name: string) => void;
    figureId: string;
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
        review,
        onReviewChange,
        figureId,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);
    const strataId = value.uuid.replaceAll('-', '$');

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
                icons={reviewMode && review && (
                    <TrafficLightInput
                        onChange={onReviewChange}
                        {...getStrataReviewProps(review, figureId, strataId, 'date')}
                    />
                )}
            />
            <NumberInput
                label="To *"
                name="value"
                value={value.value}
                onChange={onValueChange}
                error={error?.fields?.value}
                disabled={disabled}
                readOnly={reviewMode}
                icons={reviewMode && review && (
                    <TrafficLightInput
                        onChange={onReviewChange}
                        {...getStrataReviewProps(review, figureId, strataId, 'value')}
                    />
                )}
            />
            {!reviewMode && (
                <Button
                    onClick={onRemove}
                    name={index}
                    disabled={disabled}
                >
                    Remove
                </Button>
            )}
        </div>
    );
}

export default StrataInput;
