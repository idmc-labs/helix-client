import React, { useState, useMemo, useLayoutEffect, useContext, useCallback } from 'react';
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
import { getOperationName } from 'apollo-link';
import { gql, useMutation } from '@apollo/client';

import {
    ExtractionEntryListFiltersQueryVariables,
    ExportEntriesMutation,
    ExportEntriesMutationVariables,
    ExportFiguresMutation,
    ExportFiguresMutationVariables,
} from '#generated/types';
import NotificationContext from '#components/NotificationContext';
import Container from '#components/Container';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import NudeEntryTable from './NudeEntryTable';
import NudeFigureTable from './NudeFigureTable';
import styles from './styles.css';

const ENTRIES_DOWNLOAD = gql`
    mutation ExportEntries(
        $filterFigureCategories: [String!],
        $filterEntryArticleTitle: String,
        $filterEntryCreatedBy: [ID!],
        $filterEntryHasReviewComments: Boolean,
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventCrises: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureRegions: [ID!],
        $filterFigureRoles: [String!],
        $filterEntryHasDisaggregatedData: Boolean,
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
        $filterEvents: [ID!],
    ) {
       exportEntries(
            filterFigureCategories: $filterFigureCategories,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntrySources: $filterEntrySources,
            filterEventCrises: $filterEventCrises,
            filterEventCrisisTypes: $filterEventCrisisTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureRegions: $filterFigureRegions,
            filterFigureRoles: $filterFigureRoles,
            filterEntryHasDisaggregatedData: $filterEntryHasDisaggregatedData,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
            filterEvents: $filterEvents,
        ) {
           errors
            ok
        }
    }
`;

const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $event: String,
        $filterFigureCategories: [String!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterEntrySources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date,
        $filterFigureEndBefore: Date,
        $filterFigureTerms: [ID!],
        $filterEntryHasDisaggregatedData: Boolean,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterEvents: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterFigureTags: [ID!],
        $filterEntryHasReviewComments: Boolean,
    ) {
       exportFigures(
            event: $event,
            filterFigureCategories: $filterFigureCategories,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryPublishers: $filterEntryPublishers,
            filterEntrySources: $filterEntrySources,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterFigureCountries: $filterFigureCountries,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureTerms: $filterFigureTerms,
            filterEntryHasDisaggregatedData: $filterEntryHasDisaggregatedData,
            filterFigureRoles: $filterFigureRoles,
            filterFigureRegions: $filterFigureRegions,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterEvents: $filterEvents,
            filterEventCrisisTypes: $filterEventCrisisTypes,
            filterEventCrises: $filterEventCrises,
            filterFigureTags: $filterFigureTags,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ) {
           errors
            ok
        }
    }
`;

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [selectedTab, setSelectedTab] = useState('Entries');

    const [entriesPage, setEntriesPage] = useState(1);
    const [entriesPageSize, setEntriesPageSize] = useState(10);

    const [figuresPage, setFiguresPage] = useState(1);
    const [figuresPageSize, setFiguresPageSize] = useState(10);

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

    // NOTE: reset current page when filter is changed
    useLayoutEffect(
        () => {
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [filters],
    );

    const entriesVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: entriesOrdering,
            page: entriesPage,
            pageSize: entriesPageSize,
            ...filters,
        }),
        [
            entriesOrdering, entriesPage, entriesPageSize,
            filters,
        ],
    );

    const figuresVariables = useMemo(
        (): ExtractionEntryListFiltersQueryVariables => ({
            ordering: figuresOrdering,
            page: figuresPage,
            pageSize: figuresPageSize,
            ...filters,
        }),
        [
            figuresOrdering, figuresPage, figuresPageSize,
            filters,
        ],
    );

    const [
        exportEntries,
        { loading: exportingEntries },
    ] = useMutation<ExportEntriesMutation, ExportEntriesMutationVariables>(
        ENTRIES_DOWNLOAD,
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
        exportFigures,
        { loading: exportingFigures },
    ] = useMutation<ExportFiguresMutation, ExportFiguresMutationVariables>(
        FIGURES_DOWNLOAD,
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

    const handleExportEntriesData = useCallback(
        () => {
            exportEntries({
                variables: filters,
            });
        },
        [exportEntries, filters],
    );

    const handleExportFiguresData = useCallback(
        () => {
            exportFigures({
                variables: filters,
            });
        },
        [exportFigures, filters],
    );

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
                            Entries
                        </Tab>
                        <Tab
                            name="Figures"
                            className={styles.tab}
                        >
                            Figures
                        </Tab>
                    </TabList>
                )}
                className={_cs(className, styles.entriesTable)}
                contentClassName={styles.content}
                headerActions={(
                    <>
                        {selectedTab === 'Entries' && (
                            <ConfirmButton
                                confirmationHeader="Export"
                                confirmationMessage="Are you sure you want to export entries?"
                                name={undefined}
                                onConfirm={handleExportEntriesData}
                                disabled={exportingEntries}
                                variant="default"
                            >
                                Export
                            </ConfirmButton>
                        )}
                        {selectedTab === 'Figures' && (
                            <ConfirmButton
                                confirmationHeader="Export"
                                confirmationMessage="Are you sure you want to export figures?"
                                name={undefined}
                                onConfirm={handleExportFiguresData}
                                disabled={exportingFigures}
                                variant="default"
                            >
                                Export
                            </ConfirmButton>
                        )}
                        {headingActions}
                    </>
                )}
                footerContent={(
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
                            filters={entriesVariables}
                            onTotalEntriesChange={setTotalEntriesCount}
                        />
                    </SortContext.Provider>
                </TabPanel>
                <TabPanel name="Figures">
                    <SortContext.Provider value={figuresSortState}>
                        <NudeFigureTable
                            filters={figuresVariables}
                            onTotalFiguresChange={setTotalFiguresCount}
                        />
                    </SortContext.Provider>
                </TabPanel>
            </Container>
        </Tabs>
    );
}
export default ExtractionEntriesTable;
