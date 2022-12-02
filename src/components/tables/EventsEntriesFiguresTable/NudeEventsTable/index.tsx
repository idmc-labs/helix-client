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
    createStatusColumn,
    createTextColumn,
    createDateColumn,
    createNumberColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import Loading from '#components/Loading';
import EventForm from '#components/forms/EventForm';
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
    IgnoreEventMutation,
    IgnoreEventMutationVariables,
    ClearAssigneeFromEventMutation,
    ClearAssigneeFromEventMutationVariables,
    ClearSelfAssigneeFromEventMutation,
    ClearSelfAssigneeFromEventMutationVariables,
    SetSelfAssigneeToEventMutation,
    SetSelfAssigneeToEventMutationVariables,
} from '#generated/types';

import route from '#config/routes';

import AssigneeChangeForm from './AssigneeChangeForm';
import ActionCell, { ActionProps } from './EventsAction';
import IgnoreActionCell, { IgnoreActionProps } from './EventsIgnore';

type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

export const EVENT_LIST = gql`
    query EventList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $name: String,
        $eventTypes:[String!],
        $crisisByIds: [ID!],
        $countries:[ID!],
        $violenceSubTypes: [ID!],
        $disasterSubTypes: [ID!],
        $contextOfViolences: [ID!],
        $osvSubTypeByIds: [ID!],
        $glideNumbers: [String!],
        $createdByIds: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
        $qaRules: [String!],
        $ignoreQa: Boolean,
        $reviewStatus: [String!],
        $assignees: [ID!],
    ) {
        eventList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            contextOfViolences: $contextOfViolences,
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
            reviewStatus: $reviewStatus,
            assignees: $assignees,
        ) {
            totalCount
            pageSize
            page
            results {
                eventType
                eventTypeDisplay
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
                ignoreQa
                crisis {
                    name
                    id
                }
                countries {
                    id
                    idmcShortName
                }
                figureTypology
                eventTypology
                totalStockIdpFigures
                totalFlowNdFigures
                assignee {
                    id
                    fullName
                    username
                }
                reviewStatus
                reviewStatusDisplay
                reviewCount {
                    reviewApprovedCount
                    reviewInProgressCount
                    reviewReRequestCount
                    reviewNotStartedCount
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

const EVENT_CLEAR_ASSIGNEE = gql`
    mutation ClearAssigneeFromEvent($eventId: ID!) {
        clearAssigneeFromEvent(eventId: $eventId) {
            errors
            result {
                id
                assignee {
                    id
                    fullName
                }
            }
        }
    }
`;

const EVENT_SELF_SET_ASSIGNEE = gql`
    mutation SetSelfAssigneeToEvent($eventId: ID!) {
        setSelfAssigneeToEvent(eventId: $eventId) {
            errors
            result {
                id
                assignee {
                    id
                    fullName
                }
            }
        }
    }
`;

const EVENT_SELF_CLEAR_ASSIGNEE = gql`
    mutation ClearSelfAssigneeFromEvent($eventId: ID!) {
        clearSelfAssigneeFromEvent(eventId: $eventId) {
            errors
            result {
                id
                assignee {
                    id
                    fullName
                }
            }
        }
    }
`;

const IGNORE_EVENT = gql`
    mutation IgnoreEvent($event: EventUpdateInputType!) {
        updateEvent(data: $event) {
            errors
            result {
                id
                ignoreQa
            }
        }
    }
`;

const keySelector = (item: EventFields) => item.id;

interface EventsProps {
    className?: string;
    crisis?: CrisisOption | null;
    qaMode?: 'MULTIPLE_RF' | 'NO_RF' | 'IGNORE_QA' | undefined;
    filters: EventListQueryVariables | undefined;
    onTotalFiguresChange?: (value: number) => void;
}

function NudeEventTable(props: EventsProps) {
    const {
        className,
        crisis,
        qaMode,
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
    ] = useModalState<{
        id: string,
        clone?: boolean,
    }>();

    const [
        shouldShowEventAssigneeChangeModal,
        assigneeChangeEventId,
        showEventAssigneeChangeModal,
        hideEventAssigneeChangeModal,
    ] = useModalState();

    const { user } = useContext(DomainContext);
    const userId = user?.id;

    const eventPermissions = user?.permissions?.event;
    const crisisId = crisis?.id;

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

    const [
        clearAssigneeFromEvent,
        { loading: clearingAssigneeFromEvent },
    ] = useMutation<ClearAssigneeFromEventMutation, ClearAssigneeFromEventMutationVariables>(
        EVENT_CLEAR_ASSIGNEE,
        {
            onCompleted: (response) => {
                const { clearAssigneeFromEvent: clearAssigneeFromEventRes } = response;
                if (!clearAssigneeFromEventRes) {
                    return;
                }
                const { errors, result } = clearAssigneeFromEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Assignee cleared from event successfully!',
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

    const [
        clearSelfAssigneeFromEvent,
        { loading: clearingSelfAssigneeFromEvent },
    ] = useMutation<
        ClearSelfAssigneeFromEventMutation,
        ClearSelfAssigneeFromEventMutationVariables
    >(
        EVENT_SELF_CLEAR_ASSIGNEE,
        {
            onCompleted: (response) => {
                const { clearSelfAssigneeFromEvent: clearSelfAssigneeFromEventRes } = response;
                if (!clearSelfAssigneeFromEventRes) {
                    return;
                }
                const { errors, result } = clearSelfAssigneeFromEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Assignee cleared from event successfully!',
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

    const [
        setSelfAssigneeToEvent,
        { loading: settingSelfAssigneeToEvent },
    ] = useMutation<SetSelfAssigneeToEventMutation, SetSelfAssigneeToEventMutationVariables>(
        EVENT_SELF_SET_ASSIGNEE,
        {
            onCompleted: (response) => {
                const { setSelfAssigneeToEvent: setSelfAssigneeToEventRes } = response;
                if (!setSelfAssigneeToEventRes) {
                    return;
                }
                const { errors, result } = setSelfAssigneeToEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Assignee updated to event successfully!',
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

    const [
        ignoreEvent,
        { loading: ignoringEvent },
    ] = useMutation<IgnoreEventMutation, IgnoreEventMutationVariables>(
        IGNORE_EVENT,
        {
            onCompleted: (response) => {
                const { updateEvent: ignoreEventRes } = response;
                if (!ignoreEventRes) {
                    return;
                }
                const { errors, result } = ignoreEventRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    // refetchEvents(filters);
                    notify({
                        children: result?.ignoreQa
                            ? 'Event ignored successfully!'
                            : 'Event un-ignored successfully!',
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

    const handleIgnoreEvent = useCallback(
        (ignoreValues: IgnoreEventMutationVariables['event']) => {
            ignoreEvent({
                variables: {
                    event: ignoreValues,
                },
            });
        },
        [ignoreEvent],
    );

    const handleUnIgnoreEvent = useCallback(
        (unIgnoreValues: IgnoreEventMutationVariables['event']) => {
            ignoreEvent({
                variables: {
                    event: unIgnoreValues,
                },
            });
        },
        [ignoreEvent],
    );

    const handleAssignYourself = useCallback(
        (eventId: string) => {
            setSelfAssigneeToEvent({
                variables: {
                    eventId,
                },
            });
        },
        [setSelfAssigneeToEvent],
    );

    const handleClearAssignee = useCallback(
        (eventId: string) => {
            clearAssigneeFromEvent({
                variables: {
                    eventId,
                },
            });
        },
        [clearAssigneeFromEvent],
    );

    const handleClearSelfAssignee = useCallback(
        (eventId: string) => {
            clearSelfAssigneeFromEvent({
                variables: {
                    eventId,
                },
            });
        },
        [clearSelfAssigneeFromEvent],
    );

    const handleEventCreate = React.useCallback(() => {
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

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const ignoreActionColumn = createCustomActionColumn<EventFields, string, IgnoreActionProps>(
                IgnoreActionCell,
                (_, datum) => ({
                    id: datum.id,
                    ignoreQa: false,
                    onIgnore: eventPermissions?.change && !datum.ignoreQa
                        ? handleIgnoreEvent
                        : undefined,
                    onUnIgnore: eventPermissions?.change && datum.ignoreQa
                        ? handleUnIgnoreEvent
                        : undefined,
                }),
                'action',
                '',
                undefined,
                1,
            );

            const actionColumn = createCustomActionColumn<EventFields, string, ActionProps>(
                ActionCell,
                (_, datum) => ({
                    id: datum.id,
                    onReview: datum.assignee?.id === user?.id,
                    onDelete: eventPermissions?.delete ? handleEventDelete : undefined,
                    onEdit: eventPermissions?.change ? handleEventEdit : undefined,
                    onClone: eventPermissions?.add ? handleEventClone : undefined,

                    currentAssignee: datum.assignee?.id,

                    onClearAssignee: (
                        eventPermissions?.clear_assignee
                        && datum.assignee?.id
                    )
                        ? handleClearAssignee
                        : undefined,
                    onClearAssignmentYourself: (
                        eventPermissions?.clear_self_assignee
                        && datum.assignee?.id
                        && datum.assignee.id === userId
                        && !eventPermissions?.clear_assignee
                    )
                        ? handleClearSelfAssignee
                        : undefined,
                    onChangeAssignee: eventPermissions?.assign
                        ? showEventAssigneeChangeModal
                        : undefined,
                    onAssignYourself: (
                        eventPermissions?.self_assign
                        && !datum.assignee?.id
                    )
                        ? handleAssignYourself
                        : undefined,
                }),
                'action',
                '',
                undefined,
                6,
            );

            // eslint-disable-next-line max-len
            const progressColumn: TableColumn<EventFields, string, StackedProgressProps, TableHeaderCellProps> = {
                id: 'progress',
                title: 'Progress',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: StackedProgressCell,
                cellRendererParams: (_, item) => ({
                    approved: item.reviewCount?.reviewApprovedCount,
                    inProgress: item.reviewCount?.reviewInProgressCount,
                    notStarted: item.reviewCount?.reviewNotStartedCount,
                    reRequested: item.reviewCount?.reviewReRequestCount,
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
                createStatusColumn<EventFields, string>(
                    'name',
                    'Name',
                    (item) => ({
                        title: item.name,
                        attrs: { eventId: item.id },
                        ext: item.oldId
                            ? `/events/${item.oldId}`
                            : undefined,
                        status: item.reviewStatus,
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
                    (item) => item.eventTypeDisplay,
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
                createTextColumn<EventFields, string>(
                    'assignee__name',
                    'Assignee',
                    (item) => item.assignee?.fullName,
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
                qaMode === undefined ? actionColumn : null,
                qaMode === 'IGNORE_QA' ? ignoreActionColumn : null,
                qaMode === 'NO_RF' ? ignoreActionColumn : null,
                qaMode === 'MULTIPLE_RF' ? ignoreActionColumn : null,
            ].filter(isDefined);
        },
        [
            crisisId,
            handleEventClone,
            handleEventEdit,
            handleEventDelete,
            handleClearAssignee,
            handleClearSelfAssignee,
            handleAssignYourself,
            eventPermissions,
            handleIgnoreEvent,
            handleUnIgnoreEvent,
            qaMode,
            userId,
            showEventAssigneeChangeModal,
            user?.id,
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
                <>
                    <Table
                        className={className}
                        data={eventsData?.eventList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </>
            )}
            {(
                loadingEvents
                || deletingEvent
                || ignoringEvent
                || clearingAssigneeFromEvent
                || clearingSelfAssigneeFromEvent
                || settingSelfAssigneeToEvent
            ) && <Loading absolute />}
            {!loadingEvents && totalEventsCount <= 0 && (
                <Message
                    message="No events found."
                />
            )}
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
                        id={editableEventId?.id}
                        clone={editableEventId?.clone}
                        onEventCreate={handleEventCreate}
                        onEventFormCancel={hideAddEventModal}
                        defaultCrisis={crisis}
                    />
                </Modal>
            )}
            {shouldShowEventAssigneeChangeModal && assigneeChangeEventId && (
                <Modal
                    onClose={hideEventAssigneeChangeModal}
                    heading="Set Assignee"
                    size="medium"
                    freeHeight
                >
                    <AssigneeChangeForm
                        id={assigneeChangeEventId}
                        onFormCancel={hideEventAssigneeChangeModal}
                    />
                </Modal>
            )}
        </>
    );
}

export default NudeEventTable;
