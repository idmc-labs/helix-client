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
import { EVENT_EXPORT } from '#components/tables/EventsTable';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import {
    EntriesQueryVariables,
    LatestFigureListQueryVariables,
    EventListQueryVariables,
    ExportEventEntriesMutation,
    ExportEventEntriesMutationVariables,
    ExportEventFiguresMutation,
    ExportEventFiguresMutationVariables,
    ExportEventsMutation,
    ExportEventsMutationVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import { PurgeNull } from '#types';

import NudeEntryTable from '#components/tables/EntriesFiguresTable/NudeEntryTable';
import NudeFigureTable from '#components/tables/EntriesFiguresTable/NudeFigureTable';
import EntriesFilter from '#components/tables/EntriesFiguresTable/EntriesFilter';
import FiguresFilter from '#components/tables/EntriesFiguresTable/FiguresFilter';
import NudeEventTable from './NudeEventsTable';
import EventsFilter from './EventsFilter';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);
type Tabs = 'Entries' | 'Figures';

const ENTRIES_EXPORT = gql`
    mutation ExportEventEntries(
        $filterFigureEvents: [ID!],
        $filterEntryArticleTitle: String,
        $filterContextOfViolences: [ID!],
        $filterCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterFigureSources: [ID!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureRoles: [String!],
        $filterFigureStartAfter: Date,
        $filterFigureReviewStatus: [String!],
    ) {
       exportEntries(
            filterFigureEvents: $filterFigureEvents,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterContextOfViolences: $filterContextOfViolences,
            filterCreatedBy: $filterCreatedBy,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureRoles: $filterFigureRoles,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureReviewStatus: $filterFigureReviewStatus,
        ) {
           errors
            ok
        }
    }
`;

const FIGURES_EXPORT = gql`
    mutation ExportEventFigures(
        $filterFigureEvents: [ID!],
        $filterEntryArticleTitle: String,
        $filterContextOfViolences: [ID!],
        $filterCreatedBy: [ID!],
        $filterEntryPublishers: [ID!],
        $filterFigureSources: [ID!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureEndBefore: Date,
        $filterFigureRoles: [String!],
        $filterFigureStartAfter: Date,
        $filterFigureReviewStatus: [String!],
    ) {
       exportFigures(
            filterFigureEvents: $filterFigureEvents,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterContextOfViolences: $filterContextOfViolences,
            filterCreatedBy: $filterCreatedBy,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureRoles: $filterFigureRoles,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureReviewStatus: $filterFigureReviewStatus,
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

interface EventsEntriesFiguresTableProps {
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
}

function EventsEntriesFiguresTable(props: EventsEntriesFiguresTableProps) {
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
    } = props;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const [selectedTab, setSelectedTab] = useState<'Entries' | 'Figures' | 'Events' | undefined>('Figures');

    const [entriesPage, setEntriesPage] = useState(pageFromProps ?? 1);
    const [entriesPageSize, setEntriesPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedEntriesPage = useDebouncedValue(entriesPage);

    const [figuresPage, setFiguresPage] = useState(pageFromProps ?? 1);
    const [figuresPageSize, setFiguresPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedFiguresPage = useDebouncedValue(figuresPage);

    const [eventsPage, setEventsPage] = useState(pageFromProps ?? 1);
    const [eventsPageSize, setEventsPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedEventsPage = useDebouncedValue(eventsPage);

    const [totalEntriesCount, setTotalEntriesCount] = useState(0);
    const [totalFiguresCount, setTotalFiguresCount] = useState(0);
    const [totalEventsCount, setTotalEventsCount] = useState(0);

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

    const eventsSortState = useSortState();
    const { sorting: eventsSorting } = figuresSortState;
    const validEventsSorting = eventsSorting ?? defaultSorting;
    const eventsOrdering = validEventsSorting.direction === 'asc'
        ? validEventsSorting.name
        : `-${validEventsSorting.name}`;

    const [
        entriesQueryFilters,
        setEntriesQueryFilters,
    ] = useState<PurgeNull<EntriesQueryVariables>>();

    const [
        figuresQueryFilters,
        setFiguresQueryFilters,
    ] = useState<PurgeNull<LatestFigureListQueryVariables>>();

    const [
        eventsQueryFilters,
        setEventsQueryFilters,
    ] = useState<PurgeNull<EventListQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<EntriesQueryVariables>) => {
            if (selectedTab === 'Entries') {
                setEntriesQueryFilters(value);
            } else if (selectedTab === 'Figures') {
                setFiguresQueryFilters(value);
            } else {
                setEventsQueryFilters(value);
            }
            setEntriesPage(1);
            setFiguresPage(1);
        },
        [selectedTab],
    );

    const entriesVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering: entriesOrdering,
            page: debouncedEntriesPage,
            pageSize: entriesPageSize,
            ...entriesQueryFilters,
            filterFigureEvents: eventId
                ? [eventId]
                : entriesQueryFilters?.filterFigureEvents,
            filterCreatedBy: userId
                ? [userId]
                : entriesQueryFilters?.filterCreatedBy,
            filterFigureCountries: countryId
                ? [countryId]
                : entriesQueryFilters?.filterFigureCountries,
        }),
        [
            entriesOrdering,
            debouncedEntriesPage,
            entriesPageSize,
            eventId,
            userId,
            countryId,
            entriesQueryFilters,
        ],
    );

    const figuresVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering: figuresOrdering,
            page: debouncedFiguresPage,
            pageSize: figuresPageSize,
            ...figuresQueryFilters,
            filterFigureEvents: eventId
                ? [eventId]
                : figuresQueryFilters?.filterFigureEvents,
            filterCreatedBy: userId
                ? [userId]
                : figuresQueryFilters?.filterCreatedBy,
            filterFigureCountries: countryId
                ? [countryId]
                : figuresQueryFilters?.filterFigureCountries,
        }),
        [
            figuresOrdering,
            debouncedFiguresPage,
            figuresPageSize,
            eventId,
            userId,
            countryId,
            figuresQueryFilters,
        ],
    );

    const eventsVariables = useMemo(
        (): EventListQueryVariables => ({
            ordering: eventsOrdering,
            page: debouncedEventsPage,
            pageSize: eventsPageSize,
            ...eventsQueryFilters,
            countries: countryId
                ? [countryId]
                : eventsQueryFilters?.countries,
            createdByIds: userId
                ? [userId]
                : eventsQueryFilters?.createdByIds,
        }),
        [
            eventsOrdering,
            debouncedEventsPage,
            eventsPageSize,
            eventsQueryFilters,
            userId,
            countryId,
        ],
    );

    const handleEventsPageSizeChange = useCallback(
        (value: number) => {
            setEventsPageSize(value);
            setEventsPage(1);
        },
        [],
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

    const [
        exportEvents,
        { loading: exportingEvents },
    ] = useMutation<ExportEventsMutation, ExportEventsMutationVariables>(
        EVENT_EXPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEvents: exportEventResponse } = response;
                if (!exportEventResponse) {
                    return;
                }
                const { errors, ok } = exportEventResponse;
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
            } else if (selectedTab === 'Figures') {
                exportFigureEntries({
                    variables: figuresVariables,
                });
            } else {
                exportEvents({
                    variables: eventsVariables,
                });
            }
        },
        [
            selectedTab,
            entriesVariables,
            figuresVariables,
            eventsVariables,
            exportEventEntries,
            exportFigureEntries,
            exportEvents,
        ],
    );

    // TODO: handle export of figure and entry
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
                            name="Events"
                        >
                            Events
                        </Tab>
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
                className={_cs(className, styles.eventsEntriesFiguresTable)}
                headerActions={(
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={
                            exportingEventEntries || exportingFigureEntries || exportingEvents
                        }
                    >
                        Export
                    </ConfirmButton>
                )}
                contentClassName={styles.content}
                description={(
                    <>
                        {selectedTab === 'Events' && (
                            <EventsFilter
                                onFilterChange={onFilterChange}
                                createdBySelectionDisabled={!!userId}
                                countriesSelectionDisabled={!!countryId}
                                crisisSelectionDisabled
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <EntriesFilter
                                onFilterChange={onFilterChange}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <FiguresFilter
                                onFilterChange={onFilterChange}
                            />
                        )}
                    </>

                )}
                footerContent={!pagerDisabled && (
                    <>
                        {selectedTab === 'Events' && (
                            <Pager
                                activePage={eventsPage}
                                itemsCount={totalEventsCount}
                                maxItemsPerPage={eventsPageSize}
                                onActivePageChange={setEventsPage}
                                onItemsPerPageChange={handleEventsPageSizeChange}
                                itemsPerPageControlHidden={pagerPageControlDisabled}
                            />
                        )}
                        {selectedTab === 'Entries' && (
                            <Pager
                                activePage={entriesPage}
                                itemsCount={totalEntriesCount}
                                maxItemsPerPage={entriesPageSize}
                                onActivePageChange={setEntriesPage}
                                onItemsPerPageChange={handleEntriesPageSizeChange}
                                itemsPerPageControlHidden={pagerPageControlDisabled}
                            />
                        )}
                        {selectedTab === 'Figures' && (
                            <Pager
                                activePage={figuresPage}
                                itemsCount={totalFiguresCount}
                                maxItemsPerPage={figuresPageSize}
                                onActivePageChange={setFiguresPage}
                                onItemsPerPageChange={handleFiguresPageSizeChange}
                                itemsPerPageControlHidden={pagerPageControlDisabled}
                            />
                        )}
                    </>
                )}
            >
                <TabPanel name="Events">
                    <SortContext.Provider value={eventsSortState}>
                        <NudeEventTable
                            className={styles.table}
                            filters={eventsVariables}
                            onTotalFiguresChange={setTotalEventsCount}
                        />
                    </SortContext.Provider>
                </TabPanel>
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
export default EventsEntriesFiguresTable;
