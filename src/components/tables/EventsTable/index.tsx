import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    SortContext,
    Pager,
    Modal,
    Button,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import EventsFilter from '#views/Events/EventsFilter/index';
import { PurgeNull } from '#types';

import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import EventForm from '#components/forms/EventForm';
import ActionCell, { ActionProps } from './EventsAction';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';
import { CrisisOption } from '#components/selections/CrisisSelectInput';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import useModalState from '#hooks/useModalState';
import {
    EventListQuery,
    EventListQueryVariables,
    DeleteEventMutation,
    DeleteEventMutationVariables,
    ExportEventsMutation,
    ExportEventsMutationVariables,
    Qa_Rule_Type as QaRuleType,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

const EVENT_LIST = gql`
    query EventList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $name: String,
        $eventTypes:[String!],
        $crisisByIds: [ID!],
        $countries:[ID!],
        $violenceSubTypes: [ID!],
        $disasterSubTypes: [ID!]
        $osvSubTypeByIds: [ID!],
        $glideNumbers: [String!],
        $createdByIds: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
        $qaRules: [String!],
        $ignoreQa: Boolean,
    ) {
        eventList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            name: $name,
            eventTypes:$eventTypes,
            crisisByIds: $crisisByIds,
            countries: $countries,
            violenceSubTypes: $violenceSubTypes,
            disasterSubTypes: $disasterSubTypes,
            createdByIds: $createdByIds,
            startDate_Gte: $startDate_Gte,
            endDate_Lte: $endDate_Lte,
            qaRules: $qaRules,
            ignoreQa: $ignoreQa,
            osvSubTypeByIds: $osvSubTypeByIds,
            glideNumbers: $glideNumbers,
        ) {
            totalCount
            pageSize
            page
            results {
                eventType
                createdAt
                createdBy {
                    id
                    fullName
                }
                startDate
                endDate
                name
                id
                oldId
                entryCount
                crisis {
                    name
                    id
                }
                countries {
                    id
                    idmcShortName
                }
                disasterSubType {
                    id
                    name
                }
                violenceSubType {
                    id
                    name
                }
                totalStockIdpFigures
                totalFlowNdFigures
                reviewCount {
                    reviewCompleteCount
                    signedOffCount
                    toBeReviewedCount
                    underReviewCount
                }
            }
        }
    }
`;

const EVENT_DELETE = gql`
    mutation DeleteEvent($id: ID!) {
        deleteEvent(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;
const EVENT_DOWNLOAD = gql`
    mutation ExportEvents(
        $name: String,
        $eventTypes:[String!],
        $crisisByIds: [ID!],
        $countries:[ID!],
        $violenceSubTypes: [ID!],
        $disasterSubTypes: [ID!]
        $osvSubTypeByIds: [ID!],
        $glideNumbers: [String!],
        $createdByIds: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
        $qaRules: [String!],
        $ignoreQa: Boolean,
    ) {
        exportEvents(
            name: $name,
            eventTypes:$eventTypes,
            crisisByIds: $crisisByIds,
            countries: $countries,
            violenceSubTypes: $violenceSubTypes,
            disasterSubTypes: $disasterSubTypes,
            createdByIds: $createdByIds,
            startDate_Gte: $startDate_Gte,
            endDate_Lte: $endDate_Lte,
            qaRules: $qaRules,
            ignoreQa: $ignoreQa,
            osvSubTypeByIds: $osvSubTypeByIds,
            glideNumbers: $glideNumbers,
        ) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: EventFields) => item.id;

interface EventsProps {
    className?: string;

    crisis?: CrisisOption | null;
    qaMode?: 'MULTIPLE_RF' | 'NO_RF' | 'IGNORE_QA' | undefined;
    title?: string;
}

function EventsTable(props: EventsProps) {
    const {
        className,
        crisis,
        qaMode,
        title,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const qaRules: QaRuleType[] | undefined = useMemo(
        () => {
            if (qaMode === 'MULTIPLE_RF') {
                return ['HAS_MULTIPLE_RECOMMENDED_FIGURES'];
            }
            if (qaMode === 'NO_RF') {
                return ['HAS_NO_RECOMMENDED_FIGURES'];
            }
            return undefined;
        },
        [qaMode],
    );
    const ignoreQa: boolean | undefined = useMemo(
        () => {
            if (!qaMode) {
                return undefined;
            }
            return qaMode === 'IGNORE_QA';
        },
        [qaMode],
    );

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState();

    const crisisId = crisis?.id;

    const [
        eventQueryFilters,
        setEventQueryFilters,
    ] = useState<PurgeNull<EventListQueryVariables> | undefined>(
        crisisId ? { crisisByIds: [crisisId] } : undefined,
    );

    const onFilterChange = React.useCallback(
        (value: PurgeNull<EventListQueryVariables>) => {
            setEventQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const eventsVariables = useMemo(
        (): EventListQueryVariables => ({
            ordering,
            page,
            pageSize,
            qaRules,
            ignoreQa,
            ...eventQueryFilters,
        }),
        [ordering, page, pageSize, qaRules, ignoreQa, eventQueryFilters],
    );

    const {
        previousData,
        data: eventsData = previousData,
        loading: loadingEvents,
        refetch: refetchEvents,
    } = useQuery<EventListQuery, EventListQueryVariables>(EVENT_LIST, {
        variables: eventsVariables,
    });

    const [
        exportEvents,
        { loading: exportingEvents },
    ] = useMutation<ExportEventsMutation, ExportEventsMutationVariables>(
        EVENT_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEvents: exportEventResponse } = response;
                if (!exportEventResponse) {
                    return;
                }
                const { errors, ok } = exportEventResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
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

    const handleExportTableData = useCallback(
        () => {
            exportEvents({
                variables: eventQueryFilters,
            });
        },
        [exportEvents, eventQueryFilters],
    );

    const [
        deleteEvent,
        { loading: deletingEvent },
    ] = useMutation<DeleteEventMutation, DeleteEventMutationVariables>(
        EVENT_DELETE,
        {
            onCompleted: (response) => {
                const { deleteEvent: deleteEventRes } = response;
                if (!deleteEventRes) {
                    return;
                }
                const { errors, result } = deleteEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchEvents(eventsVariables);
                    notify({
                        children: 'Event deleted successfully!',
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

    const handleEventCreate = React.useCallback(() => {
        refetchEvents(eventsVariables);
        hideAddEventModal();
    }, [refetchEvents, eventsVariables, hideAddEventModal]);

    const handleEventDelete = useCallback(
        (id: string) => {
            deleteEvent({
                variables: { id },
            });
        },
        [deleteEvent],
    );

    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;
    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<EventFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    crisis: datum.crisis,
                    onDelete: eventPermissions?.delete ? handleEventDelete : undefined,
                    onEdit: eventPermissions?.change ? showAddEventModal : undefined,
                }),
            };

            // eslint-disable-next-line max-len
            const progressColumn: TableColumn<EventFields, string, StackedProgressProps, TableHeaderCellProps> = {
                id: 'progress',
                title: 'Progress',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: StackedProgressCell,
                cellRendererParams: (_, datum) => ({
                    signedOff: datum.reviewCount?.signedOffCount,
                    reviewCompleted: datum.reviewCount?.reviewCompleteCount,
                    underReview: datum.reviewCount?.underReviewCount,
                    toBeReviewed: datum.reviewCount?.toBeReviewedCount,
                }),
            };

            return [
                createDateColumn<EventFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                crisisId
                    ? undefined
                    : createLinkColumn<EventFields, string>(
                        'crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.crisis?.name,
                            attrs: { crisisId: item.crisis?.id },
                            ext: undefined,
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                createLinkColumn<EventFields, string>(
                    'name',
                    'Name',
                    (item) => ({
                        title: item.name,
                        attrs: { eventId: item.id },
                        ext: item.oldId
                            ? `/events/${item.oldId}`
                            : undefined,
                    }),
                    route.event,
                    { sortable: true },
                ),
                createDateColumn<EventFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<EventFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'countries__idmc_short_name',
                    'Countries',
                    (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                    { sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'event_type',
                    'Cause',
                    (item) => item.eventType,
                    { sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'disaster_sub_type',
                    'Disaster Subtype',
                    (item) => item.disasterSubType?.name,
                    { sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'violence_sub_type',
                    'Violence Subtype',
                    (item) => item.violenceSubType?.name,
                    { sortable: true },
                ),
                createNumberColumn<EventFields, string>(
                    'entry_count',
                    'No. of Entries',
                    (item) => item.entryCount,
                    { sortable: true },
                ),
                createNumberColumn<EventFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<EventFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                    { sortable: true },
                ),
                progressColumn,
                actionColumn,
            ].filter(isDefined);
        },
        [
            crisisId,
            showAddEventModal,
            handleEventDelete,
            eventPermissions?.delete,
            eventPermissions?.change,
        ],
    );
    const totalEventsCount = eventsData?.eventList?.totalCount ?? 0;

    return (
        <Container
            className={className}
            contentClassName={styles.content}
            heading={title || 'Events'}
            headerActions={(
                <>
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingEvents}
                    >
                        Export
                    </ConfirmButton>
                    {eventPermissions?.add && !qaMode && (
                        <Button
                            name={undefined}
                            onClick={showAddEventModal}
                            disabled={loadingEvents}
                        >
                            Add Event
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalEventsCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
            description={(
                <EventsFilter
                    crisisSelectionDisabled={!!crisisId}
                    onFilterChange={onFilterChange}
                />
            )}
        >
            {totalEventsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={eventsData?.eventList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {(loadingEvents || deletingEvent) && <Loading absolute />}
            {!loadingEvents && totalEventsCount <= 0 && (
                <Message
                    message="No events found."
                />
            )}
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    heading={editableEventId ? 'Edit Event' : 'Add Event'}
                >
                    <EventForm
                        id={editableEventId}
                        onEventCreate={handleEventCreate}
                        defaultCrisis={crisis}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default EventsTable;
