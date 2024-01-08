import React, { useState, useMemo, useEffect } from 'react';
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
    CountriesQueryVariables,
    EventListQueryVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import CountriesFilter, { CountriesFilterFields } from '#components/rawTables/useCountryTable/CountriesFilter';
import useCountryTable from '#components/rawTables/useCountryTable';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import FiguresFilter from '#components/rawTables/useFigureTable/FiguresFilter';
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

interface CountriesEventsEntriesFiguresTableProps {
    className?: string;
    crisisId: string;
    crisisYear: number;
}

function CountriesEventsEntriesFiguresTable(props: CountriesEventsEntriesFiguresTableProps) {
    const {
        className,
        crisisId,
        crisisYear,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Countries' | 'Events' | 'Entries' | 'Figures' | undefined>('Figures');

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
        page: eventsPage,
        rawPage: rawEventsPage,
        setPage: setEventsPage,

        ordering: eventsOrdering,
        sortState: eventsSortState,

        rawFitler: rawEventsFilter,
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

        rawFilter: rawEntriesFilter,
        initialFilter: initialEntriesFilter,
        filter: entriesFilter,
        setFilter: setEntriesFilter,

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

        rawFilter: rawFiguresFilter,
        initialFilter: initialFiguresFilter,
        filter: figuresFilter,
        setFilter: setFiguresFilter,

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
                        crises: [crisisId],
                        aggregateFigures: {
                            filterFigures: {
                                filterFigureCrises: [crisisId],
                            },
                            year: countriesFilter.year,
                        },
                    },
                ),
            });
        },
        [
            crisisId,
            countriesOrdering,
            countriesPage,
            countriesPageSize,
            countriesFilter,
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
                    crisisByIds: [crisisId],
                    aggregateFigures: {
                        filterFigures: {
                            filterFigureCrises: [crisisId],
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
            crisisId,
        ],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                entriesFilter,
                {
                    filterFigureCrises: [crisisId],
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            entriesFilter,
            crisisId,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionFigureListQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filters: expandObject<NonNullable<ExtractionFigureListQueryVariables['filters']>>(
                figuresFilter,
                {
                    filterFigureCrises: [crisisId],
                },
            ),
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            crisisId,
            figuresFilter,
        ],
    );

    const eventsHiddenColumns = ['crisis' as const];
    const figureHiddenColumns = ['crisis' as const];

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
        table: eventsTable,
        exportButton: eventsExportButton,
        addButton: eventsAddButton,
        pager: eventsPager,
    } = useEventTable({
        className: styles.table,
        filters: eventsVariables,
        page: rawEventsPage,
        pageSize: rawEventsPageSize,
        onPageChange: setEventsPage,
        onPageSizeChange: setEventsPageSize,
        hiddenColumns: eventsHiddenColumns,
        defaultFormValue: {
            crisis: crisisId,
        },
        disabledFields: ['crisis'],
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
    } = useFigureTable({
        className: styles.table,
        filters: figuresVariables,
        page: rawFiguresPage,
        pageSize: rawFiguresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: setFiguresPageSize,
        hiddenColumns: figureHiddenColumns,
    });

    useEffect(
        () => {
            if (crisisYear) {
                setCountriesFilter(() => ({ year: crisisYear }), true);
            }
        },
        [crisisYear, setCountriesFilter],
    );

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
                            name="Countries"
                        >
                            Countries
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
                        <Tab
                            name="Figures"
                        >
                            Figures
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
                                // hiddenFields={countriesHiddenColumns}
                                // crises={crisisId ? [crisisId] : undefined}
                            />
                        )}
                        {selectedTab === 'Events' && (
                            <EventsFilter
                                currentFilter={rawEventsFilter}
                                initialFilter={initialEventsFilter}
                                onFilterChange={setEventsFilter}
                                hiddenFields={eventsHiddenColumns}
                                crises={[crisisId]}
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <FiguresFilter
                                currentFilter={rawEntriesFilter}
                                initialFilter={initialEntriesFilter}
                                onFilterChange={setEntriesFilter}
                                hiddenFields={figureHiddenColumns}
                                crises={[crisisId]}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <FiguresFilter
                                currentFilter={rawFiguresFilter}
                                initialFilter={initialFiguresFilter}
                                onFilterChange={setFiguresFilter}
                                hiddenFields={figureHiddenColumns}
                                crises={[crisisId]}
                            />
                        )}
                    </>
                )}
                headerActions={(
                    <>
                        {selectedTab === 'Countries' && countriesExportButton}
                        {selectedTab === 'Events' && (
                            <>
                                {eventsAddButton}
                                {eventsExportButton}
                            </>
                        )}
                        {selectedTab === 'Entries' && entriesExportButton}
                        {selectedTab === 'Figures' && figuresExportButton}
                    </>
                )}
                footerContent={(
                    <>
                        {selectedTab === 'Countries' && countriesPager}
                        {selectedTab === 'Events' && eventsPager}
                        {selectedTab === 'Entries' && entriesPager}
                        {selectedTab === 'Figures' && figuresPager}
                    </>
                )}
            >
                <TabPanel name="Countries">
                    <SortContext.Provider value={countriesSortState}>
                        {countriesTable}
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
                <TabPanel name="Figures">
                    <SortContext.Provider value={figuresSortState}>
                        {figuresTable}
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default CountriesEventsEntriesFiguresTable;
