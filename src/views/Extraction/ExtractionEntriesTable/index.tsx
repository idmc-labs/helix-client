import React, { useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    SortContext,
    TableSortDirection,
    useSortState,
} from '@togglecorp/toggle-ui';

import {
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import Container from '#components/Container';

import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';
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

interface ExtractionEntriesTableProps {
    headingActions?: React.ReactNode;
    className?: string;
    filters?: ExtractionEntryListFiltersQueryVariables;
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        headingActions,
        className,
        filters,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | undefined>('Figures');

    const [entriesPage, setEntriesPage] = useState(1);
    const [entriesPageSize, setEntriesPageSize] = useState(10);
    const debouncedEntriesPage = useDebouncedValue(entriesPage);

    const [figuresPage, setFiguresPage] = useState(1);
    const [figuresPageSize, setFiguresPageSize] = useState(10);
    const debouncedFiguresPage = useDebouncedValue(figuresPage);

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

    // NOTE: reset current page when filter is changed
    // We need a useLayoutEffect as the filters is passed from parent
    useLayoutEffect(
        () => {
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [filters, entriesPageSize, figuresPageSize],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: debouncedEntriesPage,
            pageSize: entriesPageSize,
            ...filters,
        }),
        [
            entriesOrdering,
            debouncedEntriesPage,
            entriesPageSize,
            filters,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: figuresOrdering,
            page: debouncedFiguresPage,
            pageSize: figuresPageSize,
            ...filters,
        }),
        [
            figuresOrdering,
            debouncedFiguresPage,
            figuresPageSize,
            filters,
        ],
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
        filters: entriesVariables,
        page: entriesPage,
        pageSize: entriesPageSize,
        onPageChange: setEntriesPage,
        onPageSizeChange: handleEntriesPageSizeChange,
    });

    const {
        table: figuresTable,
        exportButton: figuresExportButton,
        pager: figuresPager,
    } = useFigureTable({
        filters: figuresVariables,
        page: figuresPage,
        pageSize: figuresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: handleFiguresPageSizeChange,
        hiddenColumns: undefined,
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
                headerActions={(
                    <>
                        {selectedTab === 'Entries' && entriesExportButton}
                        {selectedTab === 'Figures' && figuresExportButton}
                        {headingActions}
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
export default ExtractionEntriesTable;
