import React from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Button,
} from '@togglecorp/toggle-ui';

import { DetailsFormProps, PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import { urlCondition } from '#utils/validation';

import styles from './styles.css';

interface DetailsInputProps<K extends string> {
    name: K;
    value: PartialForm<DetailsFormProps> | undefined;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: PartialForm<DetailsFormProps>, name: K) => void;
    disabled?: boolean;
    setUrlProcessed: (processed: boolean) => void;
    urlProcessed: boolean;
}

const defaultValue: PartialForm<DetailsFormProps> = {
};

function DetailsInput<K extends string>(props: DetailsInputProps<K>) {
    const {
        name,
        value = defaultValue,
        onChange,
        error,
        disabled: disabledFromProps,
        urlProcessed,
        setUrlProcessed,
    } = props;

    const onValueChange = useFormObject(name, value, onChange);
    const isValidUrl = value.url && !urlCondition(value.url);

    const disabled = disabledFromProps || !urlProcessed;
    const handleProcessUrlButtonClick = React.useCallback(() => {
        setUrlProcessed(true);
    }, [setUrlProcessed]);

    return (
        <>
            {error?.$internal && (
                <p>
                    {error?.$internal}
                </p>
            )}
            <div className={styles.row}>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Url"
                    value={value.url}
                    onChange={onValueChange}
                    name="url"
                    error={error?.fields?.url}
                    disabled={disabledFromProps || urlProcessed}
                />
                <Button
                    name={undefined}
                    onClick={handleProcessUrlButtonClick}
                    className={styles.processUrlButton}
                    disabled={disabledFromProps || !isValidUrl || urlProcessed}
                >
                    Process Url
                </Button>
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Article Title *"
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                    error={error?.fields?.articleTitle}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Source*"
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                    disabled={disabled}
                />
                <TextInput
                    label="Publisher*"
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                    disabled={disabled}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Publication Date*"
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Methodology"
                    onChange={onValueChange}
                    value={value.sourceMethodology}
                    name="sourceMethodology"
                    error={error?.fields?.sourceMethodology}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Excerpt Methodology"
                    onChange={onValueChange}
                    value={value.excerptMethodology}
                    name="excerptMethodology"
                    error={error?.fields?.excerptMethodology}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Breakdown and Reliability"
                    onChange={onValueChange}
                    value={value.sourceBreakdown}
                    name="sourceBreakdown"
                    error={error?.fields?.sourceBreakdown}
                    disabled={disabled}
                />
            </div>
        </>
    );
}

export default DetailsInput;
