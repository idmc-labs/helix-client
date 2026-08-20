import React, {
    useCallback,
    useMemo,
    useContext,
    useEffect,
} from 'react';
import { SortContext } from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import { PartialForm } from '@togglecorp/toggle-form';

import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import Container from '#components/Container';
import {
    EventListQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
    Qa_Rule_Type as QaRuleType,
    User_Role as UserRole,
} from '#generated/types';
import useFilterState, { FilterStateResponse } from '#hooks/useFilterState';
import { PersistenceKeyType } from '#utils/filterStorage';
import DomainContext from '#components/DomainContext';
import { User, PurgeNull } from '#types';
import { expandObject } from '#utils/common';
import useOptions from '#hooks/useOptions';

import styles from './styles.module.css';

const regionalCoordinator: UserRole = 'REGIONAL_COORDINATOR';
const monitoringExpert: UserRole = 'MONITORING_EXPERT';

function isUserMonitoringExpert(userInfo: User | undefined): userInfo is User {
    return userInfo?.portfolioRole === monitoringExpert;
}

function isUserRegionalCoordinator(userInfo: User | undefined): userInfo is User {
    return userInfo?.portfolioRole === regionalCoordinator;
}

type EventsFilterFields = NonNullable<PurgeNull<EventListQueryVariables['filters']>>;
type FiguresFilterFields = NonNullable<PurgeNull<ExtractionEntryListFiltersQueryVariables['filters']>>;

// NOTE: The listing page drives a single filter state where the main (event)
// filter and the sidepane (figures) filter live together. The figures part is
// nested under `filterFigures` and typed as the entry filter so the sidepane's
// entry-level fields survive.
export type EventsListFilterFields = Omit<EventsFilterFields, 'filterFigures'> & {
    filterFigures?: FiguresFilterFields;
};

interface EventsProps {
    className?: string;
    title?: string;

    reviewStatus?: string[] | null
    assignee?: string | null;
    qaMode?: 'MULTIPLE_RF' | 'NO_RF' | 'IGNORE_QA' | undefined;
    filterState?: FilterStateResponse<EventsListFilterFields>;
    persistenceKey?: PersistenceKeyType;
}

function EventsTable(props: EventsProps) {
    const {
        className,
        qaMode,
        title,
        assignee,
        reviewStatus,
        filterState: filterStateFromProps,
        persistenceKey,
    } = props;

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

    const [, setCountryOptions] = useOptions('country');
    const [, setUserOptions] = useOptions('user');
    useEffect(
        () => {
            setCountryOptions(regionalCoordinatorCountryOptions);
        },
        [setCountryOptions, regionalCoordinatorCountryOptions],
    );
    useEffect(
        () => {
            setUserOptions(createdByOptions);
        },
        [setUserOptions, createdByOptions],
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

    const selfFilterState = useFilterState<EventsListFilterFields>({
        filter: {
            createdByIds,
            countries: regionalCoordinatorCountryIds,
        },
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
        // NOTE: When controlled by the page, the page owns persistence.
        persistenceKey: filterStateFromProps ? undefined : persistenceKey,
    });

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = filterStateFromProps ?? selfFilterState;

    // NOTE: The main filter only edits the event part; project out the figures
    // part and preserve it on write so the sidepane's filter is not clobbered.
    const mainRawFilter = useMemo(
        () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { filterFigures, ...rest } = rawFilter;
            return rest;
        },
        [rawFilter],
    );
    const mainInitialFilter = useMemo(
        () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { filterFigures, ...rest } = initialFilter;
            return rest;
        },
        [initialFilter],
    );
    const handleMainFilterChange = useCallback(
        (value: PartialForm<EventsFilterFields>) => {
            setFilter((old) => ({
                ...old,
                ...value,
                filterFigures: old.filterFigures,
            }));
        },
        [setFilter],
    );

    const eventsVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<EventListQueryVariables['filters']>>(
                filter,
                {
                    filterFigures: filter.filterFigures,
                    aggregateFigures: {
                        filterFigures: filter.filterFigures,
                    },
                    qaRule,
                    ignoreQa,
                    reviewStatus,
                    assignees: assignee ? [assignee] : undefined,
                },
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
            assignee,
            qaRule,
            reviewStatus,
            ignoreQa,
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
        page: rawPage,
        pageSize: rawPageSize,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
    });

    const hiddenFields = [
        reviewStatus ? 'reviewStatus' as const : undefined,
    ].filter(isDefined);

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
                    currentFilter={mainRawFilter}
                    initialFilter={mainInitialFilter}
                    onFilterChange={handleMainFilterChange}
                    hiddenFields={hiddenFields}
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
