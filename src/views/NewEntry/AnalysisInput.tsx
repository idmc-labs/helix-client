import React from 'react';
import {
    TextInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import type { AnalysisFormProps } from '#types';

import styles from './styles.css';

interface AnalysisInputProps<K extends string> {
    name: K;
    value: AnalysisFormProps;
    error: Error<AnalysisFormProps> | undefined;
    onChange: (value: AnalysisFormProps, name: K) => void;
}

function AnalysisInput<K extends string>(props: AnalysisInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
    } = props;

    const onValueChange = useFormObject<K, AnalysisFormProps>(name, value, onChange);

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
                    options={[]}
                    name="tags"
                    label="Tags"
                    onChange={onValueChange}
                    value={value.tags}
                    error={error?.fields?.tags}
                />
            </div>
        </>
    );
}

export default AnalysisInput;
