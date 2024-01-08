import React, { useMemo, useContext, useEffect } from 'react';
import { SortContext } from '@togglecorp/toggle-ui';
import { isDefined } from '@togglecorp/fujs';
import { PurgeNull } from '@togglecorp/toggle-form';

import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import Container from '#components/Container';
import {
    EventListQueryVariables,
    Qa_Rule_Type as QaRuleType,
    User_Role as UserRole,
} from '#generated/types';
import useFilterState from '#hooks/useFilterState';
import DomainContext from '#components/DomainContext';
import { User } from '#types';
import { expandObject } from '#utils/common';
import useOptions from '#hooks/useOptions';

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
    } = useFilterState<PurgeNull<NonNullable<EventListQueryVariables['filters']>>>({
        filter: {
            createdByIds,
            countries: regionalCoordinatorCountryIds,
        },
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const eventsVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<EventListQueryVariables['filters']>>(
                filter,
                {
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

    const hiddenFields = [
        reviewStatus ? 'reviewStatus' as const : undefined,
    ].filter(isDefined);

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
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
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
