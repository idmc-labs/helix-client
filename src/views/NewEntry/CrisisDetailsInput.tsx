import React from 'react';
import {
    TextInput,
    Checkbox,
    MultiSelectInput,
    SelectInput,
} from '@togglecorp/toggle-ui';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

export interface CrisisDetailsFormProps {
    noCrisisAssociated: boolean;
    countries: string[];
    crisisType: string;
    crisis: string;
    crisisNarrative: string;
}

interface CrisisDetailsInputProps<K extends string> {
    name: K;
    value: CrisisDetailsFormProps;
    error: Error<CrisisDetailsFormProps> | undefined;
    onChange: (value: CrisisDetailsFormProps, name: K) => void;
}

function CrisisDetailsInput<K extends string>(props: CrisisDetailsInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
        countryOptions,
        crisisTypeOptions,
    } = props;

    const onValueChange = useFormObject<K, CrisisDetailsFormProps>(name, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <Checkbox
                    label="No Crisis associated"
                    name="noCrisisAssociated"
                    value={value.noCrisisAssociated}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <MultiSelectInput
                    options={countryOptions}
                    label="Country(ies) *"
                    className={styles.countryInput}
                    name="countries"
                    value={value.countries}
                    onChange={onValueChange}
                    keySelector={(d) => d.id}
                    labelSelector={(d) => d.name}
                />
                <SelectInput
                    options={crisisTypeOptions}
                    label="Crisis Type *"
                    className={styles.crisisTypeInput}
                    name="crisisType"
                    value={value.crisisType}
                    onChange={onValueChange}
                    keySelector={(d) => d.name}
                    labelSelector={(d) => d.description}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Select Crisis *"
                    className={styles.crisisInput}
                    name="crisis"
                    value={value.crisis}
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.crisisNarrativeInput}
                    placeholder="Crisis Narrative"
                    name="crisisNarrative"
                    value={value.crisisNarrative}
                    onChange={onValueChange}
                />
            </div>
        </>
    );
}

export default CrisisDetailsInput;
