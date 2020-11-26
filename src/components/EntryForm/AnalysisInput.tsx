import React from 'react';
import {
    TextInput,
    MultiSelectInput,
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
} from '#types';

import NonFieldError from '#components/NonFieldError';

import { AnalysisFormProps } from './types';
import styles from './styles.css';

const options: BasicEntity[] = [];

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: PartialForm<AnalysisFormProps>, name: K) => void;
    disabled?: boolean;
    reviewMode?: boolean;
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
    } = props;

    const onValueChange = useFormObject(name, value, onChange);

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <TextInput
                    name="idmcAnalysis"
                    label="IDMC Analysis *"
                    onChange={onValueChange}
                    value={value.idmcAnalysis}
                    error={error?.fields?.idmcAnalysis}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    name="calculationLogic"
                    label="Calculation Logic"
                    onChange={onValueChange}
                    value={value.calculationLogic}
                    error={error?.fields?.calculationLogic}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    name="caveats"
                    label="Caveats"
                    onChange={onValueChange}
                    value={value.caveats}
                    error={error?.fields?.caveats}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </div>
            <div className={styles.row}>
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
                />
            </div>
        </>
    );
}

export default AnalysisInput;
