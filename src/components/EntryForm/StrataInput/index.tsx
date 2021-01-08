import React from 'react';
import { _cs } from '@togglecorp/fujs';

import {
    DateInput,
    NumberInput,
    Button,
} from '@togglecorp/toggle-ui';

import {
    PartialForm,
} from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import { getStrataReviewProps } from '../utils';
import {
    StrataFormProps,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';
import Row from '../Row';
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
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
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
    const strataId = value.uuid;

    return (
        <div className={_cs(className, styles.strataInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <DateInput
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
                            {...getStrataReviewProps(review, figureId, strataId, 'value')}
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

export default StrataInput;
