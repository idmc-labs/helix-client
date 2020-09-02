import React from 'react';
import {
    TextInput,
    MultiSelectInput,
} from '@togglecorp/toggle-ui';

import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

export interface AnalysisFormProps {
    idmcAnalysis: string;
    methodology: string;
    caveats: string;
    saveTo: string;
    tags: string[];
}

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
                    label="IDMC Analysic"
                    className={styles.idmcAnalysisInput}
                    name="idmcAnalysis"
                    value={value.idmcAnalysis}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Methodology"
                    className={styles.methodologyInput}
                    name="methodology"
                    value={value.methodology}
                    onChange={onValueChange}
                />
                <TextInput
                    label="Caveats"
                    className={styles.caveatsInput}
                    name="caveats"
                    value={value.caveats}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Save to Existing Query"
                    className={styles.saveToInput}
                    name="saveTo"
                    value={value.saveTo}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <MultiSelectInput
                    label="Tags"
                    className={styles.tagsInput}
                    name="tags"
                    value={value.tags}
                    onChange={onValueChange}
                />
            </div>
        </>
    );
}

export default AnalysisInput;
