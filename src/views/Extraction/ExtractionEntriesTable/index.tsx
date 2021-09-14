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
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureCountries: [ID!],
        $filterFigureCategories: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterFigureTags: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventGlideNumber: String,
        $filterFigureCategoryTypes: [String!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureSexTypes: [String!],
        $filterFigureTerms: [ID!],
        $filterEvents: [ID!],
        $report: String,
        $filterEntryHasReviewComments: Boolean,
    ) {
       exportEntries(
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureCountries: $filterFigureCountries,
        filterFigureCategories: $filterFigureCategories,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterFigureTags: $filterFigureTags,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntrySources: $filterEntrySources,
        filterEventGlideNumber: $filterEventGlideNumber,
        filterFigureCategoryTypes: $filterFigureCategoryTypes,
        filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
        filterFigureSexTypes: $filterFigureSexTypes,
        filterFigureTerms: $filterFigureTerms,
        filterEvents: $filterEvents,
        report: $report,
        filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ){
           errors
            ok
        }
    }
`;

const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $filterFigureStartAfter: Date,
        $filterFigureRoles: [String!],
        $filterFigureRegions: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureCountries: [ID!],
        $filterFigureCategories: [ID!],
        $filterEventCrisisTypes: [String!],
        $filterEventCrises: [ID!],
        $filterFigureTags: [ID!],
        $filterEntryArticleTitle: String,
        $report: String,
        $filterEvents: [ID!],
        $filterEntryCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntrySources: [ID!],
        $filterEventGlideNumber: String,
        $filterFigureCategoryTypes: [String!],
        $filterFigureDisplacementTypes: [String!],
        $filterFigureSexTypes: [String!],
        $filterFigureTerms: [ID!],
        $entry: ID,
        $filterEntryHasReviewComments: Boolean,
    ) {
       exportFigures(
        filterFigureStartAfter: $filterFigureStartAfter,
        filterFigureRoles: $filterFigureRoles,
        filterFigureRegions: $filterFigureRegions,
        filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
        filterFigureEndBefore: $filterFigureEndBefore,
        filterFigureCountries: $filterFigureCountries,
        filterFigureCategories: $filterFigureCategories,
        filterEventCrisisTypes: $filterEventCrisisTypes,
        filterEventCrises: $filterEventCrises,
        filterFigureTags: $filterFigureTags,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        report: $report,
        filterEvents: $filterEvents,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntrySources: $filterEntrySources,
        filterEventGlideNumber: $filterEventGlideNumber,
        filterFigureCategoryTypes: $filterFigureCategoryTypes,
        filterFigureDisplacementTypes: $filterFigureDisplacementTypes,
        filterFigureSexTypes: $filterFigureSexTypes,
        filterFigureTerms: $filterFigureTerms,
        entry: $entry,
        filterEntryHasReviewComments: $filterEntryHasReviewComments,
        ){
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
