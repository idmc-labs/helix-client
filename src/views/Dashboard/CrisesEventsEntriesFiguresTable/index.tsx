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
} from '#generated/types';
import { PurgeNull } from '#types';
import EventsFilter from '#components/rawTables/useEventTable/EventsFilter';
import useEventTable from '#components/rawTables/useEventTable';
import CrisesFilter from '#components/rawTables/useCrisisTable/CrisesFilter';
import useCrisisTable from '#components/rawTables/useCrisisTable';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import FiguresFilter from '#components/rawTables/useFigureTable/FiguresFilter';
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

interface CrisesEventsEntriesFiguresTableProps {
    className?: string;
    userId: string;
}

function CrisesEventsEntriesFiguresTable(props: CrisesEventsEntriesFiguresTableProps) {
    const {
        className,
        userId,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Crises' | 'Events' | 'Entries' | 'Figures' | undefined>('Figures');

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

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering: crisesOrdering,
            page: crisesPage,
            pageSize: crisesPageSize,
            filters: expandObject<NonNullable<CrisesQueryVariables['filters']>>(
                crisesFilter,
                {
                    createdByIds: [userId],
                },
            ),
        }),
        [
            userId,
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
                    createdByIds: [userId],
                },
            ),
        }),
        [
            eventsOrdering,
            eventsPage,
            eventsPageSize,
            eventsFilter,
            userId,
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
                    filterFigureCreatedBy: [userId],
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            entriesFilter,
            userId,
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
                    filterFigureCreatedBy: [userId],
                },
            ),
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            figuresFilter,
            userId,
        ],
    );

    const crisesHiddenColumns = ['createdBy' as const];
    const eventsHiddenColumns = ['createdBy' as const];
    const figureHiddenColumns = ['createdBy' as const];

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
                        {selectedTab === 'Crises' && (
                            <CrisesFilter
                                currentFilter={rawCrisesFilter}
                                initialFilter={initialCrisesFilter}
                                onFilterChange={setCrisesFilter}
                                hiddenFields={crisesHiddenColumns}
                            />
                        )}
                        {selectedTab === 'Events' && (
                            <EventsFilter
                                currentFilter={rawEventsFilter}
                                initialFilter={initialEventsFilter}
                                onFilterChange={setEventsFilter}
                                hiddenFields={eventsHiddenColumns}
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <FiguresFilter
                                currentFilter={rawEntriesFilter}
                                initialFilter={initialEntriesFilter}
                                onFilterChange={setEntriesFilter}
                                hiddenFields={figureHiddenColumns}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <FiguresFilter
                                currentFilter={rawFiguresFilter}
                                initialFilter={initialFiguresFilter}
                                onFilterChange={setFiguresFilter}
                                hiddenFields={figureHiddenColumns}
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
                        {selectedTab === 'Figures' && figuresExportButton}
                    </>
                )}
                footerContent={(
                    <>
                        {selectedTab === 'Crises' && crisesPager}
                        {selectedTab === 'Events' && eventsPager}
                        {selectedTab === 'Entries' && entriesPager}
                        {selectedTab === 'Figures' && (
                            <>
                                {figuresPager}
                                {figuresBulkActions}
                            </>
                        )}
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
                <TabPanel name="Figures">
                    <SortContext.Provider value={figuresSortState}>
                        {figuresTable}
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default CrisesEventsEntriesFiguresTable;
