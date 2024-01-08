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
    Figure_Review_Status as FigureReviewStatus,
} from '#generated/types';
import { PurgeNull } from '#types';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
import FiguresFilter from '#components/rawTables/useFigureTable/FiguresFilter';
import { expandObject } from '#utils/common';
import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

interface EntriesFiguresTableProps {
    className?: string;

    figureCreatedBy?: string | undefined;
    figureReviewStatus?: FigureReviewStatus;
}

function EntriesFiguresTable(props: EntriesFiguresTableProps) {
    const {
        className,
        figureCreatedBy,
        figureReviewStatus,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | undefined>('Figures');

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

    const entriesVariables = useMemo(
        () => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: expandObject<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>(
                entriesFilter,
                {
                    filterFigureCreatedBy: figureCreatedBy
                        ? [figureCreatedBy]
                        : undefined,
                    filterFigureReviewStatus: figureReviewStatus
                        ? [figureReviewStatus]
                        : undefined,
                },
            ),
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            entriesFilter,
            figureCreatedBy,
            figureReviewStatus,
        ],
    );

    const figuresVariables = useMemo(
        () => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filters: expandObject<NonNullable<ExtractionFigureListQueryVariables['filters']>>(
                figuresFilter,
                {
                    filterFigureCreatedBy: figureCreatedBy
                        ? [figureCreatedBy]
                        : undefined,
                    filterFigureReviewStatus: figureReviewStatus
                        ? [figureReviewStatus]
                        : undefined,
                },
            ),
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            figuresFilter,
            figureCreatedBy,
            figureReviewStatus,
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
        figureCreatedBy ? 'createdBy' as const : undefined,
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
                        {selectedTab === 'Entries' && entriesExportButton}
                        {selectedTab === 'Figures' && figuresExportButton}
                    </>
                )}
                footerContent={(
                    <>
                        {selectedTab === 'Entries' && entriesPager}
                        {selectedTab === 'Figures' && figuresPager}
                    </>
                )}
            >
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
export default EntriesFiguresTable;
