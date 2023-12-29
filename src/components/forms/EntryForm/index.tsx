import React, { useCallback, useState, useContext, useRef, useMemo, useEffect } from 'react';
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

import { transformToFormError } from '#utils/errorTransform';
import useBulkSaveRegister from '#hooks/useBulkSaveRegister';
import Portal from '#components/Portal';
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
    UpdateFiguresMutation,
    UpdateFiguresMutationVariables,
    EntryQuery,
    EntryQueryVariables,
    FigureOptionsForEntryFormQuery,
    ParkedItemForEntryQuery,
    ParkedItemForEntryQueryVariables,
    Date_Accuracy as DateAccuracy,
    Displacement_Occurred as DisplacementOccurred,
} from '#generated/types';
import useOptions from '#hooks/useOptions';

import {
    ENTRY,
    CREATE_ENTRY,
    CREATE_ATTACHMENT,
    CREATE_SOURCE_PREVIEW,
    UPDATE_ENTRY,
    FIGURE_OPTIONS,
    PARKED_ITEM_FOR_ENTRY,
    UPDATE_FIGURES,
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

// FIXME: move this to utils
function useWatchDog(
    stop: boolean,
    watchdogTimer: number,
    callback: () => void,
) {
    const [run, setRun] = useState(0);

    const watchdogTimerRef = useRef(watchdogTimer);
    useEffect(
        () => {
            watchdogTimerRef.current = watchdogTimer;
        },
        [watchdogTimer],
    );

    const callbackRef = useRef(callback);
    useEffect(
        () => {
            callbackRef.current = callback;
        },
        [callback],
    );

    useEffect(
        () => {
            if (stop) {
                return undefined;
            }
            // FIXME: check if still mounted
            const t = setTimeout(
                () => {
                    callbackRef.current();

                    setRun((item) => item + 1);
                },
                watchdogTimerRef.current,
            );

            return () => {
                clearTimeout(t);
            };
        },
        [stop, run],
    );

    const reset = useCallback(
        () => {
            setRun((item) => item + 1);
        },
        [],
    );

    return reset;
}

type EntryFormFields = CreateEntryMutationVariables['entry'];

type PartialFormValues = PartialForm<FormValues>;
type PartialFigureValues = PartialForm<FigureFormProps>;

function getValuesFromEntry(entry: Omit<NonNullable<EntryQuery['entry']>, 'figures'>) {
    const organizationsFromEntry: OrganizationOption[] = entry.publishers?.results ?? [];

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
    });

    return {
        organizationsForState: organizationsFromEntry,
        entryForState,
    };
}

function getValuesFromFigures(figures: (NonNullable<NonNullable<EntryQuery['entry']>['figures']>[number] | null | undefined)[]) {
    const organizationsFromEntry: OrganizationOption[] = [];
    organizationsFromEntry.push(
        ...(figures
            ?.flatMap((item) => item?.sources?.results)
            .filter(isDefined) ?? []),
    );
    const organizationsForState = unique(
        organizationsFromEntry,
        (o) => o.id,
    );

    // FIXME: server should always pass event
    const eventsForState = figures
        ?.map((item) => item?.event)
        .filter(isDefined);
    const tagOptionsForState = figures
        ?.flatMap((item) => item?.tags)
        .filter(isDefined);

    const violenceContextOptionsForState = figures
        ?.flatMap((item) => item?.contextOfViolence)
        .filter(isDefined);

    const figuresForState = figures?.map((figure) => {
        if (!figure) {
            return figure;
        }
        // FIXME: removeNull will delete 'null' from the list instead of
        // setting it to undefined
        return removeNull({
            ...figure,
            entry: figure.entry?.id,
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
        });
    });

    return {
        organizationsForState,
        eventsForState,
        tagOptionsForState,
        violenceContextOptionsForState,
        figuresForState,
    };
}

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
    initialFieldType: string | null;
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
        initialFieldType,
    } = props;

    const entryFormRef = useRef<HTMLFormElement>(null);

    const {
        pending,
        start,
        end,
        getNextRequests,
        updateResponses,
    } = useBulkSaveRegister<
        NonNullable<NonNullable<UpdateFiguresMutation['bulkUpdateFigures']>['errors']>[number],
        NonNullable<NonNullable<UpdateFiguresMutation['bulkUpdateFigures']>['result']>[number],
        { id: string },
        { id: string, uuid: string },
        NonNullable<UpdateFiguresMutationVariables['figures']>[number]
    >();

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const location = useLocation();

    // just for jumping to selected figure
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();
    const [selectedFieldType, setSelectedFieldType] = useState<string>();

    const handleSelectedFigureChange: React.Dispatch<
        React.SetStateAction<string | undefined>
    > = useCallback(
        (arg) => {
            setSelectedFigure(arg);
            setSelectedFieldType(undefined);
        },
        [],
    );

    // FIXME: the usage is not correct
    const [entryFetchFailed, setEntryFetchFailed] = useState(false);
    // FIXME: the usage is not correct
    const [parkedItemFetchFailed, setParkedItemFetchFailed] = useState(false);

    const [redirectId, setRedirectId] = useState<string | undefined>();

    // NOTE: we are not using useOptions as this event has more details
    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);
    const [, setOrganizations] = useOptions('organization');
    const [, setTagOptions] = useOptions('tag');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');

    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const {
        pristine,
        value,
        error,
        onValueChange: onValueChangeFromForm,
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

    const handleBulkSaveEnd = useCallback(
        ({ entrySaved, noFigures }: { entrySaved: boolean, noFigures: boolean }) => {
            if (entrySaved) {
                notify({
                    children: 'Entry saved successfully!',
                    variant: 'success',
                });
                if (noFigures) {
                    onPristineSet(true);
                }
            } else {
                notify({
                    children: 'Could not save entry',
                    variant: 'error',
                });
            }

            const {
                deleteRequests,
                saveRequests,

                deleteResponses,
                saveResponses,
                errorResponses,
            } = end();

            if (noFigures) {
                return;
            }

            // NOTE: getValuesFromFigures should not filter or sort the figures
            const {
                organizationsForState,
                eventsForState,
                tagOptionsForState,
                violenceContextOptionsForState,
                figuresForState,
            } = getValuesFromFigures(saveResponses ?? []);

            const savedFigures = figuresForState?.map((item, index) => {
                if (!item) {
                    return undefined;
                }
                // NOTE: We can improve this by using uuid instead of an index
                const request = saveRequests[index];
                if (!request) {
                    return undefined;
                }
                const key = request.uuid;
                return { key, value: item, new: !request.id };
            }).filter(isDefined);
            const savedFiguresMapping = listToMap(
                savedFigures,
                (item) => item.key,
                (item) => item,
            );

            // TODO: Remove deleted figures
            const deletedFigures = deleteResponses?.map((item) => {
                if (!item) {
                    return undefined;
                }
                // NOTE: we can improve performance here using a hashmap
                const key = deleteRequests.find((request) => request.id === item.id)?.uuid;
                if (!key) {
                    return undefined;
                }
                return { key };
            }).filter(isDefined);
            const deletedFiguresMapping = listToMap(
                deletedFigures,
                (item) => item.key,
                () => true,
            );

            const erroredFigures = errorResponses?.map((item, index) => {
                if (!item) {
                    return undefined;
                }
                // NOTE: We can improve this by using uuid instead of an index
                const key = saveRequests[index]?.uuid;
                if (!key) {
                    return undefined;
                }
                return { key, value: item };
            }).filter(isDefined);
            const erroredFiguresMapping = listToMap(
                erroredFigures,
                (item) => item.key,
                () => true,
            );
            const errors = listToMap(
                erroredFigures,
                (err) => err.key,
                (err) => transformToFormError(removeNull(err.value)),
            );

            // NOTE:
            // Figures that are not present in saveResponses but in saveRequests
            // and that are not present in errorResponses
            const skippedSaveFigures = saveRequests.filter(isDefined).filter((item) => {
                const skipped = (
                    !savedFiguresMapping[item.uuid]
                    && !erroredFiguresMapping[item.uuid]
                );
                return skipped;
            }).map((item) => item.uuid);
            const skippedSaveFiguresErrors = listToMap(
                skippedSaveFigures,
                (key) => key,
                () => ({
                    $internal: 'Could not save figure',
                }),
            );

            // NOTE:
            // Figures that are not present in deleteResponses but in deleteRequests
            // and that are not present in errorResponses
            const skippedDeleteFigures = deleteRequests.filter(isDefined).filter((item) => {
                const skipped = (
                    !deletedFiguresMapping[item.uuid]
                    && !erroredFiguresMapping[item.uuid]
                );
                return skipped;
            }).map((item) => item.uuid);
            const skippedDeleteFiguresErrors = listToMap(
                skippedDeleteFigures,
                (key) => key,
                () => ({
                    $internal: 'Could not delete figure',
                }),
            );

            setOrganizations(organizationsForState);
            setEvents(eventsForState);
            setTagOptions(tagOptionsForState);
            setViolenceContextOptions(violenceContextOptionsForState);

            // NOTE: Not updating the figures yet
            onValueSet((oldValue) => {
                const updatedFigures = oldValue?.figures?.map((figure) => {
                    if (deletedFiguresMapping[figure.uuid]) {
                        return undefined;
                    }
                    // NOTE: We do no need to change the stale field
                    if (savedFiguresMapping[figure.uuid]) {
                        return savedFiguresMapping[figure.uuid].value;
                    }
                    return figure;
                }).filter(isDefined) ?? [];

                const newFigures = savedFigures
                    .filter((item) => item.new)
                    .map((item) => item.value)
                    .sort((foo, bar) => compareStringAsNumber(foo.id, bar.id));

                return ({
                    ...oldValue,
                    figures: [
                        ...updatedFigures,
                        ...newFigures,
                    ],
                });
            });

            // NOTE: onValueSet clears errors so setting this later
            onErrorSet({
                fields: {
                    figures: {
                        $internal: undefined,
                        members: {
                            ...skippedDeleteFiguresErrors,
                            ...skippedSaveFiguresErrors,
                            ...errors,
                        },
                    },
                },
            });

            // NOTE: Not sure if onValueSet also sets pristine value
            onPristineSet(true);

            const saveCount = savedFigures.length;
            const deleteCount = deletedFigures.length;

            const saveFailedCount = saveRequests.length - saveCount;
            const deleteFailedCount = deleteRequests.length - deleteCount;

            if (saveCount > 0) {
                notify({
                    children: `${saveCount} figures saved successfully!`,
                    variant: 'success',
                });
            }
            if (saveFailedCount > 0) {
                notify({
                    children: `Failed to save ${saveFailedCount} figures!`,
                    variant: 'error',
                });
            }
            if (deleteCount > 0) {
                notify({
                    children: `${deleteCount} figures deleted successfully!`,
                    variant: 'success',
                });
            }
            if (deleteFailedCount > 0) {
                notify({
                    children: `Failed to delete ${deleteFailedCount} figures!`,
                    variant: 'error',
                });
            }
        },
        [end, notify, onPristineSet, onErrorSet, onValueSet],
    );

    const [
        updateFigures,
        { loading: updateFiguresLoading },
    ] = useMutation<UpdateFiguresMutation, UpdateFiguresMutationVariables>(
        UPDATE_FIGURES,
        {
            onCompleted: (response) => {
                const { bulkUpdateFigures: bulkUpdateFiguresRes } = response;
                if (!bulkUpdateFiguresRes) {
                    handleBulkSaveEnd({ entrySaved: true, noFigures: false });
                    return;
                }

                const { errors, result, deletedResult } = bulkUpdateFiguresRes;
                // NOTE: We do not need to make sure that the no. of items in
                // deleteIds is equal to deleteResponses
                // TODO: We need to make sure that the no. of items in
                // errorResponses and deleteResponses is equal to figures
                updateResponses({
                    errorResponses: errors,
                    saveResponses: result,
                    deleteResponses: deletedResult,
                });
                const {
                    deleteRequests: nextDeleteRequests,
                    saveRequests: nextSaveRequests,
                    isEmpty,
                } = getNextRequests();

                if (!isEmpty) {
                    updateFigures({
                        variables: {
                            figures: nextSaveRequests,
                            deleteIds: nextDeleteRequests.map((item) => item.id),
                        },
                    });
                    return;
                }

                handleBulkSaveEnd({ entrySaved: true, noFigures: false });
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
                onErrorSet({
                    $internal: errors.message,
                });

                handleBulkSaveEnd({ entrySaved: true, noFigures: false });
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
                    handleBulkSaveEnd({ entrySaved: false, noFigures: true });
                    return;
                }
                const { errors, result } = updateEntryRes;
                if (errors) {
                    const newError = transformErrorForEntry(errors);
                    notifyGQLError(errors);
                    onErrorSet(newError);
                    handleBulkSaveEnd({ entrySaved: false, noFigures: true });
                    return;
                }
                if (result) {
                    const {
                        organizationsForState,
                        entryForState,
                    } = getValuesFromEntry(result);

                    setOrganizations(organizationsForState);
                    setSourcePreview(result.preview ?? undefined);
                    setAttachment(result.document ?? undefined);

                    // NOTE: Not updating the figures yet
                    onValueSet((oldValue) => ({
                        ...entryForState,
                        figures: oldValue.figures,
                    }));

                    const {
                        isEmpty,
                        deleteRequests: nextDeleteRequests,
                        saveRequests: nextSaveRequests,
                    } = getNextRequests();

                    if (isEmpty) {
                        // Only call this if there are not figures to save
                        onPristineSet(true);
                        handleBulkSaveEnd({ entrySaved: true, noFigures: true });
                    } else {
                        updateFigures({
                            variables: {
                                figures: nextSaveRequests,
                                deleteIds: nextDeleteRequests.map((item) => item.id),
                            },
                        });
                    }
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
                end();
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
            if (!entry) {
                setEntryFetchFailed(true);
                return;
            }

            const {
                organizationsForState,
                entryForState,
            } = getValuesFromEntry(entry);
            const {
                organizationsForState: organizationsForState2,
                eventsForState,
                figuresForState,
                tagOptionsForState,
                violenceContextOptionsForState,
            } = getValuesFromFigures(entry.figures ?? []);

            setSourcePreview(entry.preview);
            setAttachment(entry.document);

            setEvents(eventsForState);
            setTagOptions(tagOptionsForState);
            setViolenceContextOptions(violenceContextOptionsForState);

            setOrganizations(organizationsForState);
            setOrganizations(organizationsForState2);

            onValueSet({
                ...entryForState,
                figures: figuresForState
                    .filter(isDefined)
                    .sort((foo, bar) => compareStringAsNumber(foo.id, bar.id)),
            });

            const mainFigure = entry.figures?.find((element) => (
                element.id === initialFigureId
            ));
            setSelectedFigure(mainFigure?.uuid);
            setSelectedFieldType(initialFieldType ?? undefined);
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
    const loading = (
        getEntryLoading
        || pending
        || saveLoading
        || updateLoading
        || updateFiguresLoading
        || createAttachmentLoading
        || parkedItemDataLoading
        || createSourcePreviewLoading
    );

    const resetWatchdog = useWatchDog(
        pending || pristine,
        30 * 1000,
        () => {
            notify({
                children: 'You have some unsaved changes. Make sure to save your progress!',
                variant: 'default',
            });
        },
    );

    const onValueChange: typeof onValueChangeFromForm = useCallback(
        (...args) => {
            onValueChangeFromForm(...args);
            resetWatchdog();
        },
        [onValueChangeFromForm, resetWatchdog],
    );

    const handleSubmit = useCallback((finalValue: PartialFormValues) => {
        const figuresToDelete = finalValue?.figures
            ?.map((item) => {
                if (!item.deleted) {
                    return undefined;
                }
                if (!item.id) {
                    return undefined;
                }

                return {
                    id: item.id,
                    uuid: item.uuid,
                };
            })
            .filter(isDefined);
        const figuresToCreateOrUpdate = finalValue?.figures?.filter(
            (item) => !item.deleted && item.stale,
        ).map((item) => {
            const returnValue = { ...item };
            delete returnValue.stale;
            delete returnValue.deleted;
            return returnValue;
        });

        // NOTE: This will also start the pending state
        start({
            deleteRequests: figuresToDelete ?? [],
            saveRequests: (figuresToCreateOrUpdate ?? []) as FormValues['figures'],
        });

        const completeValue = finalValue as FormValues;
        if (entryId) {
            const entry = {
                id: entryId,
                figures: undefined,
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
                figures: undefined,
                ...completeValue.analysis,
                ...completeValue.details,
            } as EntryFormFields;
            createEntry({
                variables: {
                    entry: entry as FormType,
                },
            });
        }
    }, [createEntry, updateEntry, entryId, start]);

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

    const handleFigureChange: typeof onFigureChange = useCallback(
        (val, otherName) => {
            onFigureChange(
                (oldValue) => {
                    const newVal = typeof val === 'function'
                        ? val(oldValue)
                        : val;
                    return { ...newVal, stale: true };
                },
                otherName,
            );
        },
        [onFigureChange],
    );

    const handleFigureRemove: typeof onFigureRemove = useCallback(
        (index) => {
            onValueChange(
                (oldFigures: PartialFormValues['figures'] = []) => {
                    const figure = oldFigures[index];
                    if (!figure) {
                        return oldFigures;
                    }
                    const newFigures = [...oldFigures];
                    if (figure.id) {
                        newFigures.splice(index, 1, { ...figure, deleted: true });
                    } else {
                        newFigures.splice(index, 1);
                    }
                    return newFigures;
                },
                'figures',
            );
        },
        [onValueChange],
    );

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
            handleSelectedFigureChange(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({
                children: 'Added new figure!',
                variant: 'default',
            });
        },
        [onValueChange, value, notify, handleSelectedFigureChange],
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

                stale: true,
            };
            handleSelectedFigureChange(newFigure.uuid);
            onValueChange(
                [...(value.figures ?? []), newFigure],
                'figures' as const,
            );
            notify({
                children: 'Cloned figure!',
            });
        },
        [onValueChange, value.figures, notify, handleSelectedFigureChange],
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
                            actions={editMode && entryId && (
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
                                fig.deleted
                                    ? null
                                    : (
                                        <FigureInput
                                            key={fig.uuid}
                                            selectedFigure={selectedFigure}
                                            setSelectedFigure={handleSelectedFigureChange}
                                            index={index}
                                            value={fig}
                                            onChange={handleFigureChange}
                                            onRemove={handleFigureRemove}
                                            error={error?.fields?.figures?.members?.[fig.uuid]}
                                            disabled={loading || !processed}
                                            mode={mode}
                                            // eslint-disable-next-line max-len
                                            optionsDisabled={!!figureOptionsError || !!figureOptionsLoading}
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
                                            // eslint-disable-next-line max-len
                                            violenceCategoryOptions={figureOptionsData?.violenceList}
                                            osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                                            // eslint-disable-next-line max-len
                                            otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                                            trafficLightShown={trafficLightShown}
                                            onFigureClone={handleFigureClone}
                                            isRecommended={figureMapping[fig.uuid]?.role === 'RECOMMENDED'}
                                            reviewStatus={figureMapping[fig.uuid]?.reviewStatus}
                                            fieldStatuses={figureMapping[fig.uuid]?.fieldStatuses}
                                            defaultShownField={selectedFieldType}
                                        />
                                    )
                            ))}
                        </Section>
                    </TabPanel>
                </Tabs>
            </form>
        </>
    );
}

export default EntryForm;
