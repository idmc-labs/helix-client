import React, { Dispatch, SetStateAction } from 'react';
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
import FigureTagMultiSelectInput, { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';

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
    onChange: (value: StateArg<PartialForm<AnalysisFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    trafficLightShown: boolean;
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
            <Row>
                <MarkdownEditor
                    name="calculationLogic"
                    label="Analysis and calculation logic *"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            className={styles.trafficLight}
                            name="calculationLogic"
                            value={review.calculationLogic?.value}
                            comment={review.calculationLogic?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <MarkdownEditor
                    name="caveats"
                    label="Caveats"
                    onChange={onValueChange}
                    value={value.caveats}
                    error={error?.fields?.caveats}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            className={styles.trafficLight}
                            name="caveats"
                            value={review.caveats?.value}
                            comment={review.caveats?.comment}
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
                    error={error?.fields?.tags?.$internal}
                    disabled={disabled || optionsDisabled}
                    readOnly={!editMode}
                    onOptionsChange={setTagOptions}
                />
            </Row>
        </>
    );
}

export default AnalysisInput;
