import React from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    SelectInput,
    TextInput,
} from '@togglecorp/toggle-ui';

import {
    BasicEntity,
    DetailsFormProps,
} from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import styles from './styles.css';

interface DetailsInputProps<K extends string> {
    name: K;
    value: DetailsFormProps;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: DetailsFormProps, name: K) => void;
    eventOptions: BasicEntity[];
}

function DetailsInput<K extends string>(props: DetailsInputProps<K>) {
    const {
        name,
        value,
        onChange,
        error,
        eventOptions,
    } = props;

    const onValueChange = useFormObject<K, DetailsFormProps>(name, value, onChange);

    return (
        <>
            <div className={styles.row}>
                <SelectInput
                    label="Event *"
                    name="event"
                    options={eventOptions}
                    value={value.event}
                    error={error?.fields?.event}
                    onChange={onValueChange}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    icons={<IoIosSearch />}
                    label="Url"
                    value={value.url}
                    onChange={onValueChange}
                    name="url"
                    error={error?.fields?.url}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Article Title *"
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Source*"
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                />
                <TextInput
                    label="Publisher*"
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <TextInput
                    label="Publication Date*"
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Methodology"
                    onChange={onValueChange}
                    value={value.sourceMethodology}
                    name="sourceMethodology"
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Excerpt Methodology"
                    onChange={onValueChange}
                    value={value.excerptMethodology}
                    name="excerptMethodology"
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Breakdown and Reliability"
                    onChange={onValueChange}
                    value={value.sourceBreakdown}
                    name="sourceBreakdown"
                />
            </div>
        </>
    );
}

export default DetailsInput;
