import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import { getAgeReviewProps } from '../utils';
import {
    AgeFormProps,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';
import Row from '../Row';
import styles from './styles.css';

type AgeInputValue = PartialForm<AgeFormProps>;

interface AgeInputProps {
    index: number;
    value: AgeInputValue;
    error: Error<AgeFormProps> | undefined;
    onChange: (value: PartialForm<AgeFormProps>, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
    disabled?: boolean;
    reviewMode?: boolean;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    figureId: string;
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
        review,
        onReviewChange,
        figureId,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);
    const ageId = value.uuid;

    return (
        <div className={_cs(className, styles.ageInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <NumberInput
                    label="From *"
                    name="ageFrom"
                    value={value.ageFrom}
                    onChange={onValueChange}
                    error={error?.fields?.ageFrom}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getAgeReviewProps(review, figureId, ageId, 'ageFrom')}
                        />
                    )}
                />
                <NumberInput
                    label="To *"
                    name="ageTo"
                    value={value.ageTo}
                    onChange={onValueChange}
                    error={error?.fields?.ageTo}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getAgeReviewProps(review, figureId, ageId, 'ageTo')}
                        />
                    )}
                />
                <NumberInput
                    label="Value *"
                    name="value"
                    value={value.value}
                    onChange={onValueChange}
                    error={error?.fields?.value}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            onChange={onReviewChange}
                            {...getAgeReviewProps(review, figureId, ageId, 'value')}
                        />
                    )}
                />
                {!reviewMode && (
                    <Button
                        className={styles.removeButton}
                        onClick={onRemove}
                        name={index}
                        disabled={disabled}
                        transparent
                    >
                        Remove
                    </Button>
                )}
            </Row>
        </div>
    );
}

export default AgeInput;
