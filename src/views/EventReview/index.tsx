import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import { removeNull } from '@togglecorp/toggle-form';
import {
    isDefined,
    _cs,
    listToMap,
} from '@togglecorp/fujs';
import { Button, Pager } from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import useOptions from '#hooks/useOptions';
import ButtonLikeLink from '#components/ButtonLikeLink';
import Container from '#components/Container';
import {
    FIGURE_LIST,
    FIGURE_OPTIONS,
} from '#components/forms/EntryForm/queries';
import Status from '#components/tableHelpers/Status';
import {
    FigureListQuery,
    FigureListQueryVariables,
    FigureOptionsForEntryFormQuery,
    GetEventForReviewQuery,
    GetEventForReviewQueryVariables,
    SignOffEventMutation,
    SignOffEventMutationVariables,
} from '#generated/types';
import {
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
    FigureMetadata,
} from '#components/forms/EntryForm/types';
import EventForm from '#components/forms/EventForm';
import PageHeader from '#components/PageHeader';
import { EventListOption } from '#components/selections/EventListSelectInput';
import Preview from '#components/Preview';
import FigureInput from '#components/forms/EntryForm/FigureInput';
import NotificationContext from '#components/NotificationContext';
import DomainContext from '#components/DomainContext';
import route from '#config/routes';

import styles from './styles.css';

const SIGN_OFF_EVENT = gql`
    mutation SignOffEvent($id: ID!) {
        signOffEvent(eventId: $id) {
            result {
                id
                reviewStatus
                reviewStatusDisplay
            }
            ok
            errors
        }
    }
`;

const GET_EVENT = gql`
    query GetEventForReview($id: ID!) {
        event(id: $id) {
            id
            name
            reviewStatus
            reviewStatusDisplay
        }
    }
`;

const mode = 'view';
const trafficLightShown = mode === 'view';

function transform(figures: NonNullable<FigureListQuery['figureList']>['results']) {
    const transformedFigures = figures?.map((figure) => ({
        ...figure,

        entryObject: figure.entry,

        entry: figure.entry?.id,
        event: figure.event?.id,
        country: figure.country?.id,
        geoLocations: figure.geoLocations?.results,
        tags: figure.tags?.map((tag) => tag.id),
        sources: figure.sources?.results?.map((item) => item.id),
        disaggregationAge: figure.disaggregationAge?.results,
        disasterSubType: figure.disasterSubType?.id,
        violenceSubType: figure.violenceSubType?.id,
        osvSubType: figure.osvSubType?.id,
        otherSubType: figure.otherSubType?.id,
        contextOfViolence: figure.contextOfViolence?.map((c) => c.id),

        eventReviewStatus: figure.event.reviewStatus,
    })) ?? [];
    return removeNull(transformedFigures);
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noOp() {
}

interface Props {
    className: string;
}

function EventReview(props: Props) {
    const { user } = useContext(DomainContext);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const {
        data: figureOptionsData,
        loading: figureOptionsLoading,
        error: figureOptionsError,
    } = useQuery<FigureOptionsForEntryFormQuery>(FIGURE_OPTIONS);

    const eventPermission = user?.permissions?.event;
    const { className } = props;
    const { eventId } = useParams<{ eventId: string }>();
    const [selectedFigure, setSelectedFigure] = useState<string | undefined>();

    // NOTE: We are not using useOptions for events as it's more detailed event
    // object
    const [
        events,
        setEvents,
    ] = useState<EventListOption[] | null | undefined>([]);
    const [, setTagOptions] = useOptions('tag');
    const [, setViolenceContextOptions] = useOptions('contextOfViolence');
    const [, setOrganizations] = useOptions('organization');

    const [
        figureMetadataMapping,
        setFigureMetadataMapping,
    ] = useState<{
        [key: string]: FigureMetadata | undefined,
    }>({});

    const {
        page,
        rawPage,
        setPage,
        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState({
        filter: {},
    });

    const figureListVariables = useMemo(
        (): FigureListQueryVariables => ({
            eventId: isDefined(eventId) ? [eventId] : undefined,
            page,
            pageSize,
        }),
        [
            eventId,
            page,
            pageSize,
        ],
    );

    const {
        loading: getFiguresLoading,
        error: eventDataError,
        refetch: refetchEvent,
        previousData: figuresPreviousData,
        data: figureLists = figuresPreviousData,
    } = useQuery<FigureListQuery, FigureListQueryVariables>(FIGURE_LIST, {
        skip: !figureListVariables,
        variables: figureListVariables,
        onCompleted: (response) => {
            const { figureList } = removeNull(response);
            setEvents(figureList?.results?.map((item) => item.event).filter(isDefined));

            setTagOptions(figureList?.results?.flatMap((item) => item.tags).filter(isDefined));

            setViolenceContextOptions(
                figureList?.results?.flatMap((item) => item.contextOfViolence).filter(isDefined),
            );

            const organizations = figureList?.results
                ?.flatMap((item) => item.sources?.results)
                .filter(isDefined) ?? [];
            setOrganizations(organizations);

            const mapping = listToMap(
                figureList?.results ?? [],
                (figure) => figure.uuid,
                (figure) => ({
                    role: figure.role,
                    reviewStatus: figure.reviewStatus,
                    fieldStatuses: figure.lastReviewCommentStatus,
                }),
            );
            setFigureMetadataMapping(mapping);
        },
    });

    const eventVariables = useMemo(
        (): GetEventForReviewQueryVariables => ({
            id: eventId,
        }),
        [eventId],
    );
    const {
        loading: eventResponseLoading,
        previousData: eventsPreviousData,
        data: eventResponse = eventsPreviousData,
    } = useQuery<GetEventForReviewQuery, GetEventForReviewQueryVariables>(GET_EVENT, {
        variables: eventVariables,
        skip: !eventVariables,
    });

    const figureValue = useMemo(
        () => transform(figureLists?.figureList?.results),
        [figureLists],
    );

    const [
        signOffEvent,
        { loading: signOffLoading },
    ] = useMutation<SignOffEventMutation, SignOffEventMutationVariables>(
        SIGN_OFF_EVENT,
        {
            onCompleted: (response) => {
                const { signOffEvent: signOffResponse } = response;
                refetchEvent();
                if (!signOffResponse) {
                    return;
                }
                const { errors, result } = signOffResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Signed off successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleFigureMetadataChange = useCallback(
        (
            val: FigureMetadata
                | ((oldValue: FigureMetadata | undefined) => FigureMetadata)
                | undefined,
            key: string,
        ) => {
            setFigureMetadataMapping((oldMapping) => ({
                ...oldMapping,
                [key]: typeof val === 'function'
                    ? val(oldMapping[key])
                    : val,
            }));
        },
        [],
    );

    const handleSignOffEvent = useCallback(
        (id: string) => {
            signOffEvent({
                variables: {
                    id,
                },
            });
        },
        [signOffEvent],
    );

    const {
        preview,
        attachment,
    } = useMemo(
        () => {
            const selectedFigureEntry = figureValue.find(
                (v) => v.uuid === selectedFigure,
            );
            return {
                preview: selectedFigureEntry?.entryObject?.preview,
                attachment: selectedFigureEntry?.entryObject?.document,
            };
        },
        [
            figureValue,
            selectedFigure,
        ],
    );

    const totalFigureItemCount = figureLists?.figureList?.totalCount ?? 0;

    const eventName = eventResponse?.event?.name;
    const eventReviewStatus = eventResponse?.event?.reviewStatus;

    const disableSignOff = eventResponseLoading || signOffLoading;

    if (eventDataError) {
        return (
            <div className={_cs(styles.loadFailed, className)}>
                Failed to retrieve event data!
            </div>
        );
    }

    return (
        <div className={_cs(styles.eventReview, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title={eventName ?? 'Event Review'}
                    icons={eventReviewStatus && (
                        <Status
                            className={styles.eventStatus}
                            status={eventReviewStatus}
                        />
                    )}
                    actions={(
                        <>
                            <ButtonLikeLink
                                title="View Entry"
                                route={route.event}
                                attrs={{ eventId }}
                            >
                                View Event
                            </ButtonLikeLink>
                            {eventPermission?.sign_off && eventReviewStatus === 'APPROVED' && (
                                <Button
                                    name={eventId}
                                    onClick={handleSignOffEvent}
                                    disabled={disableSignOff}
                                >
                                    Sign Off
                                </Button>
                            )}
                        </>
                    )}
                />
                <EventForm
                    className={styles.eventForm}
                    id={eventId}
                    readOnly
                    eventHiddenWhileReadonly
                />
                <Container
                    heading="Figures"
                    contentClassName={styles.figures}
                    footerContent={(
                        <Pager
                            activePage={rawPage}
                            itemsCount={totalFigureItemCount}
                            maxItemsPerPage={rawPageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={setPageSize}
                        />
                    )}
                >
                    {figureValue?.length === 0 ? (
                        <div>
                            No figures yet
                        </div>
                    ) : figureValue?.map((fig, index) => (
                        <FigureInput
                            key={fig.uuid}
                            selectedFigure={selectedFigure}
                            setSelectedFigure={setSelectedFigure}
                            index={index}
                            value={fig}
                            onChange={noOp}
                            onRemove={noOp}
                            error={undefined}
                            disabled={getFiguresLoading}
                            mode={mode}
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
                            violenceCategoryOptions={figureOptionsData?.violenceList}
                            osvSubTypeOptions={figureOptionsData?.osvSubTypeList}
                            // eslint-disable-next-line max-len
                            otherSubTypeOptions={figureOptionsData?.otherSubTypeList}
                            trafficLightShown={trafficLightShown}
                            metadata={figureMetadataMapping[fig.uuid]}
                            setMetadata={handleFigureMetadataChange}
                        />
                    ))}
                </Container>
            </div>
            <div className={styles.sideContent}>
                <Preview
                    className={styles.stickyContainer}
                    attachment={attachment}
                    preview={preview}
                />
            </div>
        </div>
    );
}

export default EventReview;
