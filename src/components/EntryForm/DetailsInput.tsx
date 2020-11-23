import React, { useMemo } from 'react';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Button,
    Switch,
    DateInput,
    TextArea,
} from '@togglecorp/toggle-ui';
import {
    gql,
    useQuery,
} from '@apollo/client';

import NonFieldError from '#components/NonFieldError';
import SourceSelectInput from '#components/SourceSelectInput';

import { PartialForm } from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import {
    isValidUrl,
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';
import FileUploader from '#components/FileUploader';

import {
    OrganizationsForEntryFormQuery,
} from '#generated/types';

import { DetailsFormProps, Attachment } from './types';
import styles from './styles.css';

const ORGANIZATION_LIST = gql`
    query OrganizationsForEntryForm {
        organizationList {
            results {
                id
                name
                methodology
                breakdown
            }
        }
    }
`;

interface Organization {
    id: string;
    name?: string;
}

interface DetailsInputProps<K extends string> {
    name: K;
    value: PartialForm<DetailsFormProps> | undefined;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: PartialForm<DetailsFormProps>, name: K) => void;
    disabled?: boolean;
    urlProcessed: boolean;
    attachment?: Attachment;

    onUrlProcess: (value: string) => void;
    onAttachmentProcess: (value: File[]) => void;
    organizations: Organization[];
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
        // attachmentProcessed,
        onUrlProcess,
        onAttachmentProcess,
        organizations,
        attachment,
    } = props;

    const {
        data: organizationsData,
        loading: organizationsLoading,
    } = useQuery<OrganizationsForEntryFormQuery>(ORGANIZATION_LIST);
    const organizationList = organizationsData?.organizationList?.results;

    const onValueChange = useFormObject(name, value, onChange);
    const validUrl = !!value.url && isValidUrl(value.url);

    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;
    const disabled = disabledFromProps || !processed || organizationsLoading;

    const handleProcessUrlButtonClick = React.useCallback(() => {
        if (value.url) {
            onUrlProcess(value.url);
        }
    }, [onUrlProcess, value.url]);

    const selectedSource = useMemo(
        () => organizationList?.find((item) => item.id === value?.source),
        [organizationList, value?.source],
    );

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.row}>
                <Switch
                    label="Confidential Source"
                    onChange={onValueChange}
                    value={value.isConfidential}
                    name="isConfidential"
                    // error={error?.fields?.isConfidential}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                {!attachmentProcessed && (
                    <>
                        <TextInput
                            icons={<IoIosSearch />}
                            label="Url"
                            value={value.url}
                            onChange={onValueChange}
                            name="url"
                            error={error?.fields?.url}
                            disabled={disabledFromProps}
                            readOnly={urlProcessed}
                            actions={!urlProcessed && (
                                <Button
                                    name={undefined}
                                    onClick={handleProcessUrlButtonClick}
                                    disabled={disabledFromProps || !validUrl}
                                    transparent
                                    compact
                                >
                                    Process
                                </Button>
                            )}
                        />
                    </>
                )}
                {!urlProcessed && (
                    <>
                        {attachment && (
                            <a
                                href={attachment.attachment}
                                className={styles.fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                // TODO: get filename instead of url
                            >
                                {attachment.attachment}
                            </a>
                        )}
                        <FileUploader
                            className={styles.fileUploader}
                            onChange={onAttachmentProcess}
                            disabled={attachmentProcessed || disabledFromProps}
                            variant="primary"
                        >
                            {attachmentProcessed ? 'Re-upload Document' : 'or Upload a Document'}
                        </FileUploader>
                    </>
                )}
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
                {/*
                <SelectInput
                    label="Source *"
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                    disabled={disabled}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    options={organizationList}
                />
                <SelectInput
                    label="Publisher *"
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                    disabled={disabled}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    options={organizationList}
                />
                */}
                <SourceSelectInput
                    label="Source *"
                    onChange={onValueChange}
                    value={value.source}
                    name="source"
                    error={error?.fields?.source}
                    disabled={disabled}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    options={organizationList}
                />
                <SourceSelectInput
                    label="Publisher *"
                    onChange={onValueChange}
                    name="publisher"
                    value={value.publisher}
                    error={error?.fields?.publisher}
                    disabled={disabled}
                    keySelector={basicEntityKeySelector}
                    labelSelector={basicEntityLabelSelector}
                    options={organizationList}
                />
            </div>
            <div className={styles.twoColumnRow}>
                <DateInput
                    label="Publication Date *"
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextArea
                    label="Source Excerpt"
                    onChange={onValueChange}
                    value={value.sourceExcerpt}
                    name="sourceExcerpt"
                    error={error?.fields?.sourceExcerpt}
                    disabled={disabled}
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Methodology"
                    value={selectedSource?.methodology ?? '-'}
                    name="sourceMethodology"
                    disabled={disabled}
                    readOnly
                />
            </div>
            <div className={styles.row}>
                <TextInput
                    label="Source Breakdown and Reliability"
                    value={selectedSource?.breakdown ?? '-'}
                    name="sourceBreakdown"
                    disabled={disabled}
                    readOnly
                />
            </div>
        </>
    );
}

export default DetailsInput;
