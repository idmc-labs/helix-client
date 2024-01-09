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
    EventListQueryVariables,
    CrisesQueryVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import CrisesFilter from '#components/rawTables/useCrisisTable/CrisesFilter';
import useCrisisTable from '#components/rawTables/useCrisisTable';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Filter = PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>;
type FilterState = FilterStateResponse<Filter>;

interface CrisesEventsEntriesFiguresTableProps {
    className?: string;
    countryId: string;
    figuresFilterState: FilterState,
}

function CrisesEventsEntriesFiguresTable(props: CrisesEventsEntriesFiguresTableProps) {
    const {
        className,
        countryId,
        figuresFilterState,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Crises' | 'Events' | 'Entries' | undefined>('Events');

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
            setCrisesPage(1);
            setEventsPage(1);
            setEntriesPage(1);
            // setFiguresPage(1);
        },
        [
            rawFiguresFilter,
            setCrisesPage,
            setEventsPage,
            setEntriesPage,
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
                    countries: [countryId],
                    filterFigures: figuresFilter,
                    aggregateFigures: {
                        filterFigures: expandObject(
                            figuresFilter,
                            {
                                filterFigureCountries: [countryId],
                            },
                        ),
                    },
                },
            ),
        }),
        [
            countryId,
            crisesOrdering,
            crisesPage,
            crisesPageSize,
            crisesFilter,
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
                    countries: [countryId],
                    filterFigures: figuresFilter,
                    aggregateFigures: {
                        filterFigures: expandObject(
                            figuresFilter,
                            {
                                filterFigureCountries: [countryId],
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
            countryId,
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
                    filterFigureCountries: [countryId],
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            figuresFilter,
            countryId,
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
                    filterFigureCountries: [countryId],
                },
            ),
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            figuresFilter,
            countryId,
        ],
    );

    const crisesHiddenColumns = ['countries' as const];
    const eventsHiddenColumns = ['countries' as const];
    const figureHiddenColumns = ['country' as const];

    const {
        table: crisesTable,
        exportButton: crisesExportButton,
        addButton: crisesAddButton,
        pager: crisesPager,
    } = useCrisisTable({
        className: styles.table,
        filters: crisesVariables,
        page: rawCrisesPage,
        pageSize: rawCrisesPageSize,
        onPageChange: setCrisesPage,
        onPageSizeChange: setCrisesPageSize,
        hiddenColumns: crisesHiddenColumns,
        defaultFormValue: {
            countries: [countryId],
        },
        disabledFields: ['countries'],
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
            countries: [countryId],
        },
        disabledFields: ['countries'],
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

    return (
        <>
            <Container
                compactContent
                heading="Figures"
                className={_cs(className, styles.entriesTable)}
                contentClassName={styles.content}
                headerActions={figuresExportButton}
                footerContent={figuresPager}
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
                            {selectedTab === 'Crises' && (
                                <CrisesFilter
                                    currentFilter={rawCrisesFilter}
                                    initialFilter={initialCrisesFilter}
                                    onFilterChange={setCrisesFilter}
                                    // NOTE: we do not have countries or fields related to countries
                                    // hiddenFields={crisesHiddenColumns}
                                    // countries={[countryId]}
                                />
                            )}
                            {selectedTab === 'Events' && (
                                <EventsFilter
                                    currentFilter={rawEventsFilter}
                                    initialFilter={initialEventsFilter}
                                    onFilterChange={setEventsFilter}
                                    hiddenFields={eventsHiddenColumns}
                                    countries={[countryId]}
                                />
                            )}
                        </>
                    )}
                    headerActions={(
                        <>
                            {selectedTab === 'Crises' && (
                                <>
                                    {crisesAddButton}
                                    {crisesExportButton}
                                </>
                            )}
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
                            {selectedTab === 'Crises' && crisesPager}
                            {selectedTab === 'Events' && eventsPager}
                            {selectedTab === 'Entries' && entriesPager}
                        </>
                    )}
                >
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
export default CrisesEventsEntriesFiguresTable;
