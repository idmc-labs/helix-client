import React, { Dispatch, SetStateAction } from 'react';
import {
    TextArea,
} from '@togglecorp/toggle-ui';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import type {
    PartialForm,
} from '#types';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/FigureTagMultiSelectInput';

import Row from '../Row';
import {
    AnalysisFormProps,
    ReviewInputFields,
    EntryReviewStatus,
    TagOptions,
} from '../types';

import styles from './styles.css';

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: PartialForm<AnalysisFormProps>, name: K) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;

    tagOptions: TagOptions;
    setTagOptions: Dispatch<SetStateAction<FigureTagOption[] | null | undefined>>;
    optionsDisabled: boolean;
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
        tagOptions,
        setTagOptions,
        optionsDisabled,
    } = props;

    const onValueChange = useFormObject(name, value, onChange);

    const reviewMode = mode === 'review';
    const editMode = mode === 'edit';

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
                    readOnly={!editMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="idmcAnalysis"
                            value={review.idmcAnalysis?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextArea
                    name="calculationLogic"
                    label="Calculation Logic"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="calculationLogic"
                            value={review.calculationLogic?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextArea
                    name="caveats"
                    label="Caveats"
                    onChange={onValueChange}
                    value={value.caveats}
                    error={error?.fields?.caveats}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="caveats"
                            value={review.caveats?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <FigureTagMultiSelectInput
                    options={tagOptions}
                    name="tags"
                    label="Tags"
                    onChange={onValueChange}
                    value={value.tags}
                    error={error?.fields?.tags}
                    disabled={disabled || optionsDisabled}
                    readOnly={!editMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            className={styles.trafficLight}
                            name="tags"
                            value={review.tags?.value}
                            onChange={onReviewChange}
                        />
                    )}
                    onOptionsChange={setTagOptions}
                />
            </Row>
        </>
    );
}

export default AnalysisInput;
