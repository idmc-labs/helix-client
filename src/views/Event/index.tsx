import React, { useMemo, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { _cs, isDefined, mapToList } from '@togglecorp/fujs';
import { Button, Modal } from '@togglecorp/toggle-ui';
import { IoFilterOutline, IoClose } from 'react-icons/io5';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    EventSummaryQuery,
    EventSummaryQueryVariables,
    EventAggregationsQuery,
    EventAggregationsQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
import SmartLink from '#components/SmartLink';
import { PurgeNull } from '#types';
import useFilterState from '#hooks/useFilterState';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import useOptions from '#hooks/useOptions';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import { expandObject, mergeBbox, hasNoData, getNow } from '#utils/common';
import useSidebarLayout from '#hooks/useSidebarLayout';
import NdChart from '#components/NdChart';
import IdpChart from '#components/IdpChart';
import FloatingButton from '#components/FloatingButton';
import CountriesMap, { Bounds } from '#components/CountriesMap';
import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';
import TextBlock from '#components/TextBlock';
import ButtonLikeLink from '#components/ButtonLikeLink';
import Status from '#components/tableHelpers/Status';
import EventForm from '#components/forms/EventForm';
import useModalState from '#hooks/useModalState';
import Message from '#components/Message';
import route from '#config/routes';

import CountriesEntriesFiguresTable from './CountriesEntriesFiguresTable';
import styles from './styles.css';

const EVENT = gql`
    query EventSummary($id: ID!) {
        event(id: $id) {
            id
            name
            eventType
            eventTypeDisplay
            totalFlowNdFigures
            totalStockIdpFigures
            stockIdpFiguresMaxEndDate
            reviewStatus
            crisis {
                id
                name
            }
            startDate
            endDate
            actor {
                id
                name
            }
            countries {
                id
                idmcShortName
                boundingBox
                geojsonUrl
            }
            eventNarrative
            violence {
                id
                name
            }
            violenceSubType {
                id
                name
            }
            contextOfViolence {
                id
                name
            }
            disasterSubType {
                id
                name
            }
            otherSubType {
                id
                name
            }
            assignee {
                id
                username
            }
            eventCodes {
                id
                eventCode
            }
        }
    }
`;

const EVENT_AGGREGATIONS = gql`
    query EventAggregations($filters: FigureExtractionFilterDataInputType!) {
        figureAggregations(filters: $filters) {
            idpsConflictFigures {
                date
                value
            }
            idpsDisasterFigures {
                date
                value
            }
            ndsConflictFigures {
                date
                value
            }
            ndsDisasterFigures {
                date
                value
            }
        }
    }
`;

const now = getNow();

interface EventProps {
    className?: string;
}

function Event(props: EventProps) {
    const { className } = props;

    const { eventId } = useParams<{ eventId: string }>();
    const { user } = useContext(DomainContext);
    const [, setEventOptions] = useOptions('event');

    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState<{ id: string, clone?: boolean }>();

    const figuresFilterState = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });
    const {
        filter: figuresFilter,
        rawFilter: rawFiguresFilter,
        initialFilter: initialFiguresFilter,
        setFilter: setFiguresFilter,
    } = figuresFilterState;

    const eventVariables = useMemo(
        (): EventSummaryQueryVariables => ({ id: eventId }),
        [eventId],
    );

    const eventAggregationsVariables = useMemo(
        (): EventAggregationsQueryVariables | undefined => ({
            filters: expandObject(
                figuresFilter,
                {
                    filterFigureEvents: [eventId],
                },
            ),
        }),
        [eventId, figuresFilter],
    );

    const {
        data: eventData,
        loading: eventDataLoading,
        // error: eventDataLoadingError,
    } = useQuery<EventSummaryQuery, EventSummaryQueryVariables>(EVENT, {
        variables: eventVariables,
        onCompleted: (response) => {
            const { event: eventRes } = response;
            if (!eventRes) {
                return;
            }
            // NOTE: we are setting this options so that we can use event
            // option when adding event on the event page
            const { id, name } = eventRes;
            setEventOptions([{ id, name }]);
        },
    });

    const {
        data: eventAggregations,
        loading: eventAggregationsLoading,
        // error: eventAggregationsError,
    } = useQuery<EventAggregationsQuery>(EVENT_AGGREGATIONS, {
        variables: eventAggregationsVariables,
        skip: !eventAggregationsVariables,
    });

    const loading = eventDataLoading || eventAggregationsLoading;
    // const errored = !!eventDataLoadingError || !!eventAggregationsError;
    // const disabled = loading || errored;

    const figureHiddenColumns = ['crisis' as const, 'event' as const];

    const eventPermissions = user?.permissions?.event;
    const figurePermissions = user?.permissions?.figure;

    const eventYear = new Date(
        eventData?.event?.endDate ?? eventData?.event?.startDate ?? now,
    ).getFullYear();

    const eventStatus = eventData?.event?.reviewStatus;

    const bounds = mergeBbox(
        eventData?.event?.countries
            ?.map((country) => country.boundingBox as (GeoJSON.BBox | null | undefined))
            .filter(isDefined),
    );

    const countries = eventData?.event?.countries;

    const {
        showSidebar,
        containerClassName,
        sidebarClassName,
        sidebarSpaceReserverElement,
        setShowSidebarTrue,
        setShowSidebarFalse,
    } = useSidebarLayout();

    const floatingButtonVisibility = useCallback(
        (scroll: number) => scroll >= 80 && !showSidebar,
        [showSidebar],
    );

    const appliedFiltersCount = mapToList(
        figuresFilter,
        (item) => !hasNoData(item),
    ).filter(Boolean).length;

    // NOTE: show review link if user can sign-off and event is approved/signed-off
    // NOTE: or user can approve and user is the assignee
    const reviewLinkShown = useMemo(
        () => ((
            (eventData?.event?.reviewStatus === 'APPROVED' || eventData?.event?.reviewStatus === 'SIGNED_OFF')
            && !!eventPermissions?.sign_off
        ) || (
            !!figurePermissions?.approve
            && !!eventData?.event?.assignee
            && eventData.event.assignee.id === user?.id
        )),
        [eventData, figurePermissions, eventPermissions, user],
    );

    const handleEventEdit = useCallback(
        (id: string) => {
            showAddEventModal({ id, clone: false });
        },
        [showAddEventModal],
    );

    const handleEventClone = useCallback(
        (id: string) => {
            showAddEventModal({ id, clone: true });
        },
        [showAddEventModal],
    );

    const narrative = eventData?.event?.eventNarrative;

    return (
        <div className={_cs(styles.event, containerClassName, className)}>
            {sidebarSpaceReserverElement}
            <div className={styles.pageContent}>
                <PageHeader
                    title={eventData?.event?.name ?? 'Event'}
                    icons={!!eventStatus && (
                        <Status
                            className={styles.eventStatus}
                            status={eventStatus}
                        />
                    )}
                    description={!showSidebar && (
                        <Button
                            name={undefined}
                            onClick={setShowSidebarTrue}
                            disabled={showSidebar}
                            icons={<IoFilterOutline />}
                        >
                            {appliedFiltersCount > 0 ? `Filters (${appliedFiltersCount})` : 'Filters'}
                        </Button>
                    )}
                    actions={(
                        <>
                            {reviewLinkShown && (
                                <ButtonLikeLink
                                    title="Review"
                                    route={route.eventReview}
                                    attrs={{ eventId }}
                                >
                                    Review Event
                                </ButtonLikeLink>
                            )}
                            {eventPermissions?.add && (
                                <Button
                                    name={eventId}
                                    onClick={handleEventClone}
                                    disabled={loading}
                                >
                                    Clone Event
                                </Button>
                            )}
                            {eventPermissions?.change && (
                                <Button
                                    name={eventId}
                                    onClick={handleEventEdit}
                                    disabled={loading}
                                >
                                    Edit Event
                                </Button>
                            )}
                        </>
                    )}
                />
                <div className={styles.stats}>
                    <TextBlock
                        label="Cause"
                        value={eventData?.event?.eventTypeDisplay}
                    />
                    <TextBlock
                        label="Start Date"
                        value={eventData?.event?.startDate}
                    />
                    <TextBlock
                        label="End Date"
                        value={eventData?.event?.endDate}
                    />
                    {eventData?.event?.eventType === 'CONFLICT' && (
                        <>
                            <TextBlock
                                // NOTE: This block is hidden
                                className={styles.hidden}
                                label="Actor"
                                value={eventData?.event?.actor?.name}
                            />
                            <TextBlock
                                label="Violence Type"
                                value={eventData?.event?.violence?.name}
                            />
                            <TextBlock
                                label="Violence Subtype"
                                value={eventData?.event?.violenceSubType?.name}
                            />
                            <TextBlock
                                label="Context of Violence"
                                value={eventData?.event?.contextOfViolence?.map((context) => context.name).join(', ')}
                            />
                        </>
                    )}
                    {eventData?.event?.eventType === 'DISASTER' && (
                        <TextBlock
                            label="Hazard Subtype"
                            value={eventData?.event?.disasterSubType?.name}
                        />
                    )}
                    {eventData?.event?.eventType === 'OTHER' && (
                        <TextBlock
                            label="Subtype"
                            value={eventData?.event?.otherSubType?.name}
                        />
                    )}
                    <TextBlock
                        label="Event Codes"
                        value={eventData?.event?.eventCodes?.map((code) => code.eventCode).join(', ')}
                    />
                    <TextBlock
                        label="Countries"
                        value={countries?.map((country) => (
                            <SmartLink
                                key={country.id}
                                route={route.country}
                                attrs={{ countryId: country.id }}
                            >
                                {country.idmcShortName}
                            </SmartLink>
                        ))}
                    />
                    <TextBlock
                        label="Crisis"
                        value={eventData?.event?.crisis && (
                            <SmartLink
                                route={route.crisis}
                                attrs={{ crisisId: eventData.event.crisis.id }}
                            >
                                {eventData.event.crisis.name}
                            </SmartLink>
                        )}
                    />
                </div>
                <div className={styles.mainContent}>
                    <FiguresFilterOutput
                        className={styles.filterOutputs}
                        filterState={figuresFilterState.rawFilter}
                    />
                    <Container
                        className={styles.mapSection}
                        compact
                    >
                        <CountriesMap
                            className={styles.mapContainer}
                            bounds={bounds as Bounds | undefined}
                            countries={eventData?.event?.countries}
                        />
                    </Container>
                    <div className={styles.charts}>
                        <NdChart
                            conflictData={
                                eventAggregations
                                    ?.figureAggregations
                                    ?.ndsConflictFigures
                            }
                            disasterData={
                                eventAggregations
                                    ?.figureAggregations
                                    ?.ndsDisasterFigures
                            }
                        />
                        <IdpChart
                            conflictData={
                                eventAggregations
                                    ?.figureAggregations
                                    ?.idpsConflictFigures
                            }
                            disasterData={
                                eventAggregations
                                    ?.figureAggregations
                                    ?.idpsDisasterFigures
                            }
                        />
                    </div>
                    <CountriesEntriesFiguresTable
                        className={styles.countriesEntriesFiguresTable}
                        eventId={eventId}
                        eventYear={eventYear}
                        figuresFilterState={figuresFilterState}
                    />
                    <Container
                        className={styles.overview}
                    >
                        <Container
                            heading="Narrative"
                            borderless
                        >
                            {narrative ? (
                                <MarkdownPreview
                                    markdown={narrative}
                                />
                            ) : (
                                <Message
                                    message="No narrative found."
                                />
                            )}
                        </Container>
                    </Container>
                </div>
                <Container
                    className={_cs(styles.filters, sidebarClassName)}
                    heading="Filters"
                    contentClassName={styles.filtersContent}
                    headerActions={(
                        <Button
                            name={undefined}
                            onClick={setShowSidebarFalse}
                            transparent
                            title="Close"
                        >
                            <IoClose />
                        </Button>
                    )}
                >
                    <AdvancedFiguresFilter
                        currentFilter={rawFiguresFilter}
                        initialFilter={initialFiguresFilter}
                        onFilterChange={setFiguresFilter}
                        hiddenFields={figureHiddenColumns}
                        events={[eventId]}
                    />
                </Container>
            </div>
            <FloatingButton
                name={undefined}
                onClick={setShowSidebarTrue}
                icons={<IoFilterOutline />}
                variant="primary"
                visibleOn={floatingButtonVisibility}
            >
                {appliedFiltersCount > 0 ? `Filters (${appliedFiltersCount})` : 'Filters'}
            </FloatingButton>
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    // eslint-disable-next-line no-nested-ternary
                    heading={editableEventId?.id
                        ? (editableEventId?.clone ? 'Clone Event' : 'Edit Event')
                        : 'Add Event'}
                    size="large"
                    freeHeight
                >
                    <EventForm
                        onEventCreate={hideAddEventModal}
                        onEventFormCancel={hideAddEventModal}
                        id={editableEventId?.id}
                        clone={editableEventId?.clone}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Event;
