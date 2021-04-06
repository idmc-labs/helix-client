import React from 'react';
import { _cs } from '@togglecorp/fujs';
// import {
//     useQuery,
// } from '@apollo/client';

import {
    NumberInput,
    Button,
    SelectInput,
} from '@togglecorp/toggle-ui';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import Row from '#components/Row';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import { getAgeReviewProps, getGenderReviewProps } from '../utils';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';
// import { DisaggregatedAgeInputType } from '#generated/types';
// import { ENTRY } from '../queries';
import {
    AgeFormProps,
    ReviewInputFields,
    EntryReviewStatus,
    AgeOptions,
    GenderOptions,
} from '../types';
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
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    figureId: string;
    trafficLightShown: boolean;
    ageOptions: AgeOptions;
    genderOptions: GenderOptions;
}

function AgeInput(props: AgeInputProps) {
    const {
        value,
        ageOptions,
        genderOptions,
        onChange,
        onRemove,
        error,
        index,
        className,
        disabled,
        mode,
        review,
        onReviewChange,
        figureId,
        trafficLightShown,
    } = props;

    const onValueChange = useFormObject(index, value, onChange);
    const ageId = value.uuid;

    const reviewMode = mode === 'review';
    const editMode = mode === 'edit';

    return (
        <div className={_cs(className, styles.ageInput)}>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <SelectInput
                    options={ageOptions}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    label="Age Category *"
                    name="category"
                    value={value.category}
                    onChange={onValueChange}
                    error={error?.fields?.category}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getAgeReviewProps(review, figureId, 'category')}
                        />
                    )}
                />
                <SelectInput
                    options={genderOptions}
                    keySelector={enumKeySelector}
                    labelSelector={enumLabelSelector}
                    label="Gender Category *"
                    name="sex"
                    value={value.sex}
                    onChange={onValueChange}
                    error={error?.fields?.sex}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getGenderReviewProps(review, figureId, 'sex')}
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
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            onChange={onReviewChange}
                            {...getAgeReviewProps(review, figureId, 'value')}
                        />
                    )}
                />
                {editMode && (
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
