import React, { useState, useMemo } from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
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
} from '#generated/types';
import { PurgeNull } from '#types';
import CountriesFilter from '#components/rawTables/useCountryTable/CountriesFilter';
import useCountryTable from '#components/rawTables/useCountryTable';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import FiguresFilter from '#components/rawTables/useFigureTable/FiguresFilter';
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

interface EntriesFiguresTableProps {
    className?: string;
    eventId?: string;
}

function CountriesEntriesFiguresTable(props: EntriesFiguresTableProps) {
    const {
        className,
        eventId,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Countries' | 'Entries' | 'Figures' | undefined>('Figures');

    const {
        page: countriesPage,
        rawPage: rawCountriesPage,
        setPage: setCountriesPage,

        ordering: countriesOrdering,
        sortState: countriesSortState,

        rawFilter: rawCountriesFilter,
        filter: countriesFilter,
        setFilter: setCountriesFilter,

        pageSize: countriesPageSize,
        rawPageSize: rawCountriesPageSize,
        setPageSize: setCountriesPageSize,
    } = useFilterState<PurgeNull<NonNullable<CountriesQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'idmc_short_name',
            direction: 'asc',
        },
    });

    const countriesVariables = useMemo(
        (): CountriesQueryVariables => ({
            ordering: countriesOrdering,
            page: countriesPage,
            pageSize: countriesPageSize,
            filters: expandObject<NonNullable<CountriesQueryVariables['filters']>>(
                countriesFilter,
                // TODO: use countries filter here
                {},
            ),
        }),
        [
            countriesOrdering,
            countriesPage,
            countriesPageSize,
            countriesFilter,
        ],
    );

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
        page: entriesPage,
        rawPage: rawEntriesPage,
        setPage: setEntriesPage,

        ordering: entriesOrdering,
        sortState: entriesSortState,

        rawFilter: rawEntriesFilter,
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

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                entriesFilter,
                {
                    filterFigureEvents: eventId ? [eventId] : undefined,
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            entriesFilter,
            eventId,
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
                    filterFigureEvents: eventId ? [eventId] : undefined,
                },
            ),
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            eventId,
            figuresFilter,
        ],
    );

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

    const figureHiddenColumns = [
        eventId ? 'event' as const : undefined,
    ].filter(isDefined);

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
                                initialFilter={rawCountriesFilter}
                                onFilterChange={setCountriesFilter}
                                // hiddenFields={figureHiddenColumns}
                                // events={eventId ? [eventId] : undefined}
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <FiguresFilter
                                initialFilter={rawEntriesFilter}
                                onFilterChange={setEntriesFilter}
                                hiddenFields={figureHiddenColumns}
                                events={eventId ? [eventId] : undefined}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <FiguresFilter
                                initialFilter={rawFiguresFilter}
                                onFilterChange={setFiguresFilter}
                                hiddenFields={figureHiddenColumns}
                                events={eventId ? [eventId] : undefined}
                            />
                        )}
                    </>
                )}
                headerActions={(
                    <>
                        {selectedTab === 'Countries' && countriesExportButton}
                        {selectedTab === 'Entries' && entriesExportButton}
                        {selectedTab === 'Figures' && figuresExportButton}
                    </>
                )}
                footerContent={(
                    <>
                        {selectedTab === 'Countries' && countriesPager}
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
export default CountriesEntriesFiguresTable;
