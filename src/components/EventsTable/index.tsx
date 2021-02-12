import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,
    Numeral,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import EventForm from '#components/EventForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import StringCell from '#components/tableHelpers/StringCell';
import ActionCell, { ActionProps } from './EventsAction';
import { CrisisOption } from '#components/CrisisSelectInput';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';
import {
    EventListQuery,
    EventListQueryVariables,
    DeleteEventMutation,
    DeleteEventMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

interface Entity {
    id: string;
    name: string | undefined;
}

const EVENT_LIST = gql`
    query EventList($ordering: String, $page: Int, $pageSize: Int, $nameContains: String, $crisis: ID) {
        eventList(ordering: $ordering, page: $page, pageSize: $pageSize, nameContains: $nameContains, crisis: $crisis) {
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
                totalStockFigures
                totalFlowFigures
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

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
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

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;
    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);
    const { notify } = useContext(NotificationContext);
    const [
        shouldShowAddEventModal,
        editableEventId,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState();

    const crisisId = crisis?.id;

    const eventsVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            nameContains: search,
            crisis: crisisId,
        }),
        [ordering, page, pageSize, search, crisisId],
    );

    const {
        data: eventsData,
        loading: loadingEvents,
        refetch: refetchEvents,
    } = useQuery<EventListQuery, EventListQueryVariables>(EVENT_LIST, {
        variables: eventsVariables,
    });

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
            type stringKeys = ExtractKeys<EventFields, string>;
            type numberKeys = ExtractKeys<EventFields, number>;
            type entitiesKeys = ExtractKeys<EventFields, Array<Entity | null | undefined>>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName],
                }),
            });
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName]?.map((item) => item.name).join(', '),
                }),
            });
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName],
                }),
            });
            const numberColumn = (colName: numberKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
                }),
            });

            // Specific columns
            const nameColumn: TableColumn<EventFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'name',
                title: 'Event',
                cellAsHeader: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'name'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.name,
                    route: route.event,
                    attrs: { eventId: datum.id },
                }),
            };
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
            const crisisColumn: TableColumn<EventFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'crisis',
                title: 'Crisis',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'crisis'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.crisis?.name,
                    route: route.crisis,
                    attrs: { crisisId: datum.crisis?.id },
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                crisisId ? undefined : crisisColumn,
                nameColumn,
                createColumn(stringColumn, 'eventType', 'Type'),
                createColumn(dateColumn, 'startDate', 'Start Date'),
                createColumn(dateColumn, 'endDate', 'End Date'),
                createColumn(entitiesColumn, 'countries', 'Country'),
                createColumn(stringColumn, 'eventNarrative', 'Narrative'),
                createColumn(numberColumn, 'totalStockFigures', 'Stock'),
                createColumn(numberColumn, 'totalFlowFigures', 'Flow'),
                actionColumn,
            ].filter(isDefined);
        },
        [
            crisisId,
            showAddEventModal,
            setSortState,
            validSortState,
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
            heading="Events"
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={search}
                        placeholder="Search"
                        onChange={setSearch}
                    />
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
                <Table
                    className={styles.table}
                    data={eventsData?.eventList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
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
