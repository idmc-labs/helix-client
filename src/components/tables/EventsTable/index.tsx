import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
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
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
} from '#components/tableHelpers';
import EventsFilter from '#views/Events/EventsFilter/index';
import { PurgeNull } from '#types';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import EventForm from '#components/forms/EventForm';
import ActionCell, { ActionProps } from './EventsAction';
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
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

// FIXME: crisis was previously single select, now is multiselect, @priyesh
const EVENT_LIST = gql`
    query EventList($ordering: String, $page: Int, $pageSize: Int, $name: String, $eventTypes:[String!], $crisisByIds: [ID!], $countries:[ID!]) {
        eventList(ordering: $ordering, page: $page, pageSize: $pageSize, name: $name, eventTypes:$eventTypes, crisisByIds: $crisisByIds, countries:$countries) {
            totalCount
            pageSize
            page
            results {
                eventType
                createdAt
                eventNarrative
                startDate
                endDate
                name
                id
                crisis {
                    name
                    id
                }
                countries {
                    id
                    name
                }
                totalStockIdpFigures
                totalFlowNdFigures
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
    mutation ExportEvents($name: String, $eventTypes: [String!], $crisisByIds: [ID!], $countries: [ID!]){
        exportEvents(name: $name, eventTypes: $eventTypes, crisisByIds: $crisisByIds, countries: $countries) {
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
}

function EventsTable(props: EventsProps) {
    const {
        className,
        crisis,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { notify } = useContext(NotificationContext);
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
    ] = useState<PurgeNull<EventListQueryVariables>>();

    const eventsVariables = useMemo(
        (): EventListQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...eventQueryFilters,
            // crisis: crisisId,
        }),
        [ordering, page, pageSize, eventQueryFilters],
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
            onCompleted: (response) => {
                const { exportEvents: exportEventResponse } = response;
                if (!exportEventResponse) {
                    return;
                }
                const { errors, ok } = exportEventResponse;
                if (errors) {
                    notify({ children: 'Sorry, could not complete the download!' });
                }
                if (ok) {
                    notify({ children: 'Downloaded successfully !' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleDownloadTableData = useCallback(
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
                    notify({ children: 'Sorry, Event could not be deleted !' });
                }
                if (result) {
                    refetchEvents(eventsVariables);
                    notify({ children: 'Event deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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

            return [
                createDateColumn<EventFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
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
                    }),
                    route.event,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<EventFields, string>(
                    'event_type',
                    'Type',
                    (item) => item.eventType,
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
                    'countries',
                    'Countries',
                    (item) => item.countries.map((c) => c.name).join(', '),
                ),
                createTextColumn<EventFields, string>(
                    'event_narrative',
                    'Event Narrative',
                    (item) => item.eventNarrative,
                    { sortable: true },
                ),
                createNumberColumn<EventFields, string>(
                    'total_stock_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                ),
                createNumberColumn<EventFields, string>(
                    'total_flow_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                ),
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
        <>
            <EventsFilter
                className={styles.filterContainer}
                setEventQueryFilters={setEventQueryFilters}
            />
            <Container
                className={className}
                contentClassName={styles.content}
                heading="Events"
                headerActions={(
                    <>
                        <Button
                            name={undefined}
                            variant="primary"
                            onClick={handleDownloadTableData}
                            disabled={exportingEvents}
                        >
                            Download
                        </Button>
                        {eventPermissions?.add && (
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
            >
                {totalEventsCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={eventsData?.eventList?.results}
                            keySelector={keySelector}
                            columns={columns}
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
        </>
    );
}

export default EventsTable;
