import React, { useMemo } from 'react';
import {
    TextInput,
    Button,
    Switch,
    DateInput,
    Modal,
} from '@togglecorp/toggle-ui';
import { isTruthyString, isDefined } from '@togglecorp/fujs';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';

import MarkdownEditor from '#components/MarkdownEditor';
import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import Row from '#components/Row';

import {
    isValidUrl,
    listToMap,
} from '#utils/common';
import FileUploader from '#components/FileUploader';
import InfoIcon from '#components/InfoIcon';
import OrganizationForm from '#views/Organizations/OrganizationTable/OrganizationForm';

import useModalState from '#hooks/useModalState';
import {
    DetailsFormProps,
    Attachment,
    SourcePreview,
    ReviewInputFields,
    EntryReviewStatus,
} from '../types';

import styles from './styles.css';

function getNameFromUrl(item: string | undefined) {
    if (!item) {
        return undefined;
    }
    const match = item.match(/\/([^/]+)$/);
    if (!match) {
        return undefined;
    }
    const [fullUrl, firstMatch] = match;
    return firstMatch ?? fullUrl;
}

interface DetailsInputProps<K extends string> {
    name: K;
    value: PartialForm<DetailsFormProps> | undefined;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<DetailsFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    sourcePreview?: SourcePreview;
    attachment?: Attachment;

    entryId: string | undefined;
    onUrlProcess: (value: string) => void;
    onRemoveUrl: () => void;
    onRemoveAttachment: () => void;
    onAttachmentProcess: (value: File[]) => void;
    organizations: OrganizationOption[] | null | undefined;
    setOrganizations: React.Dispatch<React.SetStateAction<OrganizationOption[] | null | undefined>>;
    mode: 'view' | 'review' | 'edit';
    review?: ReviewInputFields;
    onReviewChange?: (newValue: EntryReviewStatus, name: string) => void;
    trafficLightShown: boolean;
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
        entryId,
        onRemoveUrl,
        onRemoveAttachment,
        onUrlProcess,
        onAttachmentProcess,
        attachment,
        organizations,
        setOrganizations,
        mode,
        review,
        onReviewChange,
        trafficLightShown,
    } = props;

    const reviewMode = mode === 'review';
    const editMode = mode === 'edit';

    const onValueChange = useFormObject(name, onChange, defaultValue);
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

    const [
        shouldShowAddOrganizationModal,
        editableOrganizationId,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

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
                            icons={trafficLightShown && review && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    name="url"
                                    value={review.url?.value}
                                    comment={review.url?.comment}
                                    onChange={onReviewChange}
                                />
                            )}
                            label="Url"
                            value={value.url}
                            onChange={onValueChange}
                            name="url"
                            error={error?.fields?.url}
                            disabled={disabledFromProps}
                            readOnly={urlProcessed || !editMode}
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
                        {urlProcessed && !entryId && (
                            <Button
                                className={styles.removalButtons}
                                name={undefined}
                                onClick={onRemoveUrl}
                            >
                                Clear URL
                            </Button>
                        )}
                    </>
                )}

                {!urlProcessed && (
                    <>
                        {trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                className={styles.trafficLight}
                                name="attachment"
                                value={review.attachment?.value}
                                comment={review.attachment?.comment}
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
                                {getNameFromUrl(attachment.attachment)}
                            </a>
                        )}
                        {!attachmentProcessed && (
                            <FileUploader
                                className={styles.fileUploader}
                                onChange={onAttachmentProcess}
                                disabled={attachmentProcessed || disabledFromProps}
                                variant="primary"
                                readOnly={urlProcessed || !editMode}
                            >
                                or Upload a Document
                            </FileUploader>
                        )}
                        {attachmentProcessed && !entryId && (
                            <Button
                                className={styles.removalButtons}
                                name={undefined}
                                onClick={onRemoveAttachment}
                            >
                                Clear Attachment
                            </Button>
                        )}
                    </>
                )}
            </Row>
            {attachmentProcessed && (
                <Row>
                    <TextInput
                        icons={trafficLightShown && review && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                name="documentUrl"
                                value={review.documentUrl?.value}
                                comment={review.documentUrl?.comment}
                                onChange={onReviewChange}
                            />
                        )}
                        label="Document Url"
                        value={value.documentUrl}
                        onChange={onValueChange}
                        name="documentUrl"
                        error={error?.fields?.documentUrl}
                        disabled={disabledFromProps}
                        readOnly={!editMode}
                    />
                </Row>
            )}
            <Row>
                <Switch
                    label="Confidential Source"
                    onChange={onValueChange}
                    value={value.isConfidential}
                    name="isConfidential"
                    // error={error?.fields?.isConfidential}
                    disabled={disabled}
                    readOnly={!editMode}
                />
            </Row>
            <Row>
                <TextInput
                    label="Entry Title *"
                    onChange={onValueChange}
                    value={value.articleTitle}
                    name="articleTitle"
                    error={error?.fields?.articleTitle}
                    disabled={disabled}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="articleTitle"
                            value={review.articleTitle?.value}
                            comment={review.articleTitle?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                    actions={(
                        <InfoIcon
                            tooltip="Publisher's Acronym: Title (Country/ies abbreviation) - (T) - Date of publication DD/MM/YYYY"
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
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="publishDate"
                            value={review.publishDate?.value}
                            comment={review.publishDate?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                />
            </Row>
            <Row>
                <OrganizationMultiSelectInput
                    label="Sources"
                    onChange={onValueChange}
                    value={value.sources}
                    name="sources"
                    error={error?.fields?.sources?.$internal}
                    disabled={disabled}
                    options={organizations}
                    onOptionsChange={setOrganizations}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="sources"
                            value={review.sources?.value}
                            comment={review.publishDate?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                    editChipModal={showAddOrganizationModal}
                    editableChip
                />
                <OrganizationMultiSelectInput
                    label="Publishers"
                    onChange={onValueChange}
                    name="publishers"
                    value={value.publishers}
                    error={error?.fields?.publishers?.$internal}
                    disabled={disabled}
                    options={organizations}
                    onOptionsChange={setOrganizations}
                    readOnly={!editMode}
                    icons={trafficLightShown && review && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="publishers"
                            value={review.publishers?.value}
                            comment={review.publishDate?.comment}
                            onChange={onReviewChange}
                        />
                    )}
                    editChipModal={showAddOrganizationModal}
                    editableChip
                />
            </Row>
            <Row>
                <MarkdownEditor
                    label="Source Methodology"
                    value={methodology}
                    name="sourceMethodology"
                    disabled={disabled}
                    readOnly
                />
            </Row>
            <Row>
                <MarkdownEditor
                    label="Source Breakdown and Reliability"
                    value={breakdown}
                    name="sourceBreakdown"
                    disabled={disabled}
                    readOnly
                />
            </Row>
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={hideAddOrganizationModal}
                    heading="Edit Organization"
                >
                    <OrganizationForm
                        id={editableOrganizationId}
                        onHideAddOrganizationModal={hideAddOrganizationModal}
                    />
                </Modal>
            )}
        </>
    );
}

export default DetailsInput;
