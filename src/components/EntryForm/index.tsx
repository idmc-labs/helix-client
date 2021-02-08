import React, { useCallback, useState, useContext, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Redirect, Prompt } from 'react-router-dom';
import { getOperationName } from 'apollo-link';
import {
    _cs,
    unique,
    isDefined,
} from '@togglecorp/fujs';
import { v4 as uuidv4 } from 'uuid';
import {
    Button,
    PopupButton,
    TextArea,
    Tabs,
    TabList,
    Tab,
    TabPanel,
    Modal,
} from '@togglecorp/toggle-ui';
import {
    useQuery,
    useMutation,
} from '@apollo/client';

import { ENTRY_COMMENTS } from '#components/EntryComments/queries';
import FormActions from '#components/FormActions';
import EventForm from '#components/EventForm';
import EventSelectInput, { EventOption } from '#components/EventSelectInput';
import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import { OrganizationOption } from '#components/OrganizationSelectInput';
import Section from '#components/Section';
import TrafficLightInput from '#components/TrafficLightInput';
import { UserOption } from '#components/ReviewersMultiSelectInput';
import route from '#config/routes';
import useModalState from '#hooks/useModalState';
import { reverseRoute } from '#hooks/useRouteMatching';
import { PartialForm } from '#types';
import useForm, { useFormArray, createSubmitHandler } from '#utils/form';

import { removeNull, analyzeErrors } from '#utils/schema';
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
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
    FigureOptionsForEntryFormQuery,
    ParkedItemForEntryQuery,
    EventDetailsQuery,
} from '#generated/types';
import { FigureTagOption } from '#components/FigureTagMultiSelectInput';

import {
    ENTRY,
    CREATE_ENTRY,
    CREATE_ATTACHMENT,
    CREATE_SOURCE_PREVIEW,
    CREATE_REVIEW_COMMENT,
    UPDATE_ENTRY,
    FIGURE_OPTIONS,
    PARKED_ITEM_FOR_ENTRY,
    EVENT_DETAILS,
} from './queries';
import Row from './Row';
import DetailsInput from './DetailsInput';
import AnalysisInput from './AnalysisInput';
import FigureInput from './FigureInput';
import ReviewInput from './ReviewInput';
import { schema as createSchema, initialFormValues } from './schema';
import {
    transformErrorForEntry,
    getReviewInputMap,
    ghost,
    getReviewList,
} from './utils';
import {
    Attachment,
    EntryReviewStatus,
    FigureFormProps,
    FormType,
    FormValues,
    SourcePreview,
    ReviewInputFields,
} from './types';

import styles from './styles.css';

const entryCommentsQueryName = getOperationName(ENTRY_COMMENTS);

// eslint-disable-next-line @typescript-eslint/ban-types
type WithId<T extends object> = T & { id: string };
type EntryFormFields = CreateEntryMutationVariables['entry'];
type PartialFormValues = PartialForm<FormValues>;

interface EntryFormProps {
    className?: string;

    attachment?: Attachment;
    preview?: SourcePreview;
    onAttachmentChange: (value: Attachment) => void;
    onSourcePreviewChange: (value: SourcePreview) => void;

    entryId?: string;
    reviewMode?: boolean;

    parentNode?: Element | null | undefined;
    parkedItemId?: string;
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
        reviewMode,
        parentNode,
    } = props;

    const entryFormRef = useRef<HTMLFormElement>(null);
    const { user } = useContext(DomainContext);
    const addReviewPermission = user?.permissions?.review?.add;

    const popupElementRef = useRef<{
        setPopupVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    }>(null);

    const { notify } = useContext(NotificationContext);

    const [comment, setComment] = React.useState<string | undefined>();

    const [reviewPristine, setReviewPristine] = useState(true);
    const [review, setReview] = useState<ReviewInputFields>({});

    const [activeTab, setActiveTab] = useState<'details' | 'analysis-and-figures' | 'review'>('details');
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
    ] = useState<EventOption[] | null | undefined>([]);
    const [
        users,
        setUsers,
    ] = useState<UserOption[] | undefined | null>();
    const [
        tagOptions,
        setTagOptions,
    ] = useState<FigureTagOption[] | undefined | null>();
    const [
        shouldShowEventModal,
        eventModalId,
        showEventModal,
        hideEventModal,
    ] = useModalState();

    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const categoryOptions = figureOptionsData?.figureCategoryList?.results;
    const schema = useMemo(
        () => createSchema(categoryOptions),
        [categoryOptions],
    );

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

    const {
        loading: parkedItemDataLoading,
        error: parkedItemError,
    } = useQuery<ParkedItemForEntryQuery>(PARKED_ITEM_FOR_ENTRY, {
        skip: !parkedItemId,
        variables: { id: parkedItemId },
        onCompleted: (response) => {
            const { parkedItem: parkedItemRes } = response;

            // FIXME: when parkedItem is null, the onCompleted shouldn't be called at all
            // Handle this differently
            if (!parkedItemRes) {
                setParkedItemFetchFailed(true);
                return;
            }

            const parkedItemWithoutNull = removeNull(parkedItemRes);

            onValueSet({
                ...value,
                details: {
                    ...value.details,
                    articleTitle: parkedItemWithoutNull?.title,
                    url: parkedItemWithoutNull?.url,
                    associatedParkedItem: parkedItemWithoutNull?.id,
                },
            });
        },
    });

    const {
        loading: countriesOfEventLoading,
        data: eventData,
    } = useQuery<EventDetailsQuery>(EVENT_DETAILS, {
        skip: !value.event,
        variables: value.event ? { id: value.event } : undefined,
    });

    const countriesOfEvent = eventData?.event?.countries;

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
            onError: (err) => {
                notify({ children: err.message });
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
                    notify({ children: 'Failed to create source preview' });
                }
                if (result) {
                    setSourcePreview(result);
                    onValueSet({
                        ...value,
                        details: {
                            ...value.details,
                            preview: result.id,
                        },
                    });
                }
            },
            onError: (err) => {
                notify({ children: err.message });
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
                    notify({ children: 'Failed to create entry!' });
                    onErrorSet(newError);
                }
                if (result) {
                    notify({ children: 'New entry created successfully!' });
                    setRedirectId(result.id);
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
                    notify({ children: 'Failed to update entry!' });
                    onErrorSet(newError);
                }
                if (result) {
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

    const [
        createReviewComment,
        { loading: createReviewLoading },
    ] = useMutation<
        CreateReviewCommentMutation,
        CreateReviewCommentMutationVariables
    >(CREATE_REVIEW_COMMENT, {
        refetchQueries: entryCommentsQueryName ? [entryCommentsQueryName] : undefined,
        onCompleted: (response) => {
            const { createReviewComment: createReviewCommentRes } = response;
            if (!createReviewCommentRes) {
                return;
            }

            const { errors, result } = createReviewCommentRes;

            if (errors) {
                console.error(response);
                notify({ children: 'Failed to submit review' });
            }
            if (result) {
                const { entry } = removeNull(result);
                const prevReview = getReviewInputMap(
                    // FIXME: filtering by isDefined should not be necessary
                    entry?.latestReviews?.filter(isDefined).map((r) => ({
                        field: r.field,
                        figure: r.figure?.id,
                        geoLocation: r.geoLocation?.id,
                        ageId: r.ageId,
                        strataId: r.strataId,
                        value: r.value,
                    })),
                );
                setReviewPristine(true);
                setReview(prevReview);
                setComment(undefined);
                popupElementRef.current?.setPopupVisibility(false);

                notify({ children: 'Review submitted successfully' });
            }
        },
        onError: (errors) => {
            notify({ children: errors.message });
        },
    });

    const variables = useMemo(
        (): EntryQueryVariables | undefined => (entryId ? { id: entryId } : undefined),
        [entryId],
    );

    const {
        data: entryData,
        loading: getEntryLoading,
        error: entryDataError,
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

            const prevReview = getReviewInputMap(
                // FIXME: filtering by isDefined should not be necessary
                entry.latestReviews?.filter(isDefined).map((r) => ({
                    field: r.field,
                    figure: r.figure?.id,
                    geoLocation: r.geoLocation?.id,
                    ageId: r.ageId,
                    strataId: r.strataId,
                    value: r.value,
                })),
            );
            setReview(prevReview);

            const organizationsFromEntry: OrganizationOption[] = [];
            if (entry.sources?.results) {
                organizationsFromEntry.push(...entry.sources.results);
            }
            if (entry.publishers?.results) {
                organizationsFromEntry.push(...entry.publishers.results);
            }
            const uniqueOrganizations = unique(
                organizationsFromEntry,
                (o) => o.id,
            );
            setOrganizations(uniqueOrganizations);

            if (entry.reviewers?.results) {
                setUsers(entry.reviewers.results);
            }

            if (entry.event) {
                setEvents([entry.event]);
            }

            if (entry.tags) {
                setTagOptions(entry.tags);
            }

            const formValues: PartialFormValues = removeNull({
                reviewers: entry.reviewers?.results?.map((d) => d.id),
                event: entry.event.id,
                details: {
                    associatedParkedItem: entry.associatedParkedItem?.id,
                    articleTitle: entry.articleTitle,
                    publishDate: entry.publishDate,
                    publishers: entry.publishers?.results?.map((item) => item.id),
                    sources: entry.sources?.results?.map((item) => item.id),
                    sourceExcerpt: entry.sourceExcerpt,
                    url: entry.url,
                    document: entry.document?.id,
                    preview: entry.preview?.id,
                    isConfidential: entry.isConfidential,
                },
                analysis: {
                    idmcAnalysis: entry.idmcAnalysis,
                    calculationLogic: entry.calculationLogic,
                    tags: entry.tags?.map((tag) => tag.id),
                    caveats: entry.caveats,
                },
                figures: entry.figures?.results?.map((figure) => ({
                    ...figure,
                    country: figure.country?.id,
                    geoLocations: figure.geoLocations?.results,
                    category: figure.category?.id,
                })),
            });

            onValueSet(formValues);
            if (entry.preview) {
                setSourcePreview(entry.preview);
            }
            if (entry.document) {
                setAttachment(entry.document);
            }
        },
    });

    // eslint-disable-next-line max-len
    const loading = getEntryLoading || saveLoading || updateLoading || createAttachmentLoading || parkedItemDataLoading || createSourcePreviewLoading;

    const handleReviewChange = useCallback(
        (newValue: EntryReviewStatus, name: string) => {
            setReview((oldReview) => ({
                ...oldReview,
                [name]: {
                    ...oldReview[name],
                    value: newValue,
                    dirty: true,
                    key: name,
                },
            }));
            setReviewPristine(false);
        },
        [],
    );
    const handleSubmit = useCallback((finalValue: PartialFormValues) => {
        const completeValue = finalValue as FormValues;

        const {
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            url: unusedUrl,
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
            preview: unusedSourcePreview,
            // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
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

    const handleUrlProcess = useCallback(
        (url: string) => {
            createSourcePreview({
                variables: { url },
            });
        },
        [createSourcePreview],
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

    const handleEventCreate = useCallback(
        (newEvent: EventOption) => {
            setEvents((oldEvents) => [...(oldEvents ?? []), newEvent]);
            onValueChange(newEvent.id, 'event' as const);
            hideEventModal();
        },
        [onValueChange, hideEventModal],
    );

    const {
        onValueChange: onFigureChange,
        onValueRemove: onFigureRemove,
    } = useFormArray('figures', value.figures ?? [], onValueChange);

    const handleFigureClone = useCallback(
        (index: number) => {
            const oldFigure = value.figures?.[index];
            if (!oldFigure) {
                return;
            }

            const newFigure: PartialForm<FigureFormProps> = {
                ...ghost(oldFigure),
                ageJson: oldFigure.ageJson?.map(ghost),
                strataJson: oldFigure.strataJson?.map(ghost),
                geoLocations: oldFigure.geoLocations?.map(ghost),
            };
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
        },
        [onValueChange, value.figures],
    );

    const handleFigureAdd = useCallback(
        () => {
            const uuid = uuidv4();
            const newFigure: PartialForm<FigureFormProps> = {
                uuid,
                includeIdu: false,
                isDisaggregated: false,
                isHousingDestruction: false,
            };
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
        },
        [onValueChange, value.figures],
    );

    const handleSubmitEntryButtonClick = useCallback(
        () => {
            if (entryFormRef?.current) {
                entryFormRef.current.requestSubmit();
            }
        },
        [entryFormRef],
    );

    const detailsTabErrored = analyzeErrors(error?.fields?.details);
    const analysisTabErrored = analyzeErrors(error?.fields?.analysis)
        || analyzeErrors(error?.fields?.figures)
        || !!error?.fields?.event;
    const reviewErrored = !!error?.fields?.reviewers;

    const urlProcessed = !!preview;
    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;

    const dirtyReviews = useMemo(
        () => (
            Object.values(review)
                .filter(isDefined)
                .filter((item) => item.dirty)
        ),
        [review],
    );

    const handleSubmitReviewButtonClick = useCallback(
        () => {
            if (!entryId) {
                return;
            }

            const reviewList = getReviewList(dirtyReviews);
            // FIXME: call handler so that comments can be re-fetched or do that refetching manually
            createReviewComment({
                variables: {
                    data: {
                        body: comment,
                        entry: entryId,
                        reviews: reviewList.map((r) => ({
                            ...r,
                            entry: entryId,
                        })),
                    },
                },
            });
        },
        [dirtyReviews, createReviewComment, entryId, comment],
    );

    const entryReviewers = entryData?.entry?.reviewers?.results;
    const userIsReviewer = useMemo(
        () => (
            !!entryReviewers?.find((rev) => rev.id === user?.id)
        ),
        [entryReviewers, user?.id],
    );

    const figureAdded = !!(value.figures?.length ?? 0);

    if (redirectId) {
        return (
            <Redirect
                to={reverseRoute(route.entry.path, { entryId: redirectId })}
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

    const disabled = loading || createReviewLoading || reviewPristine;

    const submitButton = parentNode && ReactDOM.createPortal(
        <>
            {reviewMode ? (
                addReviewPermission && (
                    <PopupButton
                        componentRef={popupElementRef}
                        name={undefined}
                        variant="primary"
                        popupClassName={styles.popup}
                        popupContentClassName={styles.popupContent}
                        disabled={disabled || !userIsReviewer}
                        title={!userIsReviewer ? 'You have not been assigned to this entry' : ''}
                        label={
                            dirtyReviews.length > 0
                                ? `Submit Review (${dirtyReviews.length})`
                                : 'Submit Review'
                        }
                    >
                        <TextArea
                            label="Comment"
                            name="comment"
                            onChange={setComment}
                            value={comment}
                            disabled={disabled}
                            className={styles.comment}
                        />
                        <FormActions>
                            <Button
                                name={undefined}
                                onClick={handleSubmitReviewButtonClick}
                                disabled={disabled || !comment}
                            >
                                Submit
                            </Button>
                        </FormActions>
                    </PopupButton>
                )
            ) : (
                <Button
                    name={undefined}
                    variant="primary"
                    onClick={handleSubmitEntryButtonClick}
                    disabled={!processed || loading || pristine}
                >
                    Submit Entry
                </Button>
            )}
        </>,
        parentNode,
    );

    return (
        <form
            className={_cs(className, styles.entryForm)}
            onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
            ref={entryFormRef}
        >
            {submitButton}
            <Prompt
                when={!pristine || !reviewPristine}
                message="There are unsaved changes. Are you sure you want to leave?"
            />
            {loading && <Loading absolute />}
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
                            sourcePreview={preview}
                            attachment={attachment}
                            onAttachmentProcess={handleAttachmentProcess}
                            onUrlProcess={handleUrlProcess}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            reviewMode={reviewMode}
                            onReviewChange={handleReviewChange}
                            review={review}
                        />
                    </TabPanel>
                    <TabPanel
                        className={styles.analysisAndFigures}
                        name="analysis-and-figures"
                    >
                        <Section
                            heading="Event"
                            actions={!reviewMode && (
                                <Button
                                    name={undefined}
                                    onClick={showEventModal}
                                    disabled={loading || !processed}
                                >
                                    Add Event
                                </Button>
                            )}
                        >
                            <Row>
                                <EventSelectInput
                                    error={error?.fields?.event}
                                    label="Event *"
                                    name="event"
                                    options={events}
                                    value={value.event}
                                    onChange={onValueChange}
                                    onOptionsChange={setEvents}
                                    disabled={loading || !processed || countriesOfEventLoading}
                                    readOnly={reviewMode || figureAdded}
                                    icons={reviewMode && review && (
                                        <TrafficLightInput
                                            name="event"
                                            onChange={handleReviewChange}
                                            value={review.event?.value}
                                        />
                                    )}
                                />
                            </Row>
                            { shouldShowEventModal && (
                                <Modal
                                    className={styles.addEventModal}
                                    bodyClassName={styles.body}
                                    heading="Add Event"
                                    onClose={hideEventModal}
                                >
                                    <EventForm
                                        id={eventModalId}
                                        onEventCreate={handleEventCreate}
                                        onEventFormCancel={hideEventModal}
                                    />
                                </Modal>
                            )}
                            {value.event && (
                                <EventForm
                                    className={styles.eventDetails}
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
                                review={review}
                                onReviewChange={handleReviewChange}
                                optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                tagOptions={tagOptions}
                                setTagOptions={setTagOptions}
                            />
                        </Section>
                        <Section
                            heading="Figures"
                            actions={!reviewMode && (
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
                            { value.figures?.length === 0 ? (
                                <div className={styles.emptyMessage}>
                                    No figures yet
                                </div>
                            ) : value.figures?.map((fig, index) => (
                                <FigureInput
                                    key={fig.uuid}
                                    index={index}
                                    value={fig}
                                    onChange={onFigureChange}
                                    onRemove={onFigureRemove}
                                    onClone={handleFigureClone}
                                    error={error?.fields?.figures?.members?.[fig.uuid]}
                                    disabled={loading || !processed}
                                    reviewMode={reviewMode}
                                    review={review}
                                    onReviewChange={handleReviewChange}
                                    countries={countriesOfEvent}
                                    optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                    accuracyOptions={figureOptionsData?.accuracyList?.enumValues}
                                    categoryOptions={figureOptionsData?.figureCategoryList?.results}
                                    unitOptions={figureOptionsData?.unitList?.enumValues}
                                    termOptions={figureOptionsData?.termList?.enumValues}
                                    roleOptions={figureOptionsData?.roleList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    identifierOptions={figureOptionsData?.identifierList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    quantifierOptions={figureOptionsData?.quantifierList?.enumValues}
                                />
                            ))}
                        </Section>
                    </TabPanel>
                    <TabPanel
                        className={styles.review}
                        name="review"
                    >
                        <ReviewInput
                            error={error?.fields?.reviewers}
                            name="reviewers"
                            onChange={onValueChange}
                            value={value.reviewers}
                            disabled={loading || !processed}
                            reviewMode={reviewMode}
                            entryId={entryId}
                            reviewing={entryData?.entry?.reviewing}
                            users={users}
                            setUsers={setUsers}
                        />
                    </TabPanel>
                </Tabs>
            </div>
        </form>
    );
}

export default EntryForm;
