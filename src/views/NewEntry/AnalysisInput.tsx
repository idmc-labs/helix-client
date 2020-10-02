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
    AnalysisFormProps,
    BasicEntity,
    PartialForm,
} from '#types';

import styles from './styles.css';

const options: BasicEntity[] = [];

interface AnalysisInputProps<K extends string> {
    name: K;
    value: PartialForm<AnalysisFormProps> | undefined;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: PartialForm<AnalysisFormProps>, name: K) => void;
}

const defaultValue: PartialForm<AnalysisFormProps> = {
};

function AnalysisInput<K extends string>(props: AnalysisInputProps<K>) {
    const {
        name,
        value = defaultValue,
        onChange,
        error,
    } = props;

    const onValueChange = useFormObject(name, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <TextInput
                    name="idmcAnalysis"
                    label="IDMC Analysis"
                    onChange={onValueChange}
                    value={value.idmcAnalysis}
                    error={error?.fields?.idmcAnalysis}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    name="methodology"
                    label="Methodology"
                    onChange={onValueChange}
                    value={value.methodology}
                    error={error?.fields?.methodology}
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
                />
            </div>
        </>
    );
}

export default AnalysisInput;
