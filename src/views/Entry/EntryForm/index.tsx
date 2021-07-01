import React, { useCallback, useState, useContext, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Prompt, Redirect } from 'react-router-dom';
import { getOperationName } from 'apollo-link';
import { IoMdEye, IoMdEyeOff } from 'react-icons/io';
import {
    _cs,
    unique,
    isDefined,
    sum,
    isNotDefined,
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
import NumberBlock from '#components/NumberBlock';

import FormActions from '#components/FormActions';
import EventForm from '#components/forms/EventForm';
import EventSelectInput, { EventOption } from '#components/selections/EventSelectInput';
import Loading from '#components/Loading';
import NonFieldError from '#components/NonFieldError';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import { OrganizationOption } from '#components/selections/OrganizationSelectInput';
import Section from '#components/Section';
import TrafficLightInput from '#components/TrafficLightInput';
import { UserOption } from '#components/selections/ReviewersMultiSelectInput';
import route from '#config/routes';
import useModalState from '#hooks/useModalState';
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
    CreateReviewCommentMutation,
    CreateReviewCommentMutationVariables,
    FigureOptionsForEntryFormQuery,
    ParkedItemForEntryQuery,
    ParkedItemForEntryQueryVariables,
    EventDetailsQuery,
    EventDetailsQueryVariables,
    Unit,
    Role,
} from '#generated/types';
import { FigureTagOption } from '#components/selections/FigureTagMultiSelectInput';
import Row from '#components/Row';

import EntryCloneForm from './EntryCloneForm';
import { ENTRY_COMMENTS } from '../EntryComments/queries';
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

const household: Unit = 'HOUSEHOLD';
const recommended: Role = 'RECOMMENDED';

const entryCommentsQueryName = getOperationName(ENTRY_COMMENTS);

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
    mode: 'view' | 'review' | 'edit';
    trafficLightShown: boolean;
    parentNode?: Element | null | undefined;
    parkedItemId?: string;
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

function filterFigures(item: PartialForm<FigureFormProps>, categoryId: string | undefined) {
    if (isNotDefined(categoryId)) {
        return false;
    }
    return item.category === categoryId && item.role === recommended;
}
function getValueFromFigure(item: PartialForm<FigureFormProps>) {
    if (item.unit === household) {
        if (isNotDefined(item.reported) || isNotDefined(item.householdSize)) {
            return undefined;
        }
        return item.reported * item.householdSize;
    }
    return item.reported;
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
    } = props;

    const entryFormRef = useRef<HTMLFormElement>(null);
    const { user } = useContext(DomainContext);
    const addReviewPermission = user?.permissions?.review?.add;

    const popupElementRef = useRef<{
        setPopupVisibility: React.Dispatch<React.SetStateAction<boolean>>;
    }>(null);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();
    const [comment, setComment] = React.useState<string | undefined>();

    const [reviewPristine, setReviewPristine] = useState(true);
    const [review, setReview] = useState<ReviewInputFields>({});

    const [activeTab, setActiveTab] = useState<'details' | 'analysis-and-figures' | 'review'>('details');
    // FIXME: the usage is not correct
    const [entryFetchFailed, setEntryFetchFailed] = useState(false);
    // FIXME: the usage is not correct
    const [parkedItemFetchFailed, setParkedItemFetchFailed] = useState(false);

    const [eventDetailsShown, , , , toggleEventDetailsShown] = useModalState(false);

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

    const [
        shouldShowEventCloneModal,
        entryIdToClone,
        showEventCloneModal,
        hideEventCloneModal,
    ] = useModalState();

    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);
    const categoryOptions = figureOptionsData?.figureCategoryList?.results;
    const termOptions = figureOptionsData?.figureTermList?.results;
    const idpCategory = useMemo(
        () => categoryOptions?.find((item) => item.name === 'IDPs')?.id,
        [categoryOptions],
    );
    const ndCategory = useMemo(
        () => categoryOptions?.find((item) => item.name === 'New Displacement')?.id,
        [categoryOptions],
    );
    const schema = useMemo(
        () => createSchema(categoryOptions, termOptions),
        [categoryOptions, termOptions],
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

    const eventVariables = useMemo(
        (): EventDetailsQueryVariables | undefined => (
            value.event ? { id: value.event } : undefined
        ), [value.event],
    );

    const {
        loading: countriesOfEventLoading,
        data: eventData,
    } = useQuery<EventDetailsQuery>(EVENT_DETAILS, {
        skip: !eventVariables,
        variables: eventVariables,
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
                    notify({ children: 'File uploaded successfully!' });
                    setAttachment(result);
                    onValueSet((oldValue) => ({
                        ...oldValue,
                        details: {
                            ...oldValue.details,
                            document: result.id,
                        },
                    }));
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
                    notifyGQLError(errors);
                    onErrorSet(newError);
                }
                if (result) {
                    onPristineSet(true);
                    notify({ children: 'New entry created successfully!' });

                    setRedirectId(result.id);
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
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
                    onPristineSet(true);
                    notify({ children: 'Entry updated successfully!' });
                }
            },
            onError: (errors) => {
                notify({ children: errors.message });
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
                notifyGQLError(errors);
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
                        value: r.value,
                        comment: r.comment,
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
        (): EntryQueryVariables | undefined => (
            entryId ? { id: entryId } : undefined
        ),
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
                    value: r.value,
                    comment: r.comment,
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
                    documentUrl: entry.documentUrl,
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
                    term: figure.term?.id,
                    disaggregationAgeJson: figure.disaggregationAgeJson?.map((item) => ({
                        ...item,
                        // FIXME: the item schema allows item to be undefined from the server
                        category: item?.category?.id,
                    })),
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
                    // NOTE: Clearing comment for dirty reviews
                    comment: undefined,
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
        }, [setSourcePreview, onValueSet],
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
        },
        [setAttachment, onValueSet],
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
    } = useFormArray<'figures', PartialFigureValues>('figures', onValueChange);

    const handleFigureClone = useCallback(
        (index: number) => {
            const oldFigure = value.figures?.[index];
            if (!oldFigure) {
                return;
            }

            const newFigure: PartialForm<FigureFormProps> = {
                ...ghost(oldFigure),
                disaggregationAgeJson: oldFigure.disaggregationAgeJson?.map(ghost),
                geoLocations: oldFigure.geoLocations?.map(ghost),
            };
            setSelectedFigure(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({ children: 'Figure cloned!' });
        },
        [onValueChange, value.figures, notify],
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
            setSelectedFigure(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({ children: 'Figure added!' });
        },
        [onValueChange, value.figures, notify],
    );

    const handleCloneEntryButtonClick = useCallback(
        () => {
            showEventCloneModal(entryId);
        },
        [entryId, showEventCloneModal],
    );

    const handleSubmitEntryButtonClick = useCallback(
        () => {
            if (entryFormRef?.current) {
                entryFormRef.current.requestSubmit();
            }
        },
        [entryFormRef],
    );

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
                            field: r.field,
                            figure: r.figure,
                            geoLocation: r.geoLocation,
                            ageId: r.ageId,
                            value: r.value,
                            entry: entryId,
                        })),
                    },
                },
            });
        },
        [dirtyReviews, createReviewComment, entryId, comment],
    );

    const {
        totalIdpFigures,
        totalNewDisplacementFigures,
    } = useMemo(
        () => {
            const idpFigures = value?.figures
                ?.filter((item) => filterFigures(item, idpCategory))
                .map(getValueFromFigure)
                .filter(isDefined);

            const ndFigures = value?.figures
                ?.filter((item) => filterFigures(item, ndCategory))
                .map(getValueFromFigure)
                .filter(isDefined);

            const idpFiguresSum = idpFigures && idpFigures.length > 0
                ? sum(idpFigures)
                : undefined;

            const ndFiguresSum = ndFigures && ndFigures.length > 0
                ? sum(ndFigures)
                : undefined;

            return {
                totalIdpFigures: idpFiguresSum,
                totalNewDisplacementFigures: ndFiguresSum,
            };
        },
        [idpCategory, ndCategory, value?.figures],
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

    const countriesOfEvent = eventData?.event?.countries;

    const crisisFlowInfo = eventData?.event?.crisis?.totalFlowNdFigures;
    const crisisStockInfo = eventData?.event?.crisis?.totalStockIdpFigures;
    const eventFlowInfo = eventData?.event?.totalFlowNdFigures;
    const eventStockInfo = eventData?.event?.totalStockIdpFigures;

    const detailsTabErrored = analyzeErrors(error?.fields?.details);
    const analysisTabErrored = analyzeErrors(error?.fields?.analysis)
        || analyzeErrors(error?.fields?.figures)
        || !!error?.fields?.event;
    const reviewErrored = !!error?.fields?.reviewers;

    const urlProcessed = !!preview;
    const attachmentProcessed = !!attachment;
    const processed = attachmentProcessed || urlProcessed;
    const eventProcessed = value?.event;

    const disabled = loading || createReviewLoading || reviewPristine;
    const reviewMode = mode === 'review';
    const editMode = mode === 'edit';

    return (
        <>
            {shouldShowEventCloneModal && entryIdToClone && (
                <Modal
                    onClose={hideEventCloneModal}
                    heading="Clone Entry"
                >
                    <EntryCloneForm
                        entryId={entryIdToClone}
                        onCloseForm={hideEventCloneModal}
                    />
                </Modal>
            )}
            {editMode && (
                <Portal parentNode={parentNode}>
                    <Button
                        name={undefined}
                        variant="default"
                        onClick={handleCloneEntryButtonClick}
                        disabled={!entryId || loading || !pristine}
                    >
                        Clone
                    </Button>
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
            {reviewMode && addReviewPermission && (
                <Portal parentNode={parentNode}>
                    <PopupButton
                        componentRef={popupElementRef}
                        name={undefined}
                        variant="primary"
                        popupClassName={styles.popup}
                        popupContentClassName={styles.popupContent}
                        disabled={disabled}
                        label={
                            dirtyReviews.length > 0
                                ? `Review (${dirtyReviews.length})`
                                : 'Review'
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
                </Portal>
            )}
            <Prompt
                when={!pristine || !reviewPristine}
                message="There are unsaved changes. Are you sure you want to leave?"
            />
            <form
                className={_cs(className, styles.entryForm)}
                onSubmit={createSubmitHandler(validate, onErrorSet, handleSubmit)}
                ref={entryFormRef}
            >
                {loading && <Loading absolute />}
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
                    <NonFieldError className={styles.generalError}>
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
                            entryId={entryId}
                            sourcePreview={preview}
                            attachment={attachment}
                            onAttachmentProcess={handleAttachmentProcess}
                            onRemoveAttachment={handleAttachmentRemove}
                            onUrlProcess={handleUrlProcess}
                            onRemoveUrl={handleRemoveUrl}
                            organizations={organizations}
                            setOrganizations={setOrganizations}
                            mode={mode}
                            onReviewChange={handleReviewChange}
                            review={review}
                            trafficLightShown={trafficLightShown}
                        />
                    </TabPanel>
                    <TabPanel
                        className={styles.analysisAndFigures}
                        name="analysis-and-figures"
                    >
                        <Section
                            heading="Event"
                            headerClassName={styles.header}
                            actions={editMode && (
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
                                    readOnly={!editMode}
                                    icons={trafficLightShown && review && (
                                        <TrafficLightInput
                                            disabled={!reviewMode}
                                            name="event"
                                            onChange={handleReviewChange}
                                            value={review.event?.value}
                                            comment={review.event?.comment}
                                        />
                                    )}
                                    actions={(
                                        <Button
                                            onClick={toggleEventDetailsShown}
                                            name={undefined}
                                            transparent
                                            title={eventDetailsShown ? 'Hide event details' : 'Show event details'}
                                            compact
                                        >
                                            {eventDetailsShown ? <IoMdEyeOff /> : <IoMdEye />}
                                        </Button>
                                    )}
                                />
                            </Row>
                            {shouldShowEventModal && (
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
                            {value.event && eventDetailsShown && (
                                <EventForm
                                    className={styles.eventDetails}
                                    id={value.event}
                                    readOnly
                                />
                            )}
                        </Section>
                        <Section
                            heading="Analysis"
                            headerClassName={styles.header}
                        >
                            <AnalysisInput
                                name="analysis"
                                value={value.analysis}
                                onChange={onValueChange}
                                error={error?.fields?.analysis}
                                disabled={loading || !processed}
                                mode={mode}
                                review={review}
                                onReviewChange={handleReviewChange}
                                optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                tagOptions={tagOptions}
                                setTagOptions={setTagOptions}
                                trafficLightShown={trafficLightShown}
                            />
                            {eventProcessed && (
                                <div className={styles.stockInfo}>
                                    <NumberBlock
                                        label="New Displacement (Crisis)"
                                        value={crisisFlowInfo}
                                    />
                                    <NumberBlock
                                        label="Total no. of IDPs (Crisis)"
                                        value={crisisStockInfo}
                                    />
                                    <NumberBlock
                                        label="New Displacement (Event)"
                                        value={eventFlowInfo}
                                    />
                                    <NumberBlock
                                        label="Total no. of IDPs (Event)"
                                        value={eventStockInfo}
                                    />
                                    <NumberBlock
                                        label="New Displacement (Entry)"
                                        value={totalNewDisplacementFigures}
                                    />
                                    <NumberBlock
                                        label="Total no. of IDPs (Entry)"
                                        value={totalIdpFigures}
                                    />
                                </div>
                            )}
                        </Section>
                        <Section
                            heading="Figures"
                            headerClassName={styles.header}
                            actions={editMode && (
                                <Button
                                    name={undefined}
                                    onClick={handleFigureAdd}
                                    disabled={loading || !processed || !eventProcessed}
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
                                    selected={fig.uuid === selectedFigure}
                                    index={index}
                                    value={fig}
                                    onChange={onFigureChange}
                                    onRemove={onFigureRemove}
                                    onClone={handleFigureClone}
                                    error={error?.fields?.figures?.members?.[fig.uuid]}
                                    disabled={loading || !processed}
                                    mode={mode}
                                    review={review}
                                    onReviewChange={handleReviewChange}
                                    countries={countriesOfEvent}
                                    optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
                                    accuracyOptions={figureOptionsData?.accuracyList?.enumValues}
                                    categoryOptions={figureOptionsData?.figureCategoryList?.results}
                                    unitOptions={figureOptionsData?.unitList?.enumValues}
                                    termOptions={figureOptionsData?.figureTermList?.results}
                                    roleOptions={figureOptionsData?.roleList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    displacementOptions={figureOptionsData?.displacementOccurence?.enumValues}
                                    // eslint-disable-next-line max-len
                                    identifierOptions={figureOptionsData?.identifierList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    ageCategoryOptions={figureOptionsData?.disaggregatedAgeCategoryList?.results}
                                    // eslint-disable-next-line max-len
                                    genderCategoryOptions={figureOptionsData?.disaggregatedGenderList?.enumValues}
                                    // eslint-disable-next-line max-len
                                    quantifierOptions={figureOptionsData?.quantifierList?.enumValues}
                                    trafficLightShown={trafficLightShown}
                                    // eslint-disable-next-line max-len
                                    dateAccuracyOptions={figureOptionsData?.dateAccuracy?.enumValues}
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
                            mode={mode}
                            entryId={entryId}
                            reviewing={entryData?.entry?.reviewing}
                            users={users}
                            setUsers={setUsers}
                            trafficLightShown={trafficLightShown}
                            review={review}
                            onReviewChange={handleReviewChange}
                        />
                    </TabPanel>
                </Tabs>
            </form>
        </>
    );
}

export default EntryForm;
