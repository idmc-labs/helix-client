import React, { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
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
    // TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Button,
    Modal,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import EventForm from '#components/EventForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';

import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';
import { ObjectError } from '#utils/errorTransform';

import styles from './styles.css';

// NOTE: move this to utils
interface EventFields{
    id: string;
    name: string;
    createdAt: string;
    startDate: string;
    trigger?: { id: string, name: string };
    actor?: { id: string, name: string };
    countries?: { id: string, name: string };
}
interface CrisisFields {
    id: string;
    name: string;
    crisisNarrative: string;
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
    query EventList($ordering: String, $page: Int, $pageSize: Int) {
        eventList(ordering: $ordering, page: $page, pageSize: $pageSize) {
            totalCount
            pageSize
            page
            results {
                name
                id
                createdAt
                startDate
                trigger {
                    id
                    name
                }
                actor {
                    id
                    name
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
            event {
                id
            }
        }
    }
`;

interface DeleteEventResponseFields {
    deleteEvent: {
        errors?: ObjectError[];
        event: {
            id: string;
        }
    };
}

interface DeleteEventVariables {
    id: string;
}

interface EventListResponseFields {
    eventList: {
        results?: EventFields[];
        totalCount: number;
        page: number;
        pageSize: number;
    };
}
interface EventListVariables {
    ordering: string;
    page: number;
    pageSize: number;
}

interface CrisisResponseFields {
    crisis: CrisisFields;
}
interface CrisisVariables {
    id: string;
}

const defaultSortState = {
    name: 'name',
    direction: TableSortDirection.asc,
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
            // name: search,
        }),
        [ordering, page, pageSize],
    );

    const crisisVariables = useMemo(
        () => ({
            id: crisisId,
        }),
        [crisisId],
    );

    const {
        data: crisisData,
        loading: loadingCrisis,
    } = useQuery<CrisisResponseFields, CrisisVariables>(CRISIS, {
        variables: crisisVariables,
    });
    console.log(crisisData, loadingCrisis);

    const {
        data: eventsData,
        loading: loadingEvents,
        refetch: refetchEvents,
    } = useQuery<EventListResponseFields, EventListVariables>(EVENT_LIST, {
        variables: eventsVariables,
    });

    const [
        deleteEvent,
        { loading: deletingEvent },
    ] = useMutation<DeleteEventResponseFields, DeleteEventVariables>(
        EVENT_DELETE,
        {
            onCompleted: (response) => {
                if (!response.deleteEvent.errors) {
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

            // Generic columns
            /*
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
            */
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
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
                    link: `/crises/${crisisId}/event/${datum.id}`,
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
                createColumn(dateColumn, 'createdAt', 'Date of Entry'),
                nameColumn,
                createColumn(dateColumn, 'startDate', 'Event Date'),
                /*
                createColumn(stringColumn, 'trigger', 'Trigger'),
                createColumn(stringColumn, 'actor', 'Actor'),
                createColumn(stringColumn, 'countries', 'Countries'),
                */
                actionColumn,
            ];
        },
        [setSortState, validSortState, handleEventDelete, handleEventEdit, crisisId],
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
                {crisisData?.crisis?.crisisNarrative}
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
                        itemsCount={eventsData?.eventList.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                <Table
                    className={styles.table}
                    data={eventsData?.eventList.results}
                    keySelector={keySelector}
                    columns={columns}
                />
                {(loadingEvents || deletingEvent) && 'Working...'}
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
