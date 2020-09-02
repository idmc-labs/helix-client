import React, { useCallback } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { _cs } from '@togglecorp/fujs';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import SourceDetails, { SourceDetailsFormProps } from './SourceDetails';
import CrisisDetails from './CrisisDetails';
import Review from './Review';

import PageHeader from '#components/PageHeader';
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
    description: string;
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

interface FactorInputProps {
    index: number;
    value: Factor;
    error: Error<Factor> | undefined;
    onChange: (value: Factor, index: number) => void;
    onRemove: (index: number) => void;
    className?: string;
}

function FactorInput(props: FactorInputProps) {
    const {
        value,
        onChange,
        onRemove,
        error,
        index,
        className,
    } = props;

    const onValueChange = useFormObject<number, Factor>(index, value, onChange);

    const handleRemove = useCallback(
        () => {
            onRemove(index);
        },
        [onRemove, index],
    );

    return (
        <div className={_cs(className, styles.factor)}>
            <div className={styles.actions}>
                <Button
                    className={styles.deleteButton}
                    onClick={handleRemove}
                    transparent
                    variant="danger"
                    title="Remove"
                    icons={(
                        <FiMinus />
                    )}
                >
                    Remove
                </Button>
            </div>
            <div className={styles.input}>
                <TextInput
                    label="Name"
                    name="name"
                    value={value.name}
                    onChange={onValueChange}
                    error={error?.fields?.name}
                />
                <TextInput
                    label="Description"
                    name="description"
                    value={value.description}
                    onChange={onValueChange}
                    error={error?.fields?.description}
                />
            </div>
        </div>
    );
}

const defaultMetaValue: Meta = {
    dateCreated: '',
    datePublished: '',
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

const initialFormValues: FormValues = {
    email: '',
    meta: defaultMetaValue,
    factors: [
        { id: 12, name: 'hari', description: 'hari is a good boy' },
        { id: 13, name: 'shyam', description: '' },
    ],
};

interface ExampleProps {
    className?: string;
}

function ExampleForm(props: ExampleProps) {
    const { className } = props;

    const handleSubmit = (finalValue: FormValues) => {
        console.warn('Success', finalValue);
    };

    const {
        value,
        error,
        onValueChange,
        onSubmit,
    } = useForm(initialFormValues, schema, handleSubmit);

    const {
        onValueChange: onFactorChange,
        onValueRemove: onFactorRemove,
    } = useFormArray('factors', value.factors, onValueChange);

    const handleFactorAdd = () => {
        const id = new Date().getTime();
        const newFactor = { id, name: '', description: '' };
        onValueChange(
            [...value.factors, newFactor],
            'factors',
        );
    };

    return (
        <form
            className={_cs(className, styles.newEntryFormOld)}
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
            <div className={styles.factorContainer}>
                <h3 className={styles.header}>
                    Factors
                </h3>
                <Button
                    className={styles.addButton}
                    variant="primary"
                    transparent
                    onClick={handleFactorAdd}
                    title="Add"
                    icons={(
                        <FiPlus />
                    )}
                >
                    Add
                </Button>
            </div>
            <div>
                {value.factors.map((factor, index) => (
                    <FactorInput
                        key={factor.id}
                        index={index}
                        value={factor}
                        onChange={onFactorChange}
                        onRemove={onFactorRemove}
                        error={error?.fields?.factors?.members?.[factor.id]}
                    />
                ))}
            </div>
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
    );
}

export default ExampleForm;
