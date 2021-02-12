import React, { useMemo } from 'react';
import {
    TextInput,
    Button,
    Switch,
    DateInput,
    TextArea,
} from '@togglecorp/toggle-ui';
import { isTruthyString, isDefined } from '@togglecorp/fujs';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/OrganizationMultiSelectInput';

import {
    PartialForm,
} from '#types';
import { useFormObject } from '#utils/form';
import type { Error } from '#utils/schema';
import {
    isValidUrl,
    listToMap,
} from '#utils/common';
import FileUploader from '#components/FileUploader';

import {
    DetailsFormProps,
    Attachment,
    SourcePreview,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';
import Row from '../Row';

import styles from './styles.css';

interface DetailsInputProps<K extends string> {
    name: K;
    value: PartialForm<DetailsFormProps> | undefined;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: PartialForm<DetailsFormProps>, name: K) => void;
    disabled?: boolean;
    sourcePreview?: SourcePreview;
    attachment?: Attachment;

    onUrlProcess: (value: string) => void;
    onAttachmentProcess: (value: File[]) => void;
    organizations: OrganizationOption[] | null | undefined;
    setOrganizations: React.Dispatch<React.SetStateAction<OrganizationOption[] | null | undefined>>;
    reviewMode?: boolean;
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
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
        sourcePreview,
        // attachmentProcessed,
        onUrlProcess,
        onAttachmentProcess,
        attachment,
        organizations,
        setOrganizations,
        reviewMode,
        review,
        onReviewChange,
    } = props;

    const onValueChange = useFormObject(name, value, onChange);
    const validUrl = !!value.url && isValidUrl(value.url);

    const attachmentProcessed = !!attachment;
    const urlProcessed = !!sourcePreview;
    const processed = attachmentProcessed || urlProcessed;
    const disabled = disabledFromProps || !processed;

    const handleProcessUrlButtonClick = React.useCallback(() => {
        if (value.url) {
            onUrlProcess(value.url);
        }
    }, [onUrlProcess, value.url]);

    const selectedSources = useMemo(
        () => {
            const mapping = listToMap(
                organizations ?? [],
                (item) => item.id,
                (item) => item,
            );
            return value.sources?.map((item) => mapping[item]).filter(isDefined);
        },
        [organizations, value?.sources],
    );

    const methodology = selectedSources
        ?.map((item) => item.methodology)
        .filter(isTruthyString)
        .join('\n\n');

    const breakdown = selectedSources
        ?.map((item) => item.breakdown)
        .filter(isTruthyString)
        .join('\n\n');

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                {!attachmentProcessed && (
                    <>
                        <TextInput
                            icons={reviewMode && review && (
                                <TrafficLightInput
                                    name="url"
                                    value={review.url?.value}
                                    onChange={onReviewChange}
                                />
                            )}
                            label="Url"
                            value={value.url}
                            onChange={onValueChange}
                            name="url"
                            error={error?.fields?.url}
                            disabled={disabledFromProps}
                            readOnly={urlProcessed || reviewMode}
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
                        {reviewMode && review && (
                            <TrafficLightInput
                                className={styles.trafficLight}
                                name="attachment"
                                value={review.attachment?.value}
                                onChange={onReviewChange}
                            />
                        )}
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
                            readOnly={urlProcessed || reviewMode}
                        >
                            {attachmentProcessed ? 'Re-upload Document' : 'or Upload a Document'}
                        </FileUploader>
                    </>
                )}
            </Row>
            <Row>
                { reviewMode && review && (
                    <TrafficLightInput
                        className={styles.trafficLight}
                        name="isConfidential"
                        value={review.isConfidential?.value}
                        onChange={onReviewChange}
                    />
                )}
                <Switch
                    label="Confidential Source"
                    onChange={onValueChange}
                    value={value.isConfidential}
                    name="isConfidential"
                    // error={error?.fields?.isConfidential}
                    disabled={disabled}
                    readOnly={reviewMode}
                />
            </Row>
            <Row>
                <TextInput
                    label="Article Title *"
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                    error={error?.fields?.articleTitle}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            name="articleTitle"
                            value={review.articleTitle?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <DateInput
                    label="Publication Date *"
                    onChange={onValueChange}
                    value={value.publishDate}
                    name="publishDate"
                    error={error?.fields?.publishDate}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            name="publishDate"
                            value={review.publishDate?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <OrganizationMultiSelectInput
                    label="Sources *"
                    onChange={onValueChange}
                    value={value.sources}
                    name="sources"
                    error={error?.fields?.sources}
                    disabled={disabled}
                    options={organizations}
                    onOptionsChange={setOrganizations}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            name="sources"
                            value={review.sources?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
                <OrganizationMultiSelectInput
                    label="Publishers *"
                    onChange={onValueChange}
                    name="publishers"
                    value={value.publishers}
                    error={error?.fields?.publishers}
                    disabled={disabled}
                    options={organizations}
                    onOptionsChange={setOrganizations}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            name="publishers"
                            value={review.publishers?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextArea
                    label="Source Excerpt"
                    onChange={onValueChange}
                    value={value.sourceExcerpt}
                    name="sourceExcerpt"
                    error={error?.fields?.sourceExcerpt}
                    disabled={disabled}
                    readOnly={reviewMode}
                    icons={reviewMode && review && (
                        <TrafficLightInput
                            name="sourceExcerpt"
                            value={review.sourceExcerpt?.value}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <TextArea
                    label="Source Methodology"
                    value={methodology ?? '-'}
                    name="sourceMethodology"
                    disabled={disabled}
                    readOnly
                />
            </Row>
            <Row>
                <TextArea
                    label="Source Breakdown and Reliability"
                    value={breakdown ?? '-'}
                    name="sourceBreakdown"
                    disabled={disabled}
                    readOnly
                />
            </Row>
        </>
    );
}

export default DetailsInput;
