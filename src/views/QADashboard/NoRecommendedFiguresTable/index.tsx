import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    SortContext,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import ActionCell, { ActionProps } from '../../../components/tables/EventsTable/EventsAction';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';
import { CrisisOption } from '#components/selections/CrisisSelectInput';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import {
    EventListQuery,
    EventListQueryVariables,
    DeleteEventMutation,
    DeleteEventMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

// FIXME: crisis was previously single select, now is multiselect, @priyesh
const EVENT_LIST = gql`
    query EventList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $name: String,
        $eventTypes:[String!],
        $crisisByIds: [ID!],
        $countries:[ID!],
        $glideNumbers: [String!],
        $violenceSubTypes: [ID!],
        $disasterSubTypes: [ID!]
        $createdByIds: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
    ) {
        eventList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            name: $name,
            eventTypes:$eventTypes,
            crisisByIds: $crisisByIds,
            countries: $countries,
            glideNumbers: $glideNumbers,
            violenceSubTypes: $violenceSubTypes,
            disasterSubTypes: $disasterSubTypes,
            createdByIds: $createdByIds,
            startDate_Gte: $startDate_Gte,
            endDate_Lte: $endDate_Lte,
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

const defaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: EventFields) => item.id;

interface tableProps {
    className?: string;
    crisis?: CrisisOption | null;
}

function NoRecommendedFiguresTable(props: tableProps) {
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
    const [pageSize, setPageSize] = useState(5);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const crisisId = crisis?.id;

    const [
        eventQueryFilters,
        setEventQueryFilters,
    ] = useState<PurgeNull<EventListQueryVariables> | undefined>(
        crisisId ? { crisisByIds: [crisisId] } : undefined,
    );

    const eventsVariables = useMemo(
        (): EventListQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...eventQueryFilters,
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
            handleEventDelete,
            eventPermissions?.delete,
        ],
    );
    const totalEventsCount = eventsData?.eventList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.events, className)}>
            <Container
                className={className}
                contentClassName={styles.content}
                heading="Events with No Recommended Figures"
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
            </Container>
        </div>
    );
}

export default NoRecommendedFiguresTable;
