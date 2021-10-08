import React from 'react';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import Row from '#components/Row';

import MarkdownEditor from '#components/MarkdownEditor';
import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import {
    AnalysisFormProps,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';

import styles from './styles.css';

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<AnalysisFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    trafficLightShown: boolean;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
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
        mode,
        review,
        onReviewChange,
        trafficLightShown,
    } = props;

    const onValueChange = useFormObject(name, onChange, defaultValue);

    const reviewMode = mode === 'review';
    const editMode = mode === 'edit';

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                <MarkdownEditor
                    name="idmcAnalysis"
                    label="Trends and patterns of displacement to be highlighted"
                    onChange={onValueChange}
                    value={value.idmcAnalysis}
                    error={error?.fields?.idmcAnalysis}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            className={styles.trafficLight}
                            name="idmcAnalysis"
                            value={review.idmcAnalysis?.value}
                            comment={review.idmcAnalysis?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
        </>
    );
}

export default AnalysisInput;
