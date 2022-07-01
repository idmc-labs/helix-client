import React, { useMemo, useCallback, useContext, useEffect } from 'react';
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
    Modal,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import Loading from '#components/Loading';
import EventForm from '#components/forms/EventForm';
import ActionCell, { ActionProps } from '../../EventsTable/EventsAction';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';
import { CrisisOption } from '#components/selections/CrisisSelectInput';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { EVENT_LIST } from '#components/tables/EventsTable';
import useModalState from '#hooks/useModalState';
import {
    EventListQuery,
    EventListQueryVariables,
    DeleteEventMutation,
    DeleteEventMutationVariables,
} from '#generated/types';

import route from '#config/routes';

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

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

const keySelector = (item: EventFields) => item.id;

interface EventsProps {
    className?: string;
    crisis?: CrisisOption | null;
    filters: EventListQueryVariables;
    onTotalFiguresChange?: (value: number) => void;
}

function NudeEventTable(props: EventsProps) {
    const {
        className,
        crisis,
        filters,
        onTotalFiguresChange,
    } = props;

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

    const {
        previousData,
        data: eventsData = previousData,
        loading: loadingEvents,
        refetch: refetchEvents,
    } = useQuery<EventListQuery, EventListQueryVariables>(EVENT_LIST, {
        variables: filters,
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
                    refetchEvents(filters);
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

    const handleEventUpdate = React.useCallback(() => {
        refetchEvents(filters);
        hideAddEventModal();
    }, [
        refetchEvents,
        filters,
        hideAddEventModal,
    ]);

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
                    deleteTitle: 'event',
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
                    'event_typology',
                    'Event Type',
                    (item) => item.eventTypology,
                ),
                createTextColumn<EventFields, string>(
                    'figure_typology',
                    'Figure Types',
                    (item) => item.figureTypology?.join(', '),
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

    // NOTE: if we don't pass total figures count this way,
    // we will have to use Portal to move the Pager component
    useEffect(
        () => {
            if (onTotalFiguresChange) {
                onTotalFiguresChange(totalEventsCount);
            }
        },
        [onTotalFiguresChange, totalEventsCount],
    );

    return (
        <>
            {totalEventsCount > 0 && (
                <Table
                    className={className}
                    data={eventsData?.eventList?.results}
                    keySelector={keySelector}
                    columns={columns}
                    resizableColumn
                    fixedColumnWidth
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
                    size="large"
                    freeHeight
                >
                    <EventForm
                        id={editableEventId}
                        onEventCreate={handleEventUpdate}
                        defaultCrisis={crisis}
                    />
                </Modal>
            )}
        </>
    );
}

export default NudeEventTable;
