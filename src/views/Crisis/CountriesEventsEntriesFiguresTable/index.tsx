import React, { useState, useMemo, useEffect } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    SortContext,
} from '@togglecorp/toggle-ui';

import useFilterState, { FilterStateResponse } from '#hooks/useFilterState';
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
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Filter = PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>;
type FilterState = FilterStateResponse<Filter>;

interface CountriesEventsEntriesFiguresTableProps {
    className?: string;
    crisisId: string;
    crisisYear: number;
    figuresFilterState: FilterState,
}

function CountriesEventsEntriesFiguresTable(props: CountriesEventsEntriesFiguresTableProps) {
    const {
        className,
        crisisId,
        crisisYear,
        figuresFilterState,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Countries' | 'Events' | 'Entries' | 'Figures' | undefined>('Events');

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

        rawFilter: rawFiguresFilter,
        // initialFilter: initialFiguresFilter,
        filter: figuresFilter,
        // setFilter: setFiguresFilter,

        pageSize: figuresPageSize,
        rawPageSize: rawFiguresPageSize,
        setPageSize: setFiguresPageSize,
    } = figuresFilterState;

    // NOTE: reset page to 1 when figures filter changes
    useEffect(
        () => {
            setCountriesPage(1);
            setEventsPage(1);
            setEntriesPage(1);
            // setFiguresPage(1);
        },
        [
            rawFiguresFilter,
            setCountriesPage,
            setEventsPage,
            setEntriesPage,
        ],
    );

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
                        filterFigures: figuresFilter,
                        aggregateFigures: {
                            filterFigures: expandObject(
                                figuresFilter,
                                {
                                    filterFigureCrises: [crisisId],
                                },
                            ),
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
            figuresFilter,
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
                    filterFigures: figuresFilter,
                    aggregateFigures: {
                        filterFigures: expandObject(
                            figuresFilter,
                            {
                                filterFigureCrises: [crisisId],
                            },
                        ),
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
            figuresFilter,
        ],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                figuresFilter,
                {
                    filterFigureCrises: [crisisId],
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            figuresFilter,
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
        bulkActions: figuresBulkActions,
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
                        </>
                    )}
                    footerContent={(
                        <>
                            {selectedTab === 'Countries' && countriesPager}
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
export default CountriesEventsEntriesFiguresTable;
