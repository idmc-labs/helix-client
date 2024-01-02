import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    SortContext,
    TableSortDirection,
    useSortState,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import {
    ExtractionEntryListFiltersQueryVariables,
    ExtractionFigureListQueryVariables,
    EventListQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { PurgeNull } from '#types';

import useOptions from '#hooks/useOptions';
import { expandObject } from '#utils/common';
import useEntryTable from '#components/rawTables/useEntryTable';
import { CrisisOption } from '#components/selections/CrisisMultiSelectInput';
import { CountryOption } from '#components/selections/CountrySelectInput';
import useFigureTable from '#components/rawTables/useFigureTable';
import FiguresFilter from '#components/rawTables/useFigureTable/FiguresFilter';
import useEventTable from '#components/rawTables/useEventTable';
import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

const defaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

interface EventsEntriesFiguresTableProps {
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;

    className?: string;

    country?: CountryOption | null;
    crisis?: CrisisOption | null;
    eventId?: string;
    userId?: string;
}

function EventsEntriesFiguresTable(props: EventsEntriesFiguresTableProps) {
    const {
        page: pageFromProps,
        pageSize: pageSizeFromProps,
        pagerDisabled,
        pagerPageControlDisabled,
        className,
        userId,
        eventId,
        crisis,
        country,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | 'Events' | undefined>('Figures');

    // TODO: use useFilterState here
    const [entriesPage, setEntriesPage] = useState(pageFromProps ?? 1);
    const [entriesPageSize, setEntriesPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedEntriesPage = useDebouncedValue(entriesPage);

    // TODO: use useFilterState here
    const [figuresPage, setFiguresPage] = useState(pageFromProps ?? 1);
    const [figuresPageSize, setFiguresPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedFiguresPage = useDebouncedValue(figuresPage);

    // TODO: use useFilterState here
    const [eventsPage, setEventsPage] = useState(pageFromProps ?? 1);
    const [eventsPageSize, setEventsPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedEventsPage = useDebouncedValue(eventsPage);

    const entriesSortState = useSortState();
    const { sorting: entriesSorting } = entriesSortState;
    const validEntriesSorting = entriesSorting ?? defaultSorting;
    const entriesOrdering = validEntriesSorting.direction === 'asc'
        ? validEntriesSorting.name
        : `-${validEntriesSorting.name}`;

    const figuresSortState = useSortState();
    const { sorting: figuresSorting } = figuresSortState;
    const validFiguresSorting = figuresSorting ?? defaultSorting;
    const figuresOrdering = validFiguresSorting.direction === 'asc'
        ? validFiguresSorting.name
        : `-${validFiguresSorting.name}`;

    const eventsSortState = useSortState();
    const { sorting: eventsSorting } = figuresSortState;
    const validEventsSorting = eventsSorting ?? defaultSorting;
    const eventsOrdering = validEventsSorting.direction === 'asc'
        ? validEventsSorting.name
        : `-${validEventsSorting.name}`;

    const [
        entriesQueryFilters,
        setEntriesQueryFilters,
    ] = useState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>();

    const [
        figuresQueryFilters,
        setFiguresQueryFilters,
    ] = useState<PurgeNull<NonNullable<ExtractionFigureListQueryVariables['filters']>>>();

    const [
        eventsQueryFilters,
        setEventsQueryFilters,
    ] = useState<PurgeNull<NonNullable<EventListQueryVariables['filters']>>>();

    const crisisId = crisis?.id;
    const countryId = country?.id;

    const onFilterChange = useCallback(
        (value: PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>) => {
            if (selectedTab === 'Entries') {
                setEntriesQueryFilters(value);
            } else if (selectedTab === 'Figures') {
                setFiguresQueryFilters(value);
            } else {
                setEventsQueryFilters(value);
            }
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [selectedTab],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: debouncedEntriesPage,
            pageSize: entriesPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                entriesQueryFilters,
                {
                    filterFigureEvents: eventId ? [eventId] : undefined,
                    filterFigureCrises: crisisId ? [crisisId] : undefined,
                    filterFigureCreatedBy: userId ? [userId] : undefined,
                    filterFigureCountries: countryId ? [countryId] : undefined,
                },
            ),
        }),
        [
            entriesOrdering,
            debouncedEntriesPage,
            entriesPageSize,
            eventId,
            userId,
            countryId,
            crisisId,
            entriesQueryFilters,
        ],
    );

    const figuresVariables = useMemo(
        () => ({
            ordering: figuresOrdering,
            page: debouncedFiguresPage,
            pageSize: figuresPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                figuresQueryFilters,
                {
                    filterFigureEvents: eventId ? [eventId] : undefined,
                    filterFigureCrises: crisisId ? [crisisId] : undefined,
                    filterFigureCreatedBy: userId ? [userId] : undefined,
                    filterFigureCountries: countryId ? [countryId] : undefined,
                },
            ),
        }),
        [
            figuresOrdering,
            debouncedFiguresPage,
            figuresPageSize,
            eventId,
            userId,
            countryId,
            crisisId,
            figuresQueryFilters,
        ],
    );

    const eventsVariables = useMemo(
        () => ({
            ordering: eventsOrdering,
            page: debouncedEventsPage,
            pageSize: eventsPageSize,
            filters: expandObject<NonNullable<EventListQueryVariables['filters']>>(
                eventsQueryFilters,
                {
                    crisisByIds: crisisId ? [crisisId] : undefined,
                    countries: countryId ? [countryId] : undefined,
                    createdByIds: userId ? [userId] : undefined,
                },
            ),
        }),
        [
            eventsOrdering,
            debouncedEventsPage,
            eventsPageSize,
            eventsQueryFilters,
            userId,
            countryId,
            crisisId,
        ],
    );

    const handleEventsPageSizeChange = useCallback(
        (value: number) => {
            setEventsPageSize(value);
            setEventsPage(1);
        },
        [],
    );

    const handleEntriesPageSizeChange = useCallback(
        (value: number) => {
            setEntriesPageSize(value);
            setEntriesPage(1);
        },
        [],
    );

    const handleFiguresPageSizeChange = useCallback(
        (value: number) => {
            setFiguresPageSize(value);
            setFiguresPage(1);
        },
        [],
    );

    const {
        table: entriesTable,
        exportButton: entriesExportButton,
        pager: entriesPager,
    } = useEntryTable({
        className: styles.table,
        filters: entriesVariables,
        page: entriesPage,
        pageSize: entriesPageSize,
        onPageChange: setEntriesPage,
        onPageSizeChange: handleEntriesPageSizeChange,
        pagerPageControlDisabled,
    });

    const [, setCountryOptions] = useOptions('country');
    const [, setCrisisOptions] = useOptions('crisis');

    const [
        countryIds,
        countryOptions,
        crisisOptions,
    ] = useMemo(
        () => ([
            countryId ? [countryId] : undefined,
            country ? [country] : undefined,
            crisis ? [crisis] : undefined,
        ] as const),
        [crisis, country, countryId],
    );
    useEffect(
        () => {
            setCountryOptions(countryOptions);
        },
        [setCountryOptions, countryOptions],
    );
    useEffect(
        () => {
            setCrisisOptions(crisisOptions);
        },
        [setCrisisOptions, crisisOptions],
    );

    const hiddenColumns = [
        userId ? 'createdBy' as const : undefined,
        crisisId ? 'crisis' as const : undefined,
        countryId ? 'countries' as const : undefined,
    ].filter(isDefined);

    const disabledFields = [
        crisisId ? 'crisis' as const : undefined,
        countryId ? 'countries' as const : undefined,
    ].filter(isDefined);

    const {
        table: eventsTable,
        exportButton: eventsExportButton,
        addButton: eventsAddButton,
        pager: eventsPager,
    } = useEventTable({
        className: styles.table,
        filters: eventsVariables,
        page: eventsPage,
        pageSize: eventsPageSize,
        onPageChange: setEventsPage,
        onPageSizeChange: handleEventsPageSizeChange,
        pagerPageControlDisabled,

        defaultFormValue: {
            crisis: crisisId,
            countries: countryIds,
        },
        disabledFields,
        hiddenColumns,
    });

    const figureHiddenColumns = [
        eventId ? 'event' as const : undefined,
        eventId || crisisId ? 'crisis' as const : undefined,
        userId ? 'createdBy' as const : undefined,
    ].filter(isDefined);

    const {
        table: figuresTable,
        exportButton: figuresExportButton,
        pager: figuresPager,
    } = useFigureTable({
        className: styles.table,
        filters: figuresVariables,
        page: figuresPage,
        pageSize: figuresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: handleFiguresPageSizeChange,
        pagerPageControlDisabled,

        hiddenColumns: figureHiddenColumns,
    });

    return (
        <Tabs
            value={selectedTab}
            onChange={setSelectedTab}
        >
            <Container
                compactContent
                tabs={(
                    <TabList>
                        <Tab
                            name="Events"
                        >
                            Events
                        </Tab>
                        <Tab
                            name="Entries"
                        >
                            Entries
                        </Tab>
                        <Tab
                            name="Figures"
                        >
                            Figures
                        </Tab>
                    </TabList>
                )}
                className={_cs(className, styles.eventsEntriesFiguresTable)}
                headerActions={(
                    <>
                        {selectedTab === 'Entries' && entriesExportButton}
                        {selectedTab === 'Events' && (
                            <>
                                {eventsAddButton}
                                {eventsExportButton}
                            </>
                        )}
                        {selectedTab === 'Figures' && figuresExportButton}
                    </>
                )}
                contentClassName={styles.content}
                description={(
                    <>
                        {selectedTab === 'Events' && (
                            <EventsFilter
                                onFilterChange={onFilterChange}
                                countries={countryId ? [countryId] : undefined}
                                crises={crisisId ? [crisisId] : undefined}
                                hiddenFields={hiddenColumns}
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <FiguresFilter
                                onFilterChange={onFilterChange}
                                hiddenFields={figureHiddenColumns}
                                events={eventId ? [eventId] : undefined}
                                countries={countryId ? [countryId] : undefined}
                                crises={crisisId ? [crisisId] : undefined}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <FiguresFilter
                                onFilterChange={onFilterChange}
                                hiddenFields={figureHiddenColumns}
                                events={eventId ? [eventId] : undefined}
                                countries={countryId ? [countryId] : undefined}
                                crises={crisisId ? [crisisId] : undefined}
                            />
                        )}
                    </>

                )}
                footerContent={!pagerDisabled && (
                    <>
                        {selectedTab === 'Entries' && entriesPager}
                        {selectedTab === 'Events' && eventsPager}
                        {selectedTab === 'Figures' && figuresPager}
                    </>
                )}
            >
                <TabPanel name="Events">
                    <SortContext.Provider value={eventsSortState}>
                        {eventsTable}
                    </SortContext.Provider>
                </TabPanel>
                <TabPanel name="Entries">
                    <SortContext.Provider value={entriesSortState}>
                        {entriesTable}
                    </SortContext.Provider>
                </TabPanel>
                <TabPanel name="Figures">
                    <SortContext.Provider value={figuresSortState}>
                        {figuresTable}
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default EventsEntriesFiguresTable;
