import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    Button,
    useSortState,
    SortContext,
    Pager,
    ConfirmButton,
    Modal,
} from '@togglecorp/toggle-ui';

import EventForm from '#components/forms/EventForm';
import EventsFilter from '#components/tables/EventsEntriesFiguresTable/EventsFilter';
import NudeEventTable from '#components/tables/EventsEntriesFiguresTable/NudeEventsTable';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Container from '#components/Container';
import { CrisisOption } from '#components/selections/CrisisSelectInput';
import NotificationContext from '#components/NotificationContext';
import {
    EventListQueryVariables,
    ExportEventsMutation,
    ExportEventsMutationVariables,
    Qa_Rule_Type as QaRuleType,
} from '#generated/types';
import DomainContext from '#components/DomainContext';
import useModalState from '#hooks/useModalState';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

// type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

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

export const EVENT_EXPORT = gql`
    mutation ExportEvents(
        $name: String,
        $eventTypes:[String!],
        $crisisByIds: [ID!],
        $countries:[ID!],
        $violenceSubTypes: [ID!],
        $contextOfViolences: [ID!],
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
            contextOfViolences: $contextOfViolences,
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

// const keySelector = (item: EventFields) => item.id;

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

    const [totalCount, setTotalCount] = useState(0);

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

    const ignoreQa: boolean | undefined = qaMode
        ? qaMode === 'IGNORE_QA'
        : undefined;

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
    ] = useState<EventListQueryVariables | undefined>(
        crisisId ? { crisisByIds: [crisisId] } : undefined,
    );

    const onFilterChange = React.useCallback(
        (value: EventListQueryVariables) => {
            setEventQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
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

    const [
        exportEvents,
        { loading: exportingEvents },
    ] = useMutation<ExportEventsMutation, ExportEventsMutationVariables>(
        EVENT_EXPORT,
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
                variables: eventsVariables,
            });
        },
        [exportEvents, eventsVariables],
    );

    const { user } = useContext(DomainContext);
    const eventPermissions = user?.permissions?.event;

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
                        >
                            Add Event
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                />
            )}
            description={(
                <EventsFilter
                    crisisSelectionDisabled={!!crisisId}
                    onFilterChange={onFilterChange}
                    createdBySelectionDisabled={false}
                    countriesSelectionDisabled={false}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                <NudeEventTable
                    className={styles.table}
                    crisis={crisis}
                    qaMode={qaMode}
                    filters={eventQueryFilters} // FIXME:
                    onTotalFiguresChange={setTotalCount} // FIXME:
                />
            </SortContext.Provider>
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    heading={editableEventId ? 'Edit Event' : 'Add Event'}
                    size="large"
                    freeHeight
                >
                    <EventForm
                        id={editableEventId}
                        // onEventCreate={handleEventCreate}
                        defaultCrisis={crisis}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default EventsTable;
