import React from 'react';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import MarkdownEditor from '#components/MarkdownEditor';
import NonFieldError from '#components/NonFieldError';

import {
    AnalysisFormProps,
} from '../types';

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<AnalysisFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    mode: 'view' | 'edit';
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
    } = props;

    const onValueChange = useFormObject(name, onChange, defaultValue);

    const editMode = mode === 'edit';

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
            />
        </>
    );
}

export default AnalysisInput;
