import React from 'react';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import MarkdownEditor from '#components/MarkdownEditor';
import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';

import {
    AnalysisFormProps,
} from '../types';

import styles from './styles.css';

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<AnalysisFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    mode: 'view' | 'edit';
    trafficLightShown: boolean;
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
        trafficLightShown,
    } = props;

    const onValueChange = useFormObject(name, onChange, defaultValue);

    const editMode = mode === 'edit';
    const reviewMode = !editMode;

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <MarkdownEditor
                name="idmcAnalysis"
                label="Trends and patterns of displacement to be highlighted"
                onChange={onValueChange}
                value={value.idmcAnalysis}
                error={error?.fields?.idmcAnalysis}
                disabled={disabled}
                readOnly={!editMode}
                icons={trafficLightShown && (
                    <TrafficLightInput
                        disabled={!reviewMode}
                        className={styles.trafficLight}
                        name="idmcAnalysis"
                    />
                )}
            />
        </>
    );
}

export default AnalysisInput;
