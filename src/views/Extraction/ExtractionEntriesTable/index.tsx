import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    SortContext,
} from '@togglecorp/toggle-ui';

import {
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import Container from '#components/Container';
import { FilterStateResponse } from '#hooks/useFilterState';
import useEntryTable from '#components/rawTables/useEntryTable';
import useFigureTable from '#components/rawTables/useFigureTable';

import styles from './styles.css';

type Tabs = 'Entries' | 'Figures';

type Filter = PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>;
type FilterState = FilterStateResponse<Filter>;

interface ExtractionEntriesTableProps {
    headingActions?: React.ReactNode;
    className?: string;
    entriesFilterState: FilterState,
    figuresFilterState: FilterState,
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        headingActions,
        className,
        entriesFilterState,
        figuresFilterState,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | undefined>('Figures');

    const {
        page: entriesPage,
        setPage: setEntriesPage,

        ordering: entriesOrdering,
        sortState: entriesSortState,

        filter: entriesFilter,

        pageSize: entriesPageSize,
        setPageSize: setEntriesPageSize,
    } = entriesFilterState;

    const {
        page: figuresPage,
        setPage: setFiguresPage,

        ordering: figuresOrdering,
        sortState: figuresSortState,

        filter: figuresFilter,

        pageSize: figuresPageSize,
        setPageSize: setFiguresPageSize,
    } = figuresFilterState;

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filters: entriesFilter,
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            entriesFilter,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filters: figuresFilter,
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            figuresFilter,
        ],
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
        onPageSizeChange: setEntriesPageSize,
    });

    const {
        table: figuresTable,
        exportButton: figuresExportButton,
        updateRoleButton: updateFiguresRoleButton,
        pager: figuresPager,
    } = useFigureTable({
        filters: figuresVariables,
        page: figuresPage,
        pageSize: figuresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: setFiguresPageSize,
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
                        {selectedTab === 'Figures' && (
                            <>
                                {figuresPager}
                                {updateFiguresRoleButton}
                            </>
                        )}
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
