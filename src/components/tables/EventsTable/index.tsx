import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    useSortState,
    SortContext,
} from '@togglecorp/toggle-ui';

import EventsFilter from '#components/rawTables/EventsTable/EventsFilter';
import useEventTable from '#components/rawTables/EventsTable';
import Container from '#components/Container';
import {
    EventListQueryVariables,
    Qa_Rule_Type as QaRuleType,
    User_Role as UserRole,
} from '#generated/types';
import DomainContext from '#components/DomainContext';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { User } from '#types';

import styles from './styles.css';

// type EventFields = NonNullable<NonNullable<EventListQuery['eventList']>['results']>[number];

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
    title?: string;

    reviewStatus?: string[] | null
    assignee?: string | null;
    qaMode?: 'MULTIPLE_RF' | 'NO_RF' | 'IGNORE_QA' | undefined;
}

function EventsTable(props: EventsProps) {
    const {
        className,
        qaMode,
        title,
        assignee,
        reviewStatus,
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
                    ?.filter((element) => element.role === regionalCoordinator)
                    .flatMap((region) => region.monitoringSubRegion?.countries ?? [])
            ) : undefined;

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
            reviewStatus: reviewStatus ?? eventQueryFilters?.reviewStatus,
            assignees: assignee
                ? [assignee]
                : eventQueryFilters?.assignees,
        }),
        [
            ordering,
            assignee,
            debouncedPage,
            pageSize,
            qaRule,
            reviewStatus,
            ignoreQa,
            eventQueryFilters,
        ],
    );

    const {
        table: eventsTable,
        exportButton: eventsExportButton,
        addButton: eventsAddButton,
        pager: eventsPager,
    } = useEventTable({
        className: styles.table,
        qaMode,
        filters: eventsVariables,
        page,
        pageSize,
        onPageChange: setPage,
        onPageSizeChange: handlePageSizeChange,
    });

    return (
        <Container
            compactContent
            className={className}
            contentClassName={styles.content}
            heading={title || 'Events'}
            headerActions={(
                <>
                    {eventsAddButton}
                    {eventsExportButton}
                </>
            )}
            footerContent={eventsPager}
            description={(
                <EventsFilter
                    onFilterChange={onFilterChange}
                    crisisSelectionDisabled={false}
                    reviewStatusSelectionDisabled={!!reviewStatus}
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
                {eventsTable}
            </SortContext.Provider>
        </Container>
    );
}

export default EventsTable;
