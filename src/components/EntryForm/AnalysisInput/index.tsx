import React from 'react';
import {
    TextInput,
    MultiSelectInput,
    TextArea,
} from '@togglecorp/toggle-ui';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import type {
    BasicEntity,
    PartialForm,
    ReviewInputFields,
} from '#types';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import Row from '../Row';
import { AnalysisFormProps } from '../types';

import styles from './styles.css';

const options: BasicEntity[] = [];

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: PartialForm<AnalysisFormProps>, name: K) => void;
    disabled?: boolean;
    reviewMode?: boolean;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: string, name: string) => void;
}

const defaultValue: PartialForm<AnalysisFormProps> = {
};

function AnalysisInput<K extends string>(props: AnalysisInputProps<K>) {
    const {
        name,
        value = defaultValue,
        onChange,
        error,
        disabled,
        reviewMode,
        review,
        onReviewChange,
    } = props;

    const onValueChange = useFormObject(name, value, onChange);

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <TextArea
                    name="idmcAnalysis"
                    label="IDMC Analysis *"
                    onChange={onValueChange}
                    value={value.idmcAnalysis}
                    error={error?.fields?.idmcAnalysis}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="idmcAnalysis"
                            value={review.idmcAnalysis}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextInput
                    name="calculationLogic"
                    label="Calculation Logic"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="calculationLogic"
                            value={review.calculationLogic}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextInput
                    name="caveats"
                    label="Caveats"
                    onChange={onValueChange}
                    value={value.caveats}
                    error={error?.fields?.caveats}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="caveats"
                            value={review.caveats}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <MultiSelectInput
                    options={options}
                    name="tags"
                    label="Tags"
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    onChange={onValueChange}
                    value={value.tags}
                    error={error?.fields?.tags}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="tags"
                            value={review.tags}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
        </>
    );
}

export default AnalysisInput;
