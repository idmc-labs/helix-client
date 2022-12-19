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
    User_Role as UserRole,
} from '#generated/types';
import DomainContext from '#components/DomainContext';
import useModalState from '#hooks/useModalState';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { User } from '#types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

// type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

export const EVENT_EXPORT = gql`
    mutation ExportEvents(
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
        $qaRule: String,
        $ignoreQa: Boolean,
        $reviewStatus: [String!],
        $assignees: [ID!],
    ) {
        exportEvents(
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
            qaRule: $qaRule,
            ignoreQa: $ignoreQa,
            osvSubTypeByIds: $osvSubTypeByIds,
            glideNumbers: $glideNumbers,
            reviewStatus: $reviewStatus,
            assignees: $assignees,
        ) {
            errors
            ok
        }
    }
`;

const regionalCoordinator: UserRole = 'REGIONAL_COORDINATOR';
const monitoringExpert: UserRole = 'MONITORING_EXPERT';

function isUserMonitoringExpert(userInfo: User | undefined): userInfo is User {
    return userInfo?.portfolioRole === monitoringExpert;
}

function isUserRegionalCoordinator(userInfo: User | undefined): userInfo is User {
    return userInfo?.portfolioRole === regionalCoordinator;
}

const defaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

// const keySelector = (item: EventFields) => item.id;

interface EventsProps {
    className?: string;

    crisis?: CrisisOption | null;
    assignee?: string | null;
    qaMode?: 'MULTIPLE_RF' | 'NO_RF' | 'IGNORE_QA' | undefined;
    title?: string;
}

function EventsTable(props: EventsProps) {
    const {
        className,
        crisis,
        qaMode,
        title,
        assignee,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const [totalCount, setTotalCount] = useState(0);

    const { user } = useContext(DomainContext);

    const [
        regionalCoordinatorCountryOptions,
        regionalCoordinatorCountryIds,
        createdByOptions,
        createdByIds,
    ] = useMemo(
        () => {
            const coordinatorCountries = qaMode && isUserRegionalCoordinator(user) ? (
                user.portfolios
                    ?.filter((element) => element.role === regionalCoordinator).flatMap(
                        (region) => region.monitoringSubRegion?.countries ?? [],
                    )
            ) : [];

            const users = qaMode && isUserMonitoringExpert(user)
                ? [user]
                : [];

            return [
                coordinatorCountries,
                coordinatorCountries?.map((country) => country.id),
                users,
                users?.map((u) => u.id),
            ] as const;
        },
        [user, qaMode],
    );

    const qaRule: QaRuleType | undefined = useMemo(
        () => {
            if (qaMode === 'MULTIPLE_RF') {
                return 'HAS_MULTIPLE_RECOMMENDED_FIGURES';
            }
            if (qaMode === 'NO_RF') {
                return 'HAS_NO_RECOMMENDED_FIGURES';
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
        shouldShowAddEventModal, ,
        showAddEventModal,
        hideAddEventModal,
    ] = useModalState<undefined>();

    const crisisId = crisis?.id;

    const [
        eventQueryFilters,
        setEventQueryFilters,
    ] = useState<EventListQueryVariables | undefined>({
        createdByIds,
        countries: regionalCoordinatorCountryIds,
    });

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
            page: debouncedPage,
            pageSize,
            qaRule,
            ignoreQa,
            ...eventQueryFilters,
            assignees: assignee
                ? [assignee]
                : eventQueryFilters?.assignees,
            crisisByIds: crisisId
                ? [crisisId]
                : eventQueryFilters?.crisisByIds,
        }),
        [
            ordering,
            assignee,
            debouncedPage,
            pageSize,
            qaRule,
            ignoreQa,
            eventQueryFilters,
            crisisId,
        ],
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

    const eventPermissions = user?.permissions?.event;

    return (
        <Container
            compactContent
            className={className}
            contentClassName={styles.content}
            heading={title || 'Events'}
            headerActions={(
                <>
                    {eventPermissions?.add && !qaMode && (
                        <Button
                            name={undefined}
                            onClick={showAddEventModal}
                        >
                            Add Event
                        </Button>
                    )}
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingEvents}
                    >
                        Export
                    </ConfirmButton>
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
                    defaultCreatedByIds={createdByIds}
                    defaultCountries={regionalCoordinatorCountryIds}
                    defaultCreatedByOptions={createdByOptions}
                    defaultCountriesOptions={regionalCoordinatorCountryOptions}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                <NudeEventTable
                    className={styles.table}
                    crisis={crisis}
                    qaMode={qaMode}
                    filters={eventsVariables}
                    onTotalFiguresChange={setTotalCount}
                />
            </SortContext.Provider>
            {shouldShowAddEventModal && (
                <Modal
                    onClose={hideAddEventModal}
                    heading="Add Event"
                    size="large"
                    freeHeight
                >
                    <EventForm
                        // FIXME: we need to also refetch entries
                        onEventCreate={hideAddEventModal}
                        onEventFormCancel={hideAddEventModal}
                        defaultCrisis={crisis}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default EventsTable;
