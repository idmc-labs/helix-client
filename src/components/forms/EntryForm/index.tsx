import React, { useCallback, useState, useContext, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Prompt, Redirect, useLocation } from 'react-router-dom';
import {
    _cs,
    unique,
    isDefined,
    listToMap,
    compareStringAsNumber,
} from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    Tabs,
    TabList,
    Tab,
    TabPanel,
} from '@togglecorp/toggle-ui';
import {
    removeNull,
    useForm,
    createSubmitHandler,
    PartialForm,
    analyzeErrors,
    useFormArray,
} from '@togglecorp/toggle-form';
import {
    useQuery,
    useMutation,
} from '@apollo/client';

import { EventListOption } from '#components/selections/EventListSelectInput';
import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import { OrganizationOption } from '#components/selections/OrganizationSelectInput';
import Section from '#components/Section';
import route from '#config/routes';
import { reverseRoute } from '#hooks/useRouteMatching';
import { WithId } from '#utils/common';

import {
    CreateEntryMutation,
    CreateEntryMutationVariables,
    CreateAttachmentMutation,
    CreateAttachmentMutationVariables,
    CreateSourcePreviewMutation,
    CreateSourcePreviewMutationVariables,
    UpdateEntryMutation,
    UpdateEntryMutationVariables,
    EntryQuery,
    EntryQueryVariables,
    FigureOptionsForEntryFormQuery,
    ParkedItemForEntryQuery,
    ParkedItemForEntryQueryVariables,
    Date_Accuracy as DateAccuracy,
    Displacement_Occurred as DisplacementOccurred,
} from '#generated/types';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import { ViolenceContextOption } from '#components/selections/ViolenceContextMultiSelectInput';

import {
    ENTRY,
    CREATE_ENTRY,
    CREATE_ATTACHMENT,
    CREATE_SOURCE_PREVIEW,
    UPDATE_ENTRY,
    FIGURE_OPTIONS,
    PARKED_ITEM_FOR_ENTRY,
} from './queries';
import FigureInput from './FigureInput';
import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import { schema, initialFormValues } from './schema';
import {
    transformErrorForEntry,
    ghost,
} from './utils';
import {
    Attachment,
    FigureFormProps,
    FormType,
    FormValues,
    SourcePreview,
    AccuracyOptions,
    DateAccuracyOptions,
    DisplacementOptions,
    UnitOptions,
    TermOptions,
    RoleOptions,
    GenderOptions,
    IdentifierOptions,
    QuantifierOptions,
    CauseOptions,
    CategoryOptions,
} from './types';

import styles from './styles.css';

type EntryFormFields = CreateEntryMutationVariables['entry'];
type PartialFormValues = PartialForm<FormValues>;
type PartialFigureValues = PartialForm<FigureFormProps>;

interface EntryFormProps {
    className?: string;

    attachment?: Attachment;
    preview?: SourcePreview;
    onAttachmentChange: (value: Attachment | undefined) => void;
    onSourcePreviewChange: (value: SourcePreview | undefined) => void;

    entryId?: string;
    mode: 'view' | 'edit';
    trafficLightShown: boolean;
    parentNode?: Element | null | undefined;
    parkedItemId?: string;
    initialFigureId?: string | null | undefined;
}

interface PortalProps {
    parentNode: Element | null | undefined;
    children: React.ReactNode | null | undefined;
}

function Portal(props: PortalProps) {
    const {
        parentNode,
        children,
    } = props;
    if (!parentNode) {
        return null;
    }
    return ReactDOM.createPortal(children, parentNode);
}

function EntryForm(props: EntryFormProps) {
    const {
        className,
        attachment,
        preview,
        onAttachmentChange: setAttachment,
        onSourcePreviewChange: setSourcePreview,
        parkedItemId,
        entryId,
        mode,
        trafficLightShown,
        parentNode,
        initialFigureId,
    } = props;

    const entryFormRef = useRef<HTMLFormElement>(null);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const location = useLocation();

    // just for jumping to selected figure
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();
    // FIXME: the usage is not correct
    const [entryFetchFailed, setEntryFetchFailed] = useState(false);
    // FIXME: the usage is not correct
    const [parkedItemFetchFailed, setParkedItemFetchFailed] = useState(false);

    const [redirectId, setRedirectId] = useState<string | undefined>();

    const [
        organizations,
        setOrganizations,
    ] = useState<OrganizationOption[] | null | undefined>([]);
    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);
    const [
        tagOptions,
        setTagOptions,
    ] = useState<FigureTagOption[] | undefined | null>();
    const [
        violenceContextOptions,
        setViolenceContextOptions,
    ] = useState<ViolenceContextOption[] | null | undefined>();

    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

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

    const getValuesFromResponse = useCallback(
        (entry: NonNullable<EntryQuery['entry']>) => {
            const organizationsFromEntry: OrganizationOption[] = [];
            organizationsFromEntry.push(
                ...(entry.figures
                    ?.flatMap((item) => item.sources?.results)
                    .filter(isDefined) ?? []),
            );
            if (entry.publishers?.results) {
                organizationsFromEntry.push(...entry.publishers.results);
            }
            const organizationsForState = unique(
                organizationsFromEntry,
                (o) => o.id,
            );

            // FIXME: server should always pass event
            const eventsForState = entry.figures
                ?.map((item) => item.event)
                .filter(isDefined);
            const tagOptionsForState = entry.figures
                ?.flatMap((item) => item.tags)
                .filter(isDefined);
            const violenceContextOptionsForState = entry.figures
                ?.flatMap((item) => item.contextOfViolence)
                .filter(isDefined);

            const entryForState = removeNull({
                details: {
                    associatedParkedItem: entry.associatedParkedItem?.id,
                    articleTitle: entry.articleTitle,
                    publishDate: entry.publishDate,
                    publishers: entry.publishers?.results?.map((item) => item.id),
                    url: entry.url,
                    documentUrl: entry.documentUrl,
                    document: entry.document?.id,
                    preview: entry.preview?.id,
                    isConfidential: entry.isConfidential,
                },
                analysis: {
                    idmcAnalysis: entry.idmcAnalysis,
                },
                figures: entry.figures?.map((figure) => ({
                    ...figure,
                    event: figure.event?.id,
                    country: figure.country?.id,
                    geoLocations: figure.geoLocations?.results,
                    category: figure.category,
                    term: figure.term,
                    tags: figure.tags?.map((tag) => tag.id),
                    sources: figure.sources?.results?.map((item) => item.id),
                    disaggregationAge: figure.disaggregationAge?.results?.map((item) => ({
                        ...item,
                    })),

                    figureCause: figure.figureCause,

                    disasterSubType: figure.disasterSubType?.id,
                    violenceSubType: figure.violenceSubType?.id,
                    osvSubType: figure.osvSubType?.id,
                    otherSubType: figure.otherSubType?.id,
                    contextOfViolence: figure.contextOfViolence?.map((c) => c.id),
                })).sort((foo, bar) => compareStringAsNumber(foo.id, bar.id)),
            });

            return {
                organizationsForState,
                eventsForState,
                tagOptionsForState,
                violenceContextOptionsForState,
                entryForState,
            };
        },
        [],
    );

    const parkedItemVariables = useMemo(
        (): ParkedItemForEntryQueryVariables | undefined => (
            parkedItemId ? { id: parkedItemId } : undefined
        ),
        [parkedItemId],
    );

    const {
        loading: parkedItemDataLoading,
        error: parkedItemError,
    } = useQuery<ParkedItemForEntryQuery>(PARKED_ITEM_FOR_ENTRY, {
        skip: !parkedItemVariables,
        variables: parkedItemVariables,
        onCompleted: (response) => {
            const { parkedItem: parkedItemRes } = response;

            // FIXME: when parkedItem is null, the onCompleted shouldn't be called at all
            // Handle this differently
            if (!parkedItemRes) {
                setParkedItemFetchFailed(true);
                return;
            }

            const parkedItemWithoutNull = removeNull(parkedItemRes);

            onValueSet((oldValue) => ({
                ...oldValue,
                details: {
                    ...oldValue.details,
                    articleTitle: parkedItemWithoutNull?.title,
                    url: parkedItemWithoutNull?.url,
                    associatedParkedItem: parkedItemWithoutNull?.id,
                },
            }));
        },
    });

    const [
        createAttachment,
        { loading: createAttachmentLoading },
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
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'File uploaded successfully!',
                        variant: 'success',
                    });
                    setAttachment(result);
                    onValueSet((oldValue) => ({
                        ...oldValue,
                        details: {
                            ...oldValue.details,
                            document: result.id,
                        },
                    }));
                    onPristineSet(false);
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        createSourcePreview,
        { loading: createSourcePreviewLoading },
    ] = useMutation<CreateSourcePreviewMutation, CreateSourcePreviewMutationVariables>(
        CREATE_SOURCE_PREVIEW,
        {
            onCompleted: (response) => {
                const { createSourcePreview: createSourcePreviewRes } = response;
                if (!createSourcePreviewRes) {
                    return;
                }
                const { errors, result } = createSourcePreviewRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    setSourcePreview(result);
                    onValueSet((oldValue) => ({
                        ...oldValue,
                        details: {
                            ...oldValue.details,
                            preview: result.id,
                        },
                    }));
                    onPristineSet(false);
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
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
                const { errors, result } = createEntryRes;
                if (errors) {
                    const newError = transformErrorForEntry(errors);
                    notifyGQLError(errors);
                    onErrorSet(newError);
                }
                if (result) {
                    // NOTE: we do not need to set state as we are re-directing to next page

                    onPristineSet(true);
                    notify({
                        children: 'New entry created successfully!',
                        variant: 'success',
                    });

                    setRedirectId(result.id);
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
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
                const { errors, result } = updateEntryRes;
                if (errors) {
                    const newError = transformErrorForEntry(errors);
                    notifyGQLError(errors);
                    onErrorSet(newError);
                }
                if (result) {
                    const {
                        organizationsForState,
                        eventsForState,
                        tagOptionsForState,
                        violenceContextOptionsForState,
                        entryForState,
                    } = getValuesFromResponse(result);

                    setOrganizations(organizationsForState);
                    setEvents(eventsForState);
                    setTagOptions(tagOptionsForState);
                    setViolenceContextOptions(violenceContextOptionsForState);
                    setSourcePreview(result.preview ?? undefined);
                    setAttachment(result.document ?? undefined);

                    onValueSet(entryForState);

                    onPristineSet(true);
                    notify({
                        children: 'Entry updated successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });
            },
        },
    );

    const variables = useMemo(
        (): EntryQueryVariables | undefined => (
            entryId ? { id: entryId } : undefined
        ),
        [entryId],
    );

    const {
        loading: getEntryLoading,
        error: entryDataError,
        previousData: previousEntryData,
        data: entryData = previousEntryData,
    } = useQuery<EntryQuery, EntryQueryVariables>(ENTRY, {
        skip: !variables,
        variables,
        onCompleted: (response) => {
            const { entry } = removeNull(response);
            // FIXME: when entry is null, the onCompleted shouldn't be called at all
            // Handle this differently
            if (!entry) {
                setEntryFetchFailed(true);
                return;
            }

            const {
                organizationsForState,
                eventsForState,
                tagOptionsForState,
                violenceContextOptionsForState,
                entryForState,
            } = getValuesFromResponse(entry);

            setOrganizations(organizationsForState);
            setEvents(eventsForState);
            setTagOptions(tagOptionsForState);
            setViolenceContextOptions(violenceContextOptionsForState);
            setSourcePreview(entry.preview);
            setAttachment(entry.document);

            onValueSet(entryForState);

            const mainFigure = entry.figures?.find((element) => (
                element.id === initialFigureId
            ));
            setSelectedFigure(mainFigure?.uuid);
        },
    });

    const figureMapping = useMemo(
        () => {
            const figures = entryData?.entry?.figures;
            const mapping = listToMap(
                figures,
                (figure) => figure.uuid,
                (figure) => ({
                    role: figure.role,
                    reviewStatus: figure.reviewStatus,
                    fieldStatuses: figure.lastReviewCommentStatus,
                }),
            );
            return mapping;
        },
        [entryData],
    );

    // eslint-disable-next-line max-len
    const loading = getEntryLoading || saveLoading || updateLoading || createAttachmentLoading || parkedItemDataLoading || createSourcePreviewLoading;

    const handleSubmit = useCallback((finalValue: PartialFormValues) => {
        const completeValue = finalValue as FormValues;
        if (entryId) {
            const entry = {
                id: entryId,
                figures: completeValue.figures,
                ...completeValue.analysis,
                ...completeValue.details,
            } as WithId<EntryFormFields>;

            updateEntry({
                variables: {
                    entry,
                },
            });
        } else {
            const entry = {
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

    const handleUrlProcess = useCallback(
        (url: string) => {
            createSourcePreview({
                variables: { url },
            });
        },
        [createSourcePreview],
    );

    const handleRemoveUrl = useCallback(
        () => {
            setSourcePreview(undefined);
            onValueSet((oldValue) => ({
                ...oldValue,
                details: {
                    ...oldValue.details,
                    preview: undefined,
                    url: undefined,
                },
            }));
            onPristineSet(false);
        }, [setSourcePreview, onValueSet, onPristineSet],
    );

    const handleAttachmentRemove = useCallback(
        () => {
            setAttachment(undefined);
            onValueSet((oldValue) => ({
                ...oldValue,
                details: {
                    ...oldValue.details,
                    document: undefined,
                },
            }));
            onPristineSet(false);
        },
        [setAttachment, onValueSet, onPristineSet],
    );

    const handleAttachmentProcess = useCallback(
        (files: File[]) => {
            createAttachment({
                variables: { attachment: files[0] },
                context: {
                    hasUpload: true, // activate Upload link
                },
            });
        },
        [createAttachment],
    );

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray<'figures', PartialFigureValues>('figures', onValueChange);

    const handleFigureAdd = useCallback(
        () => {
            const uuid = uuidv4();
            const dayAccuracy: DateAccuracy = 'DAY';
            const unknownDisplacement: DisplacementOccurred = 'UNKNOWN';

            const newFigure: PartialForm<FigureFormProps> = {
                uuid,
                includeIdu: false,
                isDisaggregated: false,
                isHousingDestruction: false,
                startDateAccuracy: dayAccuracy,
                endDateAccuracy: dayAccuracy,
                displacementOccurred: unknownDisplacement,
                sources: [],
            };
            setSelectedFigure(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({
                children: 'Added new figure!',
                variant: 'default',
            });
        },
        [onValueChange, value, notify],
    );

    const handleFigureClone = useCallback(
        (oldFigure: PartialForm<FigureFormProps> | undefined) => {
            if (!oldFigure) {
                return;
            }

            const newFigure: PartialForm<FigureFormProps> = {
                ...ghost(oldFigure),
                disaggregationAge: oldFigure.disaggregationAge?.map(ghost),
                geoLocations: oldFigure.geoLocations?.map(ghost),

                disaggregationConflict: undefined,
                disaggregationConflictCommunal: undefined,
                disaggregationConflictCriminal: undefined,
                disaggregationConflictOther: undefined,
                disaggregationConflictPolitical: undefined,
                disaggregationDisability: undefined,
                disaggregationDisplacementRural: undefined,
                disaggregationDisplacementUrban: undefined,
                disaggregationIndigenousPeople: undefined,
                disaggregationLgbtiq: undefined,
                disaggregationLocationCamp: undefined,
                disaggregationLocationNonCamp: undefined,
                disaggregationSexFemale: undefined,
                disaggregationSexMale: undefined,
                disaggregationStrataJson: undefined,
                isDisaggregated: false,

                excerptIdu: undefined,
                includeIdu: false,

                householdSize: undefined,
                unit: undefined,

                reported: undefined,
                role: undefined,

                wasSubfact: undefined,
            };
            setSelectedFigure(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({
                children: 'Cloned figure!',
            });
        },
        [onValueChange, value.figures, notify],
    );

    const handleSubmitEntryButtonClick = useCallback(
        () => {
            if (entryFormRef?.current) {
                entryFormRef.current.requestSubmit();
            }
        },
        [entryFormRef],
    );

    if (redirectId && (!entryId || entryId !== redirectId)) {
        // NOTE: using <Redirect /> instead of history.push because
        // page redirect should be called only after pristine is set to true
        return (
            <Redirect
                to={reverseRoute(route.entryEdit.path, { entryId: redirectId })}
            />
        );
    }

    if (parkedItemFetchFailed || parkedItemError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve parked item data!
            </div>
        );
    }

    if (entryFetchFailed || entryDataError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve entry data!
            </div>
        );
    }

    const detailsTabErrored = analyzeErrors(error?.fields?.details);
    const analysisTabErrored = analyzeErrors(error?.fields?.analysis)
        || analyzeErrors(error?.fields?.figures);

    const urlProcessed = !!preview;
    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;

    const editMode = mode === 'edit';

    return (
        <>
            {editMode && (
                <Portal parentNode={parentNode}>
                    <Button
                        name={undefined}
                        variant="primary"
                        onClick={handleSubmitEntryButtonClick}
                        disabled={!processed || loading || pristine}
                    >
                        Submit
                    </Button>
                </Portal>
            )}
            <Prompt
                message={(newLocation) => {
                    if (
                        newLocation.pathname !== location.pathname
                        && !pristine
                    ) {
                        return 'There are unsaved changes. Are you sure you want to leave?';
                    }
                    return true;
                }}
            />
            <form
                className={_cs(className, styles.entryForm)}
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                ref={entryFormRef}
            >
                {loading && <Loading absolute />}
                <Tabs
                    useHash
                    defaultHash="details"
                >
                    <TabList className={styles.tabList}>
                        <Tab
                            name="details"
                            className={_cs(detailsTabErrored && styles.errored)}
                        >
                            Source Details
                        </Tab>
                        <Tab
                            name="figures-and-analysis"
                            className={_cs(analysisTabErrored && styles.errored)}
                        >
                            Figure and Analysis
                        </Tab>
                    </TabList>
                    <NonFieldError>
                        {error?.$internal}
                    </NonFieldError>
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
                            // entryId={entryId}
                            sourcePreview={preview}
                            attachment={attachment}
                            onAttachmentProcess={handleAttachmentProcess}
                            onRemoveAttachment={handleAttachmentRemove}
                            onUrlProcess={handleUrlProcess}
                            onRemoveUrl={handleRemoveUrl}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            mode={mode}
                        />
                    </TabPanel>
                    <TabPanel
                        className={styles.analysisAndFigures}
                        name="figures-and-analysis"
                    >
                        {/* FIXME: Trends and patterns input element
                            temporarily hidden until further notice */}
                        <Section
                            className={styles.hidden}
                            heading="Analysis"
                        >
                            <AnalysisInput
                                name="analysis"
                                value={value.analysis}
                                onChange={onValueChange}
                                error={error?.fields?.analysis}
                                disabled={loading || !processed}
                                mode={mode}
                            />
                        </Section>
                        <Section
                            heading="Figures"
                            contentClassName={styles.figuresContent}
                            actions={editMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleFigureAdd}
                                    disabled={loading || !processed}
                                >
                                    Add Figure
                                </Button>
                            )}
                        >
                            <NonFieldError>
                                {error?.fields?.figures?.$internal}
                            </NonFieldError>
                            {value.figures?.length === 0 ? (
                                <div className={styles.emptyMessage}>
                                    No figures yet
                                </div>
                            ) : value.figures?.map((fig, index) => (
                                <FigureInput
                                    key={fig.uuid}
                                    selectedFigure={selectedFigure}
                                    setSelectedFigure={setSelectedFigure}
                                    index={index}
                                    value={fig}
                                    onChange={onFigureChange}
                                    onRemove={onFigureRemove}
                                    error={error?.fields?.figures?.members?.[fig.uuid]}
                                    disabled={loading || !processed}
                                    mode={mode}
                                    optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                    tagOptions={tagOptions}
                                    setTagOptions={setTagOptions}
                                    violenceContextOptions={violenceContextOptions}
                                    setViolenceContextOptions={setViolenceContextOptions}
                                    events={events}
                                    setEvents={setEvents}
                                    // eslint-disable-next-line max-len
                                    causeOptions={figureOptionsData?.crisisType?.enumValues as CauseOptions}
                                    // eslint-disable-next-line max-len
                                    accuracyOptions={figureOptionsData?.accuracyList?.enumValues as AccuracyOptions}
                                    // eslint-disable-next-line max-len
                                    categoryOptions={figureOptionsData?.figureCategoryList?.enumValues as CategoryOptions}
                                    // eslint-disable-next-line max-len
                                    unitOptions={figureOptionsData?.unitList?.enumValues as UnitOptions}
                                    // eslint-disable-next-line max-len
                                    termOptions={figureOptionsData?.figureTermList?.enumValues as TermOptions}
                                    // eslint-disable-next-line max-len
                                    roleOptions={figureOptionsData?.roleList?.enumValues as RoleOptions}
                                    // eslint-disable-next-line max-len
                                    displacementOptions={figureOptionsData?.displacementOccurence?.enumValues as DisplacementOptions}
                                    // eslint-disable-next-line max-len
                                    identifierOptions={figureOptionsData?.identifierList?.enumValues as IdentifierOptions}
                                    // eslint-disable-next-line max-len
                                    genderCategoryOptions={figureOptionsData?.disaggregatedGenderList?.enumValues as GenderOptions}
                                    // eslint-disable-next-line max-len
                                    quantifierOptions={figureOptionsData?.quantifierList?.enumValues as QuantifierOptions}
                                    // eslint-disable-next-line max-len
                                    dateAccuracyOptions={figureOptionsData?.dateAccuracy?.enumValues as DateAccuracyOptions}
                                    // eslint-disable-next-line max-len
                                    disasterCategoryOptions={figureOptionsData?.disasterCategoryList}
                                    violenceCategoryOptions={figureOptionsData?.violenceList}
                                    osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                                    // eslint-disable-next-line max-len
                                    otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                                    trafficLightShown={trafficLightShown}
                                    organizations={organizations}
                                    setOrganizations={setOrganizations}
                                    onFigureClone={handleFigureClone}
                                    isRecommended={figureMapping[fig.uuid]?.role === 'RECOMMENDED'}
                                    reviewStatus={figureMapping[fig.uuid]?.reviewStatus}
                                    fieldStatuses={figureMapping[fig.uuid]?.fieldStatuses}
                                />
                            ))}
                        </Section>
                    </TabPanel>
                </Tabs>
            </form>
        </>
    );
}

export default EntryForm;
