import React, { useCallback } from 'react';
import {
    TextInput,
    Button,
    Switch,
    DateInput,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    PartialForm,
    useFormObject,
    Error,
    StateArg,
} from '@togglecorp/toggle-form';
import { IoCalculatorOutline } from 'react-icons/io5';

import NonFieldError from '#components/NonFieldError';
import TrafficLightInput from '#components/TrafficLightInput';
import OrganizationMultiSelectInput, { OrganizationOption } from '#components/selections/OrganizationMultiSelectInput';
import Row from '#components/Row';

import {
    isValidUrl,
    formatDateYmd,
} from '#utils/common';
import FileUploader from '#components/FileUploader';
import OrganizationForm from '#views/Organizations/OrganizationTable/OrganizationForm';

import useModalState from '#hooks/useModalState';
import {
    DetailsFormProps,
    Attachment,
    SourcePreview,
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

function generateEntryTitle(
    titleInfo?: string | undefined,
    publisherInfo?: string | undefined | null,
    startDateInfo?: string | undefined,
) {
    const publisherField = publisherInfo ?? 'Name of publisher';
    const titleField = titleInfo ?? 'Title of document - (T)';
    const startDateField = startDateInfo ?? 'DD/MM/YYYY of publication';

    return `${publisherField}: ${titleField} - ${startDateField}`;
}

interface DetailsInputProps<K extends string> {
    name: K;
    value: PartialForm<DetailsFormProps> | undefined;
    error: Error<DetailsFormProps> | undefined;
    onChange: (value: StateArg<PartialForm<DetailsFormProps> | undefined>, name: K) => void;
    disabled?: boolean;
    sourcePreview?: SourcePreview;
    attachment?: Attachment;

    // entryId: string | undefined;
    onUrlProcess: (value: string) => void;
    onRemoveUrl: () => void;
    onRemoveAttachment: () => void;
    onAttachmentProcess: (value: File[]) => void;
    organizations: OrganizationOption[] | null | undefined;
    setOrganizations: React.Dispatch<React.SetStateAction<OrganizationOption[] | null | undefined>>;
    mode: 'view' | 'edit';
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
        // entryId,
        onRemoveUrl,
        onRemoveAttachment,
        onUrlProcess,
        onAttachmentProcess,
        attachment,
        organizations,
        setOrganizations,
        mode,
        trafficLightShown,
    } = props;

    const editMode = mode === 'edit';
    const reviewMode = !editMode;

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

    const [
        shouldShowAddOrganizationModal,
        editableOrganizationId,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

    const handleEntryTitleGenerate = useCallback(() => {
        const titleText = undefined;
        const startDateInfo = formatDateYmd(value.publishDate);
        const publisherText = organizations
            ?.filter((org) => value?.publishers?.includes(org.id))
            .map((pub) => pub.name).join(', ');

        const entryTitleText = generateEntryTitle(
            titleText,
            publisherText,
            startDateInfo,
        );
        onValueChange(entryTitleText, 'articleTitle' as const);
    }, [
        onValueChange,
        value?.publishDate,
        organizations,
        value?.publishers,
    ]);

    return (
        <>
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <Row>
                {!attachmentProcessed && (
                    <>
                        <TextInput
                            icons={trafficLightShown && (
                                <TrafficLightInput
                                    disabled={!reviewMode}
                                    name="url"
                                />
                            )}
                            label="Url"
                            value={value.url}
                            onChange={onValueChange}
                            name="url"
                            error={error?.fields?.url}
                            disabled={disabledFromProps}
                            readOnly={urlProcessed || !editMode}
                            autoFocus
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
                        {urlProcessed && editMode && (
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
                        {trafficLightShown && (
                            <TrafficLightInput
                                disabled={!reviewMode}
                                className={styles.trafficLight}
                                name="attachment"
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
                        {attachmentProcessed && editMode && (
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
                <TextInput
                    icons={trafficLightShown && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="documentUrl"
                        />
                    )}
                    label="Document Url"
                    value={value.documentUrl}
                    onChange={onValueChange}
                    name="documentUrl"
                    error={error?.fields?.documentUrl}
                    disabled={disabledFromProps}
                    readOnly={!editMode}
                    autoFocus
                />
            )}
            <Switch
                label="Confidential Source"
                onChange={onValueChange}
                value={value.isConfidential}
                name="isConfidential"
                // error={error?.fields?.isConfidential}
                disabled={disabled}
                readOnly={!editMode}
            />
            <TextInput
                label="Entry Title *"
                onChange={onValueChange}
                value={value.articleTitle}
                name="articleTitle"
                error={error?.fields?.articleTitle}
                disabled={disabled}
                readOnly={!editMode}
                icons={trafficLightShown && (
                    <TrafficLightInput
                        disabled={!reviewMode}
                        name="articleTitle"
                    />
                )}
                hint={generateEntryTitle()}
                actions={!trafficLightShown && (
                    <Button
                        name={undefined}
                        onClick={handleEntryTitleGenerate}
                        transparent
                        title="Generate Title"
                        disabled={disabled}
                    >
                        <IoCalculatorOutline />
                    </Button>
                )}
            />
            <DateInput
                label="Publication Date *"
                onChange={onValueChange}
                value={value.publishDate}
                name="publishDate"
                error={error?.fields?.publishDate}
                disabled={disabled}
                readOnly={!editMode}
                icons={trafficLightShown && (
                    <TrafficLightInput
                        disabled={!reviewMode}
                        name="publishDate"
                    />
                )}
            />
            <Row>
                <OrganizationMultiSelectInput
                    label="Publishers *"
                    onChange={onValueChange}
                    name="publishers"
                    value={value.publishers}
                    error={error?.fields?.publishers?.$internal}
                    disabled={disabled}
                    options={organizations}
                    onOptionsChange={setOrganizations}
                    readOnly={!editMode}
                    icons={trafficLightShown && (
                        <TrafficLightInput
                            disabled={!reviewMode}
                            name="publishers"
                        />
                    )}
                    onOptionEdit={showAddOrganizationModal}
                    optionEditable={editMode}
                    chip
                />
            </Row>
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={hideAddOrganizationModal}
                    heading="Edit Organization"
                    size="large"
                    freeHeight
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
