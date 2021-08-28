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
    country?: string;
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
        country,
    } = props;

    const [selectedTab, setSelectedTab] = useState('entry');

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
    ] = useState<PurgeNull<EntriesQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<EntriesQueryVariables>) => {
            setEntriesQueryFilters(value);
            if (selectedTab === 'entry') {
                setEntriesPage(1);
            } else if (selectedTab === 'figures') {
                setFiguresPage(1);
            }
        },
        [selectedTab],
    );

    const onPageSizeChange = React.useCallback(
        (value: number) => {
            if (selectedTab === 'entry') {
                setEntriesPageSize(value);
            } else if (selectedTab === 'figure') {
                setFiguresPageSize(value);
            }
        },
        [selectedTab],
    );

    const onPageChange = React.useCallback(
        (value: number) => {
            if (selectedTab === 'entry') {
                setEntriesPage(value);
            } else if (selectedTab === 'figure') {
                setFiguresPage(value);
            }
        },
        [selectedTab],
    );

    let ordering: string | undefined;
    if (selectedTab === 'entry') {
        ordering = entriesOrdering;
    } else if (selectedTab === 'figure') {
        ordering = figuresOrdering;
    }

    let page: number;
    if (selectedTab === 'entry') {
        page = entriesPage;
    } else if (selectedTab === 'figure') {
        page = figuresPage;
    } else {
        page = 1;
    }

    let pageSize: number;
    if (selectedTab === 'entry') {
        pageSize = entriesPageSize;
    } else if (selectedTab === 'figure') {
        pageSize = figuresPageSize;
    } else {
        pageSize = 10;
    }

    const entriesVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering,
            page,
            pageSize,
            event: eventId,
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: country ? [country] : undefined,
            ...entriesQueryFilters,
        }),
        [ordering, page, pageSize, eventId, userId, country, entriesQueryFilters],
    );

    return (
        <Tabs
            value={selectedTab}
            onChange={setSelectedTab}
        >
            <Container
                heading={(
                    <TabList>
                        <Tab name="entry">
                            Entries
                        </Tab>
                        <Tab name="figure">
                            Figures
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
                    <Pager
                        activePage={page}
                        // FIXME: get this information
                        itemsCount={1}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={onPageChange}
                        onItemsPerPageChange={onPageSizeChange}
                    />
                )}
            >
                <TabPanel name="entry">
                    <SortContext.Provider value={entriesSortState}>
                        <NudeEntryTable
                            className={styles.table}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            filters={entriesVariables}
                        />
                    </SortContext.Provider>
                </TabPanel>
                <TabPanel name="figure">
                    <SortContext.Provider value={figuresSortState}>
                        <NudeFigureTable
                            className={styles.table}
                            eventColumnHidden={eventColumnHidden}
                            crisisColumnHidden={crisisColumnHidden}
                            filters={entriesVariables}
                        />
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default EntriesTable;
