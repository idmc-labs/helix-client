import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
/*
import {
    IoIosSearch,
} from 'react-icons/io';
 */
import {
    // TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Button,
    Modal,
} from '@togglecorp/toggle-ui';

import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import EventForm from '#components/EventForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';

import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

import {
    CrisisQuery,
    CrisisQueryVariables,
    EventsForCrisisQuery,
    EventsForCrisisQueryVariables,
    DeleteEventMutation,
    DeleteEventMutationVariables,
} from '#generated/types';
import styles from './styles.css';

type EventFields = NonNullable<NonNullable<EventsForCrisisQuery['eventList']>['results']>[number];

interface Entity {
    id: string;
    name: string | undefined;
}

const CRISIS = gql`
    query Crisis($id: ID!) {
        crisis(id: $id) {
            id
            crisisNarrative
            name
        }
    }
`;

const EVENT_LIST = gql`
    query EventsForCrisis($ordering: String, $page: Int, $pageSize: Int, $crisis: ID) {
        eventList(ordering: $ordering, page: $page, pageSize: $pageSize, crisis: $crisis) {
            totalCount
            pageSize
            page
            results {
                actor {
                    name
                    id
                }
                trigger {
                    name
                    id
                }
                violence {
                    name
                    id
                }
                eventType
                createdAt
                eventNarrative
                startDate
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
            }
        }
    }
`;

const EVENT_DELETE = gql`
    mutation DeleteEvent($id: ID!) {
        deleteEvent(id: $id) {
            errors {
                field
                messages
            }
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

interface CrisisProps {
    className?: string;
}

function Crisis(props: CrisisProps) {
    const { className } = props;

    const { crisisId } = useParams<{ crisisId: string }>();

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;
    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    // const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(25);

    const [shouldShowAddEventModal, showAddEventModal, hideAddEventModal] = useModalState();
    const [eventIdToEdit, setEventIdToEdit] = useState<string | undefined>();

    const closeAddEventModal = useCallback(
        () => {
            hideAddEventModal();
            setEventIdToEdit(undefined);
        },
        [hideAddEventModal],
    );

    const eventsVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            crisis: crisisId,
            // name: search,
        }),
        [ordering, page, pageSize, crisisId],
    );

    const crisisVariables = useMemo(
        (): CrisisQueryVariables => ({
            id: crisisId,
        }),
        [crisisId],
    );

    const { data: crisisData } = useQuery<CrisisQuery, CrisisQueryVariables>(CRISIS, {
        variables: crisisVariables,
    });

    const {
        data: eventsData,
        loading: loadingEvents,
        refetch: refetchEvents,
    } = useQuery<EventsForCrisisQuery, EventsForCrisisQueryVariables>(EVENT_LIST, {
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
                const { errors } = deleteEventRes;
                if (!errors) {
                    refetchEvents(eventsVariables);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleEventCreate = React.useCallback(() => {
        refetchEvents(eventsVariables);
        closeAddEventModal();
    }, [refetchEvents, eventsVariables, closeAddEventModal]);

    const handleEventDelete = useCallback(
        (id: string) => {
            deleteEvent({
                variables: { id },
            });
        },
        [deleteEvent],
    );

    const handleEventEdit = useCallback(
        (id: string) => {
            showAddEventModal();
            setEventIdToEdit(id);
        },
        [showAddEventModal],
    );

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<EventFields, string>;
            type entityKeys = ExtractKeys<EventFields, Entity>;
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
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName],
                }),
            });
            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName]?.name,
                }),
            });
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: EventFields) => ({
                    value: datum[colName]?.filter(isDefined).map((item) => item.name).join(', '),
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
                    link: `/events/${datum.id}/`,
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
                    onDelete: handleEventDelete,
                    onEdit: handleEventEdit,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                nameColumn,
                createColumn(stringColumn, 'eventType', 'Type'),
                createColumn(dateColumn, 'startDate', 'Event Date'),
                createColumn(entityColumn, 'trigger', 'Trigger'),
                createColumn(entityColumn, 'actor', 'Actor'),
                createColumn(entityColumn, 'violence', 'Violence'),
                createColumn(entitiesColumn, 'countries', 'Country'),
                actionColumn,
            ];
        },
        [setSortState, validSortState, handleEventDelete, handleEventEdit],
    );

    return (
        <div className={_cs(styles.crisis, className)}>
            <PageHeader
                title={crisisData?.crisis?.name ?? 'Crisis'}
            />
            <Container
                className={styles.container}
                heading="Summary"
            >
                {crisisData?.crisis?.crisisNarrative ?? 'Summary not available'}
            </Container>
            <Container
                className={styles.container}
                heading="Events"
                headerActions={(
                    <>
                        {/*
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
                        */}
                        <Button
                            name={undefined}
                            onClick={showAddEventModal}
                            disabled={loadingEvents}
                        >
                            Add Event
                        </Button>
                    </>
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={eventsData?.eventList?.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                <Table
                    className={styles.table}
                    data={eventsData?.eventList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
                {(loadingEvents || deletingEvent) && <Loading />}
                {shouldShowAddEventModal && (
                    <Modal
                        onClose={closeAddEventModal}
                        heading={eventIdToEdit ? 'Edit Event' : 'Add Event'}
                    >
                        <EventForm
                            id={eventIdToEdit}
                            crisisId={crisisId}
                            onEventCreate={handleEventCreate}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default Crisis;
