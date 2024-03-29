import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    SortContext,
} from '@togglecorp/toggle-ui';

import useFilterState from '#hooks/useFilterState';
import Container from '#components/Container';
import {
    ExtractionEntryListFiltersQueryVariables,
    ExtractionFigureListQueryVariables,
    EventListQueryVariables,
    CrisesQueryVariables,
    CountriesQueryVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import CountriesFilter, { CountriesFilterFields } from '#components/rawTables/useCountryTable/CountriesFilter';
import useCountryTable from '#components/rawTables/useCountryTable';
import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import CrisesFilter from '#components/rawTables/useCrisisTable/CrisesFilter';
import useCrisisTable from '#components/rawTables/useCrisisTable';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import { expandObject } from '#utils/common';
import styles from './styles.css';

interface CountriesCrisesEventsEntriesFiguresTableProps {
    className?: string;
    reportId: string;
}

function CountriesCrisesEventsEntriesFiguresTable(
    props: CountriesCrisesEventsEntriesFiguresTableProps,
) {
    const {
        className,
        reportId,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Countries' | 'Crises' | 'Events' | 'Entries' | undefined>('Events');

    const {
        page: countriesPage,
        rawPage: rawCountriesPage,
        setPage: setCountriesPage,

        ordering: countriesOrdering,
        sortState: countriesSortState,

        rawFilter: rawCountriesFilter,
        initialFilter: initialCountriesFilter,
        filter: countriesFilter,
        setFilter: setCountriesFilter,

        pageSize: countriesPageSize,
        rawPageSize: rawCountriesPageSize,
        setPageSize: setCountriesPageSize,
    } = useFilterState<PurgeNull<CountriesFilterFields>>({
        filter: {},
        ordering: {
            name: 'idmc_short_name',
            direction: 'asc',
        },
    });

    const {
        page: crisesPage,
        rawPage: rawCrisesPage,
        setPage: setCrisesPage,

        ordering: crisesOrdering,
        sortState: crisesSortState,

        rawFilter: rawCrisesFilter,
        initialFilter: initialCrisesFilter,
        filter: crisesFilter,
        setFilter: setCrisesFilter,

        pageSize: crisesPageSize,
        rawPageSize: rawCrisesPageSize,
        setPageSize: setCrisesPageSize,
    } = useFilterState<PurgeNull<NonNullable<CrisesQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        page: eventsPage,
        rawPage: rawEventsPage,
        setPage: setEventsPage,

        ordering: eventsOrdering,
        sortState: eventsSortState,

        rawFilter: rawEventsFilter,
        initialFilter: initialEventsFilter,
        filter: eventsFilter,
        setFilter: setEventsFilter,

        pageSize: eventsPageSize,
        rawPageSize: rawEventsPageSize,
        setPageSize: setEventsPageSize,
    } = useFilterState<PurgeNull<NonNullable<EventListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        page: entriesPage,
        rawPage: rawEntriesPage,
        setPage: setEntriesPage,

        ordering: entriesOrdering,
        sortState: entriesSortState,

        // NOTE: We are not using the filters for entries

        pageSize: entriesPageSize,
        rawPageSize: rawEntriesPageSize,
        setPageSize: setEntriesPageSize,
    } = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        page: figuresPage,
        rawPage: rawFiguresPage,
        setPage: setFiguresPage,

        ordering: figuresOrdering,
        sortState: figuresSortState,

        // NOTE: We are not using the filters for entries

        pageSize: figuresPageSize,
        rawPageSize: rawFiguresPageSize,
        setPageSize: setFiguresPageSize,
    } = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const countriesVariables = useMemo(
        (): CountriesQueryVariables => {
            const queryFilters = { ...countriesFilter };
            delete queryFilters.year;

            return ({
                ordering: countriesOrdering,
                page: countriesPage,
                pageSize: countriesPageSize,
                filters: expandObject<NonNullable<CountriesQueryVariables['filters']>>(
                    queryFilters,
                    {
                        filterFigures: {
                            reportId,
                        },
                        aggregateFigures: {
                            filterFigures: {
                                reportId,
                            },
                        },
                    },
                ),
            });
        },
        [
            reportId,
            countriesOrdering,
            countriesPage,
            countriesPageSize,
            countriesFilter,
        ],
    );

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering: crisesOrdering,
            page: crisesPage,
            pageSize: crisesPageSize,
            filters: expandObject<NonNullable<CrisesQueryVariables['filters']>>(
                crisesFilter,
                {
                    filterFigures: {
                        reportId,
                    },
                    aggregateFigures: {
                        filterFigures: {
                            reportId,
                        },
                    },
                },
            ),
        }),
        [
            reportId,
            crisesOrdering,
            crisesPage,
            crisesPageSize,
            crisesFilter,
        ],
    );

    const eventsVariables = useMemo(
        (): EventListQueryVariables => ({
            ordering: eventsOrdering,
            page: eventsPage,
            pageSize: eventsPageSize,
            filters: expandObject<NonNullable<EventListQueryVariables['filters']>>(
                eventsFilter,
                {
                    filterFigures: {
                        reportId,
                    },
                    aggregateFigures: {
                        filterFigures: {
                            reportId,
                        },
                    },
                },
            ),
        }),
        [
            eventsOrdering,
            eventsPage,
            eventsPageSize,
            eventsFilter,
            reportId,
        ],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: {
                reportId,
            },
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            reportId,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionFigureListQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filters: {
                reportId,
            },
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            reportId,
        ],
    );

    // TODO: Add country hidden filters
    const countriesHiddenColumns = ['year' as const];

    const {
        table: countriesTable,
        exportButton: countriesExportButton,
        pager: countriesPager,
    } = useCountryTable({
        className: styles.table,
        filters: countriesVariables,
        page: rawCountriesPage,
        pageSize: rawCountriesPageSize,
        onPageChange: setCountriesPage,
        onPageSizeChange: setCountriesPageSize,
    });

    const {
        table: crisesTable,
        exportButton: crisesExportButton,
        pager: crisesPager,
    } = useCrisisTable({
        className: styles.table,
        filters: crisesVariables,
        page: rawCrisesPage,
        pageSize: rawCrisesPageSize,
        onPageChange: setCrisesPage,
        onPageSizeChange: setCrisesPageSize,
    });

    const {
        table: eventsTable,
        exportButton: eventsExportButton,
        pager: eventsPager,
    } = useEventTable({
        className: styles.table,
        filters: eventsVariables,
        page: rawEventsPage,
        pageSize: rawEventsPageSize,
        onPageChange: setEventsPage,
        onPageSizeChange: setEventsPageSize,
    });

    const {
        table: entriesTable,
        exportButton: entriesExportButton,
        pager: entriesPager,
    } = useEntryTable({
        className: styles.table,
        filters: entriesVariables,
        page: rawEntriesPage,
        pageSize: rawEntriesPageSize,
        onPageChange: setEntriesPage,
        onPageSizeChange: setEntriesPageSize,
    });

    const {
        table: figuresTable,
        exportButton: figuresExportButton,
        pager: figuresPager,
        bulkActions: figuresBulkActions,
    } = useFigureTable({
        className: styles.table,
        filters: figuresVariables,
        page: rawFiguresPage,
        pageSize: rawFiguresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: setFiguresPageSize,
    });

    return (
        <>
            <Container
                compactContent
                heading="Figures"
                className={_cs(className, styles.entriesTable)}
                contentClassName={styles.content}
                headerActions={figuresExportButton}
                footerContent={(
                    <>
                        {figuresPager}
                        {figuresBulkActions}
                    </>
                )}
            >
                <SortContext.Provider value={figuresSortState}>
                    {figuresTable}
                </SortContext.Provider>
            </Container>
            <Tabs
                value={selectedTab}
                onChange={setSelectedTab}
            >
                <Container
                    compactContent
                    tabs={(
                        <TabList>
                            <Tab
                                name="Countries"
                            >
                                Countries
                            </Tab>
                            <Tab
                                name="Crises"
                            >
                                Crises
                            </Tab>
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
                        </TabList>
                    )}
                    className={_cs(className, styles.entriesTable)}
                    contentClassName={styles.content}
                    description={(
                        <>
                            {selectedTab === 'Countries' && (
                                <CountriesFilter
                                    currentFilter={rawCountriesFilter}
                                    initialFilter={initialCountriesFilter}
                                    onFilterChange={setCountriesFilter}
                                    hiddenFields={countriesHiddenColumns}
                                />
                            )}
                            {selectedTab === 'Crises' && (
                                <CrisesFilter
                                    currentFilter={rawCrisesFilter}
                                    initialFilter={initialCrisesFilter}
                                    onFilterChange={setCrisesFilter}
                                />
                            )}
                            {selectedTab === 'Events' && (
                                <EventsFilter
                                    currentFilter={rawEventsFilter}
                                    initialFilter={initialEventsFilter}
                                    onFilterChange={setEventsFilter}
                                />
                            )}
                        </>
                    )}
                    headerActions={(
                        <>
                            {selectedTab === 'Countries' && countriesExportButton}
                            {selectedTab === 'Crises' && crisesExportButton}
                            {selectedTab === 'Events' && eventsExportButton}
                            {selectedTab === 'Entries' && entriesExportButton}
                        </>
                    )}
                    footerContent={(
                        <>
                            {selectedTab === 'Countries' && countriesPager}
                            {selectedTab === 'Crises' && crisesPager}
                            {selectedTab === 'Events' && eventsPager}
                            {selectedTab === 'Entries' && entriesPager}
                        </>
                    )}
                >
                    <TabPanel name="Countries">
                        <SortContext.Provider value={countriesSortState}>
                            {countriesTable}
                        </SortContext.Provider>
                    </TabPanel>
                    <TabPanel name="Crises">
                        <SortContext.Provider value={crisesSortState}>
                            {crisesTable}
                        </SortContext.Provider>
                    </TabPanel>
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
                </Container>
            </Tabs>
        </>
    );
}
export default CountriesCrisesEventsEntriesFiguresTable;
