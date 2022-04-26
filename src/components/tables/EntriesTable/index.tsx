import React, { useState, useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
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
    ConfirmButton,
} from '@togglecorp/toggle-ui';

import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import {
    EntriesQueryVariables,
    ExportEventEntriesMutation,
    ExportEventEntriesMutationVariables,
    ExportEventFiguresMutation,
    ExportEventFiguresMutationVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import NudeEntryTable from './NudeEntryTable';
import NudeFigureTable from './NudeFigureTable';
import EntriesFilter from './EntriesFilter';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);
type Tabs = 'Entries' | 'Figures';

const ENTRIES_EXPORT = gql`
    mutation ExportEventEntries(
        $filterEntryArticleTitle: String,
        $filterContextOfViolences: [ID!],
        $filterEntryCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureRoles: [String!],
        $filterFigureStartAfter: Date,
        $filterEntryHasReviewComments: Boolean,
    ) {
       exportEntries(
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterContextOfViolences: $filterContextOfViolences,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntrySources: $filterEntrySources,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureRoles: $filterFigureRoles,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ) {
           errors
            ok
        }
    }
`;

const FIGURES_EXPORT = gql`
    mutation ExportEventFigures(
        $event: String,
        $filterContextOfViolences: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterEntrySources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date,
        $filterEntryHasReviewComments: Boolean,
    ) {
       exportFigures(
            event: $event,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterContextOfViolences: $filterContextOfViolences,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntrySources: $filterEntrySources,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterFigureCountries: $filterFigureCountries,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ) {
           errors
            ok
        }
    }
`;

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
    pagerPageControlDisabled?: boolean;

    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    userId?: string;
    countryId?: string;

    headingPrefix?: string;
}

function EntriesTable(props: EntriesTableProps) {
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
        headingPrefix,
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
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
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            ...entriesQueryFilters,
        }),
        [
            entriesOrdering,
            entriesPage,
            entriesPageSize,
            userId,
            countryId,
            entriesQueryFilters,
        ],
    );

    const figuresVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: countryId ? [countryId] : undefined,
            ...entriesQueryFilters,
        }),
        [
            figuresOrdering,
            figuresPage,
            figuresPageSize,
            userId,
            countryId,
            entriesQueryFilters,
        ],
    );

    const [
        exportEventEntries,
        { loading: exportingEventEntries },
    ] = useMutation<ExportEventEntriesMutation, ExportEventEntriesMutationVariables>(
        ENTRIES_EXPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEntries: exportEntriesResponse } = response;
                if (!exportEntriesResponse) {
                    return;
                }
                const { errors, ok } = exportEntriesResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const [
        exportFigureEntries,
        { loading: exportingFigureEntries },
    ] = useMutation<ExportEventFiguresMutation, ExportEventFiguresMutationVariables>(
        FIGURES_EXPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportFigures: exportFiguresResponse } = response;
                if (!exportFiguresResponse) {
                    return;
                }
                const { errors, ok } = exportFiguresResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            if (selectedTab === 'Entries') {
                exportEventEntries({
                    variables: entriesVariables,
                });
            } else {
                exportFigureEntries({
                    variables: figuresVariables,
                });
            }
        },
        [selectedTab, entriesVariables, figuresVariables, exportEventEntries, exportFigureEntries],
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
                headerActions={(
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingEventEntries || exportingFigureEntries}
                    >
                        Export
                    </ConfirmButton>
                )}
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
                                itemsPerPageControlHidden={pagerPageControlDisabled}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <Pager
                                activePage={figuresPage}
                                itemsCount={totalFiguresCount}
                                maxItemsPerPage={figuresPageSize}
                                onActivePageChange={setFiguresPage}
                                onItemsPerPageChange={setFiguresPageSize}
                                itemsPerPageControlHidden={pagerPageControlDisabled}
                            />
                        )}
                    </>
                )}
            >
                <TabPanel name="Entries">
                    <SortContext.Provider value={entriesSortState}>
                        <NudeEntryTable
                            className={styles.table}
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
