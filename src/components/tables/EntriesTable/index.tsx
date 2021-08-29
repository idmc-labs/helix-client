import React, { useState, useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    TabList,
    Tab,
    Tabs,
    TabPanel,
    Pager,
    SortContext,
    TableSortDirection,
    useSortState,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { EntriesQueryVariables } from '#generated/types';
import { PurgeNull } from '#types';
import NudeEntryTable from './NudeEntryTable';
import NudeFigureTable from './NudeFigureTable';
import EntriesFilter from './EntriesFilter';
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

interface EntriesTableProps {
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;

    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    countryId?: string;

    headingPrefix?: string;
}

function EntriesTable(props: EntriesTableProps) {
    const {
        page: pageFromProps,
        pageSize: pageSizeFromProps,
        pagerDisabled,
        className,
        eventColumnHidden,
        crisisColumnHidden,
        eventId,
        userId,
        countryId,
        headingPrefix,
    } = props;

    const [selectedTab, setSelectedTab] = useState('Entries');

    const [entriesPage, setEntriesPage] = useState(pageFromProps ?? 1);
    const [entriesPageSize, setEntriesPageSize] = useState(pageSizeFromProps ?? 10);

    const [figuresPage, setFiguresPage] = useState(pageFromProps ?? 1);
    const [figuresPageSize, setFiguresPageSize] = useState(pageSizeFromProps ?? 10);

    const [totalEntriesCount, setTotalEntriesCount] = useState(0);
    const [totalFiguresCount, setTotalFiguresCount] = useState(0);

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
    ] = useState<PurgeNull<EntriesQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<EntriesQueryVariables>) => {
            setEntriesQueryFilters(value);
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [],
    );

    const entriesVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            event: eventId,
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            ...entriesQueryFilters,
        }),
        [
            entriesOrdering, entriesPage, entriesPageSize,
            eventId, userId, countryId, entriesQueryFilters,
        ],
    );

    const figuresVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            event: eventId,
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            ...entriesQueryFilters,
        }),
        [
            figuresOrdering, figuresPage, figuresPageSize,
            eventId, userId, countryId, entriesQueryFilters,
        ],
    );

    // TODO: handle export of figure and entry
    return (
        <Tabs
            value={selectedTab}
            onChange={setSelectedTab}
        >
            <Container
                headerClassName={styles.header}
                headingContainerClassName={styles.heading}
                heading={(
                    <TabList>
                        <Tab
                            name="Entries"
                            className={styles.tab}
                        >
                            {headingPrefix ? `${headingPrefix} Entries` : 'Entries'}
                        </Tab>
                        <Tab
                            name="Figures"
                            className={styles.tab}
                        >
                            {headingPrefix ? `${headingPrefix} Figures` : 'Figures'}
                        </Tab>
                    </TabList>
                )}
                className={_cs(className, styles.entriesTable)}
                contentClassName={styles.content}
                description={(
                    <EntriesFilter
                        onFilterChange={onFilterChange}
                    />
                )}
                footerContent={!pagerDisabled && (
                    <>
                        {selectedTab === 'Entries' && (
                            <Pager
                                activePage={entriesPage}
                                itemsCount={totalEntriesCount}
                                maxItemsPerPage={entriesPageSize}
                                onActivePageChange={setEntriesPage}
                                onItemsPerPageChange={setEntriesPageSize}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <Pager
                                activePage={figuresPage}
                                itemsCount={totalFiguresCount}
                                maxItemsPerPage={figuresPageSize}
                                onActivePageChange={setFiguresPage}
                                onItemsPerPageChange={setFiguresPageSize}
                            />
                        )}
                    </>
                )}
            >
                <TabPanel name="Entries">
                    <SortContext.Provider value={entriesSortState}>
                        <NudeEntryTable
                            className={styles.table}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            filters={entriesVariables}
                            onTotalEntriesChange={setTotalEntriesCount}
                        />
                    </SortContext.Provider>
                </TabPanel>
                <TabPanel name="Figures">
                    <SortContext.Provider value={figuresSortState}>
                        <NudeFigureTable
                            className={styles.table}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            filters={figuresVariables}
                            onTotalFiguresChange={setTotalFiguresCount}
                        />
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default EntriesTable;
