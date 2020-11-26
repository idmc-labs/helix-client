import React, { useEffect, useCallback, useState } from 'react';
import { Prompt, Redirect } from 'react-router-dom';
import {
    _cs,
    unique,
} from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    SelectInput,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    useMutation,
    useQuery,
} from '@apollo/client';

import { removeNull, analyzeErrors } from '#utils/schema';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import Section from '#components/Section';
import EventForm from '#components/EventForm';
import { OrganizationOption } from '#components/SourceSelectInput';

import useForm, { useFormArray, createSubmitHandler } from '#utils/form';

import { transformToFormError } from '#utils/errorTransform';
import type { Schema, Error } from '#utils/schema';
import useModalState from '#hooks/useModalState';
import {
    requiredStringCondition,
    requiredCondition,
    urlCondition,
    idCondition,
} from '#utils/validation';

import {
    basicEntityKeySelector,
    basicEntityLabelSelector,
} from '#utils/common';

import {
    PartialForm,
} from '#types';

import {
    EventsForEntryFormQuery,
    CreateEntryMutation,
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateAttachmentMutationVariables,
    UpdateEntryMutation,
    UpdateEntryMutationVariables,
    EntryQuery,
    EntryQueryVariables,
} from '#generated/types';

import {
    ENTRY,
    EVENT_LIST,
    CREATE_ENTRY,
    CREATE_ATTACHMENT,
    UPDATE_ENTRY,
} from './queries';
import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';
import {
    FormType,
    FormValues,
    StrataFormProps,
    AgeFormProps,
    FigureFormProps,
    Attachment,
    Preview,
} from './types';

import styles from './styles.css';

type PartialFormValues = PartialForm<FormValues>;

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type EntryFormFields = CreateEntryMutationVariables['entry'];

const schema: Schema<PartialFormValues> = {
    fields: () => ({
        reviewers: [],
        event: [requiredStringCondition],
        details: {
            fields: () => ({
                articleTitle: [requiredStringCondition],
                publishDate: [requiredStringCondition],
                publisher: [requiredStringCondition],
                source: [requiredStringCondition],
                sourceExcerpt: [],
                url: [urlCondition],
                document: [],
                preview: [],
                isConfidential: [],
            }),
        },
        analysis: {
            fields: () => ({
                idmcAnalysis: [requiredStringCondition],
                calculationLogic: [],
                tags: [],
                caveats: [],
            }),
        },
        figures: {
            keySelector: (figure) => figure.uuid,
            member: () => ({
                fields: (value) => {
                    const basicFields = {
                        uuid: [],

                        id: [idCondition],
                        district: [requiredStringCondition],
                        excerptIdu: [],
                        householdSize: [requiredCondition],
                        includeIdu: [],
                        isDisaggregated: [],
                        locationCamp: [],
                        locationNonCamp: [],
                        quantifier: [requiredCondition],
                        reported: [requiredCondition],
                        role: [requiredCondition],
                        startDate: [requiredStringCondition],
                        term: [requiredCondition],
                        town: [requiredStringCondition],
                        type: [requiredCondition],
                        unit: [requiredCondition],
                    };

                    const disaggregatedFields = {
                        ageJson: {
                            keySelector: (age: AgeFormProps) => age.uuid,
                            member: () => ({
                                fields: () => ({
                                    id: [idCondition],
                                    uuid: [],
                                    ageFrom: [requiredCondition],
                                    ageTo: [requiredCondition],
                                    value: [requiredCondition],
                                }),
                            }),
                        },
                        strataJson: {
                            keySelector: (strata: StrataFormProps) => strata.uuid,
                            member: () => ({
                                fields: () => ({
                                    id: [idCondition],
                                    uuid: [],
                                    date: [requiredStringCondition],
                                    value: [requiredCondition],
                                }),
                            }),
                        },
                        conflict: [],
                        conflictCommunal: [],
                        conflictCriminal: [],
                        conflictOther: [],
                        conflictPolitical: [],
                        displacementRural: [],
                        displacementUrban: [],
                        sexFemale: [],
                        sexMale: [],
                    };

                    if (value.isDisaggregated) {
                        return {
                            ...basicFields,
                            ...disaggregatedFields,
                        };
                    }

                    return basicFields;
                },
            }),
        },
    }),
};

const initialFormValues: PartialFormValues = {
    event: '',
    reviewers: [],
    details: {
        url: '',
        document: '',
        preview: '',
        articleTitle: '',
        source: '',
        publisher: '',
        publishDate: '',
        isConfidential: false,
        sourceExcerpt: '',
    },
    analysis: {
        idmcAnalysis: '',
        calculationLogic: '',
        tags: [],
        caveats: '',
    },
    figures: [],
};

function transformErrorForEntry(errors: NonNullable<CreateEntryMutation['createEntry']>['errors']) {
    const formError = transformToFormError(removeNull(errors)) as Error<FormType>;

    const detailsError = {
        $internal: undefined,
        fields: {
            articleTitle: formError?.fields?.articleTitle,
            publishDate: formError?.fields?.publishDate,
            publisher: formError?.fields?.publisher,
            source: formError?.fields?.source,
            sourceExcerpt: formError?.fields?.sourceExcerpt,
            url: formError?.fields?.url,
            document: formError?.fields?.document,
            preview: formError?.fields?.preview,
            isConfidential: formError?.fields?.isConfidential,
        },
    };
    const analysisError = {
        $internal: undefined,
        fields: {
            idmcAnalysis: formError?.fields?.idmcAnalysis,
            calculationLogic: formError?.fields?.calculationLogic,
            tags: formError?.fields?.tags,
            caveats: formError?.fields?.caveats,
        },
    };

    const newError = {
        $internal: formError.$internal,
        fields: {
            reviewers: formError?.fields?.reviewers,
            figures: formError?.fields?.figures,
            event: formError?.fields?.event,
            details: detailsError,
            analysis: analysisError,
        },
    } as Error<PartialFormValues>;
    return newError;
}

interface EntryFormProps {
    className?: string;
    elementRef: React.RefObject<HTMLFormElement>;
    onChange: (newValue: PartialFormValues | undefined) => void;
    attachment?: Attachment;
    preview?: Preview;
    onAttachmentChange: (value: Attachment) => void;
    onPreviewChange: (value: Preview) => void;
    entryId?: string;
    onRequestCallPendingChange?: (pending: boolean) => void;
    onPristineChange: (value: boolean) => void;
    reviewMode?: boolean;
}

function EntryForm(props: EntryFormProps) {
    const {
        className,
        elementRef,
        onChange,
        attachment,
        preview,
        onAttachmentChange: setAttachment,
        onPreviewChange: setPreview,
        entryId,
        onRequestCallPendingChange,
        onPristineChange,
        reviewMode,
    } = props;

    const { notify } = React.useContext(NotificationContext);

    const urlProcessed = !!preview;
    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;

    const [entryFetchFailed, setEntryFetchField] = React.useState(false);
    const [redirectId, setRedirectId] = useState<string | undefined>();
    const [
        organizations,
        setOrganizations,
    ] = useState<OrganizationOption[] | null | undefined>([]);

    const {
        pristine,
        value,
        error,
        onValueChange,
        onValueSet,
        onErrorSet,
        validate,
        onPristineSet,
    } = useForm(initialFormValues, schema);

    React.useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    React.useEffect(() => {
        onPristineChange(pristine);
    }, [pristine, onPristineChange]);

    const [
        createAttachment,
    ] = useMutation<CreateAttachmentMutation, CreateAttachmentMutationVariables>(
        CREATE_ATTACHMENT,
        {
            onCompleted: (response) => {
                const { createAttachment: createAttachmentRes } = response;
                if (!createAttachmentRes) {
                    return;
                }
                const { errors, result } = createAttachmentRes;
                if (errors) {
                    // TODO: handle error
                    console.error(errors);
                    notify({ children: 'Failed to create attachment' });
                }
                if (result) {
                    setAttachment(result);
                    onValueSet({
                        ...value,
                        details: {
                            ...value.details,
                            document: result.id,
                        },
                    });
                }
            },
        },
        // TODO: handle error
    );

    const [
        createEntry,
        { loading: saveLoading },
    ] = useMutation<CreateEntryMutation, CreateEntryMutationVariables>(
        CREATE_ENTRY,
        {
            onCompleted: (response) => {
                const { createEntry: createEntryRes } = response;
                if (!createEntryRes) {
                    return;
                }
                const { errors } = createEntryRes;
                if (errors) {
                    const newError = transformErrorForEntry(errors);
                    onErrorSet(newError);
                } else {
                    const newEntryId = createEntryRes?.result?.id;
                    if (newEntryId) {
                        notify({ children: 'New entry created successfully!' });
                        onPristineSet(true);
                        setRedirectId(newEntryId);
                    }
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to create new entry!' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleUrlProcess = useCallback(
        (url: string) => {
            // TODO: need to call server-less and get real preview object
            setPreview({ url });
            // TODO: also set preview on form
        },
        [setPreview],
    );

    const handleAttachmentProcess = useCallback(
        (files: File[]) => {
            createAttachment({
                variables: { attachment: files[0] },
                context: {
                    hasUpload: true, // activate Upload link
                },
            });
            // TODO: also set attachment on form
        },
        [createAttachment],
    );

    const [
        updateEntry,
        { loading: updateLoading },
    ] = useMutation<UpdateEntryMutation, UpdateEntryMutationVariables>(
        UPDATE_ENTRY,
        {
            onCompleted: (response) => {
                const { updateEntry: updateEntryRes } = response;
                if (!updateEntryRes) {
                    return;
                }
                const { errors } = updateEntryRes;
                if (errors) {
                    const newError = transformErrorForEntry(errors);
                    onErrorSet(newError);
                } else {
                    onPristineSet(true);
                    notify({ children: 'Entry updated successfully!' });
                }
            },
            onError: (errors) => {
                notify({ children: 'Failed to update entry!' });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const handleSubmit = React.useCallback((finalValue: PartialFormValues) => {
        const completeValue = finalValue as FormValues;

        const {
            url: unusedUrl,
            preview: unusedPreview,
            document: unusedDocument,
            ...otherDetails
        } = completeValue.details;

        if (entryId) {
            const entry = {
                id: entryId,
                event: completeValue.event,
                reviewers: completeValue.reviewers,
                figures: completeValue.figures,
                ...otherDetails,
                ...completeValue.analysis,
            } as WithId<EntryFormFields>;

            updateEntry({
                variables: {
                    entry,
                },
            });
        } else {
            const entry = {
                event: completeValue.event,
                reviewers: completeValue.reviewers,
                figures: completeValue.figures,
                ...completeValue.analysis,
                ...completeValue.details,
            } as EntryFormFields;

            createEntry({
                variables: {
                    entry: entry as FormType,
                },
            });
        }
    }, [createEntry, updateEntry, entryId]);

    const [
        shouldShowEventModal,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    const {
        data,
        refetch: refetchDetailOptions,
        loading: eventOptionsLoading,
    } = useQuery<EventsForEntryFormQuery>(EVENT_LIST);

    useEffect(() => {
        if (onRequestCallPendingChange) {
            onRequestCallPendingChange(saveLoading || updateLoading);
        }
    }, [onRequestCallPendingChange, saveLoading, updateLoading]);
    const eventList = data?.eventList?.results;

    const {
        data: entryData,
        loading: getEntryLoading,
    } = useQuery<EntryQuery, EntryQueryVariables>(ENTRY, {
        skip: !entryId,
        variables: { id: entryId as string },
        onCompleted: (response) => {
            const { entry } = response;
            if (!entry) {
                setEntryFetchField(true);
                return;
            }

            const organizationsFromEntry: OrganizationOption[] = [];
            if (entry.source) {
                organizationsFromEntry.push(entry.source);
            }
            if (entry.publisher) {
                organizationsFromEntry.push(entry.publisher);
            }
            const uniqueOrganizations = unique(
                organizationsFromEntry,
                (o) => o.id,
            );

            setOrganizations(uniqueOrganizations);

            const formValues: PartialFormValues = removeNull({
                reviewers: entry.reviewers?.results?.map((d) => d.id),
                event: entry.event.id,
                details: {
                    articleTitle: entry.articleTitle,
                    publishDate: entry.publishDate,
                    publisher: entry.publisher?.id,
                    source: entry.source?.id,
                    sourceExcerpt: entry.sourceExcerpt,
                    url: entry.url,
                    document: entry.document?.id,
                    preview: entry.preview?.id,
                    isConfidential: entry.isConfidential,
                },
                analysis: {
                    idmcAnalysis: entry.idmcAnalysis,
                    calculationLogic: entry.calculationLogic,
                    tags: entry.tags,
                    caveats: entry.caveats,
                },
                figures: entry.figures?.results,
            });

            onValueSet(formValues);
            // FIXME: set real preview
            if (entry.url) {
                setPreview({ url: entry.url });
            }
            if (entry.document) {
                setAttachment(entry.document);
            }
        },
        // TODO: handle errors
    });

    const loading = getEntryLoading || saveLoading || updateLoading || eventOptionsLoading;

    const handleEventCreate = React.useCallback((newEventId) => {
        refetchDetailOptions();
        onValueChange(newEventId, 'event' as const);
        hideEventModal();
    }, [refetchDetailOptions, onValueChange, hideEventModal]);

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures ?? [], onValueChange);

    const handleFigureAdd = () => {
        const uuid = uuidv4();
        const newFigure: PartialForm<FigureFormProps> = {
            uuid,
            includeIdu: false,
            isDisaggregated: false,
        };
        onValueChange(
            [...(value.figures ?? []), newFigure],
            'figures' as const,
        );
    };

    const [activeTab, setActiveTab] = React.useState<'details' | 'analysis-and-figures' | 'review'>('details');
    // const url = value?.details?.url;

    const detailsTabErrored = analyzeErrors(error?.fields?.details);
    const analysisTabErrored = analyzeErrors(error?.fields?.analysis)
        || analyzeErrors(error?.fields?.figures)
        || !!error?.fields?.event;
    const reviewErrored = !!error?.fields?.reviewers;

    if (redirectId) {
        return (
            <Redirect
                to={`/entries/${redirectId}/`}
            />
        );
    }

    if (entryFetchFailed) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrive entry data
            </div>
        );
    }

    return (
        <form
            className={_cs(className, styles.entryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            ref={elementRef}
        >
            <Prompt
                when={!pristine}
                message="There are unsaved changes. Are you sure you want to leave?"
            />
            <NonFieldError>
                {error?.$internal}
            </NonFieldError>
            <div className={styles.content}>
                <Tabs
                    value={activeTab}
                    onChange={setActiveTab}
                >
                    <TabList className={styles.tabList}>
                        <Tab
                            name="details"
                            className={_cs(detailsTabErrored && styles.errored)}
                        >
                            Source Details
                        </Tab>
                        <Tab
                            name="analysis-and-figures"
                            className={_cs(analysisTabErrored && styles.errored)}
                        >
                            Figure and Analysis
                        </Tab>
                        <Tab
                            name="review"
                            className={_cs(reviewErrored && styles.errored)}
                        >
                            Review
                        </Tab>
                    </TabList>
                    <TabPanel
                        className={styles.details}
                        name="details"
                    >
                        <DetailsInput
                            name="details"
                            value={value.details}
                            onChange={onValueChange}
                            error={error?.fields?.details}
                            disabled={loading}
                            urlProcessed={urlProcessed}
                            attachment={attachment}
                            onAttachmentProcess={handleAttachmentProcess}
                            onUrlProcess={handleUrlProcess}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            reviewMode={reviewMode}
                        />
                    </TabPanel>
                    <TabPanel
                        className={styles.analysisAndFigures}
                        name="analysis-and-figures"
                    >
                        <Section
                            heading="Event"
                            actions={(
                                <Button
                                    name={undefined}
                                    className={styles.addEventButton}
                                    onClick={showEventModal}
                                    disabled={loading || !processed || reviewMode}
                                >
                                    Add Event
                                </Button>
                            )}
                        >
                            <div className={styles.row}>
                                <SelectInput
                                    className={styles.eventSelectInput}
                                    error={error?.fields?.event}
                                    label="Event *"
                                    keySelector={basicEntityKeySelector}
                                    labelSelector={basicEntityLabelSelector}
                                    name="event"
                                    options={eventList}
                                    value={value.event}
                                    onChange={onValueChange}
                                    disabled={loading || !processed}
                                    readOnly={reviewMode}
                                />
                            </div>
                            { shouldShowEventModal && (
                                <Modal
                                    className={styles.addEventModal}
                                    bodyClassName={styles.body}
                                    heading="Add Event"
                                    onClose={hideEventModal}
                                >
                                    <EventForm onEventCreate={handleEventCreate} />
                                </Modal>
                            )}
                            {value.event && (
                                <EventForm
                                    id={value.event}
                                    readOnly
                                />
                            )}
                        </Section>
                        <Section heading="Analysis">
                            <AnalysisInput
                                name="analysis"
                                value={value.analysis}
                                onChange={onValueChange}
                                error={error?.fields?.analysis}
                                disabled={loading || !processed}
                                reviewMode={reviewMode}
                            />
                        </Section>
                        <Section
                            heading="Figures"
                            actions={(
                                <Button
                                    name={undefined}
                                    onClick={handleFigureAdd}
                                    disabled={loading || !processed || reviewMode}
                                >
                                    Add Figure
                                </Button>
                            )}
                        >
                            <NonFieldError>
                                {error?.fields?.figures?.$internal}
                            </NonFieldError>
                            { value.figures?.length === 0 ? (
                                <div className={styles.emptyMessage}>
                                    No figures yet
                                </div>
                            ) : value.figures?.map((figure, index) => (
                                <FigureInput
                                    key={figure.uuid}
                                    index={index}
                                    value={figure}
                                    onChange={onFigureChange}
                                    onRemove={onFigureRemove}
                                    error={error?.fields?.figures?.members?.[figure.uuid]}
                                    disabled={loading || !processed}
                                    reviewMode={reviewMode}
                                />
                            ))}
                        </Section>
                    </TabPanel>
                    <TabPanel
                        className={styles.review}
                        name="review"
                    >
                        <ReviewInput
                            name="reviewers"
                            onChange={onValueChange}
                            value={value.reviewers}
                            disabled={loading || !processed}
                            reviewMode={reviewMode}
                            entryId={entryId}
                            reviewing={entryData?.entry?.reviewing}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </form>
    );
}

export default EntryForm;
