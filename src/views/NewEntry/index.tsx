import React from 'react';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import useForm, { useFormObject, useFormArray } from '#utils/form';
import type { Schema, Error } from '#utils/schema';
import {
    requiredStringCondition,
    emailCondition,
} from '#utils/validation';

import styles from './styles.css';

interface Meta {
    dateCreated: string;
    datePublished: string;
}

interface Factor {
    id: number;
    name: string;
}

interface FormValues {
    email: string;
    // meta?: Meta;
    meta: Meta;

    factors: Factor[];
}

const schema: Schema<FormValues> = {
    fields: {
        email: [requiredStringCondition, emailCondition],
        meta: {
            fields: {
                dateCreated: [requiredStringCondition],
                datePublished: [],
            },
        },
        factors: {
            keySelector: (factor) => factor.id,
            member: {
                fields: {
                    name: [requiredStringCondition],
                },
            },
        },
    },
};

interface MetaInputProps<K extends string> {
    name: K;
    value: Meta;
    error: Error<Meta> | undefined;
    onChange: (value: Meta, name: K) => void;
}

function MetaInput<K extends string>(props: MetaInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
    } = props;

    const onValueChange = useFormObject<K, Meta>(name, value, onChange);

    return (
        <div>
            <TextInput
                label="Date Created"
                name="dateCreated"
                value={value.dateCreated}
                onChange={onValueChange}
                error={error?.fields?.dateCreated}
            />
            <TextInput
                label="Date Published"
                name="datePublished"
                value={value.datePublished}
                onChange={onValueChange}
                error={error?.fields?.datePublished}
            />
        </div>
    );
}

interface FactorInputProps {
    index: number;
    value: Factor;
    error: Error<Factor> | undefined;
    onChange: (value: Factor, index: number) => void;
}

function FactorInput(props: FactorInputProps) {
    const {
        value,
        onChange,
        error,
        index,
    } = props;

    const onValueChange = useFormObject<number, Factor>(index, value, onChange);

    return (
        <div>
            <TextInput
                label="Name"
                name="name"
                value={value.name}
                onChange={onValueChange}
                error={error?.fields?.name}
            />
        </div>
    );
}

const defaultMetaValue: Meta = {
    dateCreated: '',
    datePublished: '',
};
const initialFormValues: FormValues = {
    email: '',
    meta: defaultMetaValue,
    factors: [
        { id: 12, name: 'hari' },
        { id: 13, name: 'shyam' },
    ],
};

function NewEntry() {
    const handleSubmit = (finalValue: FormValues) => {
        console.warn('Success', finalValue);
    };

    const {
        value,
        error,
        onValueChange,
        onSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    const onFactorsChange = useFormArray('factors', value.factors, onValueChange);

    return (
        <div className={styles.newEntry}>
            <div className={styles.newEntryFormContainer}>
                <h2 className={styles.header}>
                    Helix
                </h2>
                <form
                    className={styles.newEntryForm}
                    onSubmit={onSubmit}
                >
                    {error?.$internal && (
                        <p>
                            {error?.$internal}
                        </p>
                    )}
                    <TextInput
                        label="Email"
                        name="email"
                        value={value.email}
                        onChange={onValueChange}
                        error={error?.fields?.email}
                    />
                    <MetaInput
                        name="meta"
                        value={value.meta}
                        onChange={onValueChange}
                        error={error?.fields?.meta}
                    />
                    {value.factors.map((factor, index) => (
                        <FactorInput
                            key={factor.id}
                            index={index}
                            value={factor}
                            onChange={onFactorsChange}
                            error={error?.fields?.factors?.members?.[factor.id]}
                        />
                    ))}
                    <div className={styles.actionButtons}>
                        <div />
                        <Button
                            variant="primary"
                            type="submit"
                        >
                            Create Entry
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewEntry;
