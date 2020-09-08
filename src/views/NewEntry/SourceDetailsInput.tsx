import React from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Button,
    Checkbox,
} from '@togglecorp/toggle-ui';

import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';

import styles from './styles.css';

export interface SourceDetailsFormProps {
    confidential: boolean;
    url: string;
    articleTitle: string;
    source: string;
    publisher: string;
    publishDate: string;
    sourceMethodology: string;
    sourceExcerpt: string;
    excerptMethodology: string;
    sourceBreakdown: string;
}

interface SourceDetailsInputProps<K extends string> {
    name: K;
    value: SourceDetailsFormProps;
    error: Error<SourceDetailsFormProps> | undefined;
    onChange: (value: SourceDetailsFormProps, name: K) => void;
}

function SourceDetailsInput<K extends string>(props: SourceDetailsInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
    } = props;

    const onValueChange = useFormObject<K, SourceDetailsFormProps>(name, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <Checkbox
                    name="confidential"
                    value={value.confidential}
                    label="Confidentail source"
                    onChange={onValueChange}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    icons={<IoIosSearch />}
                    className={styles.entryUrlInput}
                    value={value.url}
                    onChange={onValueChange}
                    name="url"
                    error={error?.fields?.url}
                />
                <Button className={styles.uploadDocumentButton}>
                    Or, upload a document
                </Button>
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Article Title"
                    className={styles.articleTitleInput}
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source*"
                    className={styles.sourceInput}
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                />
                <TextInput
                    label="Publisher*"
                    className={styles.publisherInput}
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                />
                <TextInput
                    label="Publication Date*"
                    className={styles.publicationDateInput}
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.sourceMethodology}
                    label="Source Methodology"
                    onChange={onValueChange}
                    value={value.sourceMethodology}
                    name="sourceMethodology"
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.excerptMethodology}
                    label="Excerpt Methodology"
                    onChange={onValueChange}
                    value={value.excerptMethodology}
                    name="excerptMethodology"
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    className={styles.sourceBreakdown}
                    label="Source Breakdown and Reliability"
                    onChange={onValueChange}
                    value={value.sourceBreakdown}
                    name="sourceBreakdown"
                />
            </div>
        </>
    );
}

export default SourceDetailsInput;
