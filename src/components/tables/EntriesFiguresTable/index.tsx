import React, { useState, useMemo, useCallback } from 'react';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
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
    Figure_Review_Status as FigureReviewStatus,
} from '#generated/types';
import { PurgeNull } from '#types';
import useEntryTable from '#components/rawTables/EntriesTable';
import useFigureTable from '#components/rawTables/FiguresTable';
import EntriesFilter from '#components/rawTables/EntriesTable/EntriesFilter';
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

interface EntriesFiguresTableProps {
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;

    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    countryId?: string;
    reviewStatus?: FigureReviewStatus;
}

function EntriesFiguresTable(props: EntriesFiguresTableProps) {
    const {
        page: pageFromProps,
        pageSize: pageSizeFromProps,
        pagerDisabled,
        pagerPageControlDisabled,
        className,
        eventColumnHidden,
        crisisColumnHidden,
        userId,
        countryId,
        eventId,
        reviewStatus,
    } = props;

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | undefined>('Figures');

    const [entriesPage, setEntriesPage] = useState(pageFromProps ?? 1);
    const [entriesPageSize, setEntriesPageSize] = useState(pageSizeFromProps ?? 10);

    const [figuresPage, setFiguresPage] = useState(pageFromProps ?? 1);
    const [figuresPageSize, setFiguresPageSize] = useState(pageSizeFromProps ?? 10);

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

    const [
        entriesQueryFilters,
        setEntriesQueryFilters,
    ] = useState<PurgeNull<ExtractionEntryListFiltersQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ExtractionEntryListFiltersQueryVariables>) => {
            setEntriesQueryFilters(value);
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            filterFigureEvents: eventId ? [eventId] : undefined,
            filterCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            filterFigureReviewStatus: reviewStatus
                ? [reviewStatus]
                : entriesQueryFilters?.filterFigureReviewStatus,
            ...entriesQueryFilters,
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            eventId,
            userId,
            countryId,
            entriesQueryFilters,
            reviewStatus,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionFigureListQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filterFigureEvents: eventId ? [eventId] : undefined,
            filterCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            filterFigureReviewStatus: reviewStatus
                ? [reviewStatus]
                : entriesQueryFilters?.filterFigureReviewStatus,
            ...entriesQueryFilters,
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            eventId,
            userId,
            countryId,
            entriesQueryFilters,
            reviewStatus,
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
        className: styles.table,
        filters: entriesVariables,
        page: entriesPage,
        pageSize: entriesPageSize,
        onPageChange: setEntriesPage,
        onPageSizeChange: handleEntriesPageSizeChange,
        pagerPageControlDisabled,
    });

    const {
        table: figuresTable,
        exportButton: figuresExportButton,
        pager: figuresPager,
    } = useFigureTable({
        className: styles.table,
        eventColumnHidden,
        crisisColumnHidden,
        filters: figuresVariables,
        page: figuresPage,
        pageSize: figuresPageSize,
        onPageChange: setFiguresPage,
        onPageSizeChange: handleFiguresPageSizeChange,
        pagerPageControlDisabled,
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
                            <EntriesFilter
                                onFilterChange={onFilterChange}
                                reviewStatusHidden={!!reviewStatus}
                                defaultEvents={eventId ? [eventId] : undefined}
                                eventsHidden={isDefined(eventId)}
                                defaultCountries={countryId ? [countryId] : undefined}
                                countriesHidden={isDefined(countryId)}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <EntriesFilter
                                onFilterChange={onFilterChange}
                                reviewStatusHidden={!!reviewStatus}
                                defaultEvents={eventId ? [eventId] : undefined}
                                defaultCountries={countryId ? [countryId] : undefined}
                                eventsHidden={isDefined(eventId)}
                                countriesHidden={isDefined(countryId)}
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
                footerContent={!pagerDisabled && (
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
