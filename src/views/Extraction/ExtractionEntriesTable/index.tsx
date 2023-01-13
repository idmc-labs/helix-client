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
import useDebouncedValue from '#hooks/useDebouncedValue';

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
        $filterContextOfViolences: [ID!],
        $filterCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterFigureSources: [ID!],
        $filterFigureCrises: [ID!],
        $filterFigureCrisisTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureRegions: [ID!],
        $filterFigureRoles: [String!],
        $filterFigureHasDisaggregatedData: Boolean,
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
        $filterFigureEvents: [ID!],
        $filterFigureReviewStatus: [String!],
    ) {
       exportEntries(
            filterFigureCategories: $filterFigureCategories,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterCreatedBy: $filterCreatedBy,
            filterContextOfViolences: $filterContextOfViolences,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterFigureCrises: $filterFigureCrises,
            filterFigureCrisisTypes: $filterFigureCrisisTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureRegions: $filterFigureRegions,
            filterFigureRoles: $filterFigureRoles,
            filterFigureHasDisaggregatedData: $filterFigureHasDisaggregatedData,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
            filterFigureEvents: $filterFigureEvents,
            filterFigureReviewStatus: $filterFigureReviewStatus,
        ) {
           errors
            ok
        }
    }
`;

const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $filterFigureCategories: [String!],
        $filterEntryArticleTitle: String,
        $filterContextOfViolences: [ID!],
        $filterCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterFigureSources: [ID!],
        $filterFigureCrises: [ID!],
        $filterFigureCrisisTypes: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureRegions: [ID!],
        $filterFigureRoles: [String!],
        $filterFigureHasDisaggregatedData: Boolean,
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
        $filterFigureEvents: [ID!],
        $filterFigureReviewStatus: [String!],
    ) {
       exportFigures(
            filterFigureCategories: $filterFigureCategories,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterCreatedBy: $filterCreatedBy,
            filterContextOfViolences: $filterContextOfViolences,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterFigureCrises: $filterFigureCrises,
            filterFigureCrisisTypes: $filterFigureCrisisTypes,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureRegions: $filterFigureRegions,
            filterFigureRoles: $filterFigureRoles,
            filterFigureHasDisaggregatedData: $filterFigureHasDisaggregatedData,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
            filterFigureEvents: $filterFigureEvents,
            filterFigureReviewStatus: $filterFigureReviewStatus,
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

    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | undefined>('Figures');

    const [entriesPage, setEntriesPage] = useState(1);
    const [entriesPageSize, setEntriesPageSize] = useState(10);
    const debouncedEntriesPage = useDebouncedValue(entriesPage);

    const [figuresPage, setFiguresPage] = useState(1);
    const [figuresPageSize, setFiguresPageSize] = useState(10);
    const debouncedFiguresPage = useDebouncedValue(figuresPage);

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
                                onItemsPerPageChange={handleEntriesPageSizeChange}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <Pager
                                activePage={figuresPage}
                                itemsCount={totalFiguresCount}
                                maxItemsPerPage={figuresPageSize}
                                onActivePageChange={setFiguresPage}
                                onItemsPerPageChange={handleFiguresPageSizeChange}
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
