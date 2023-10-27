import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    isDefined,
} from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    ConfirmButton,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Message from '#components/Message';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import SymbolCell, { SymbolCellProps } from '#components/tableHelpers/SymbolCell';
import {
    ExtractionFigureListQuery,
    ExtractionFigureListQueryVariables,
    DeleteFigureMutation,
    DeleteFigureMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExportFiguresMutation,
    ExportFiguresMutationVariables,
} from '#generated/types';
import route from '#config/routes';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

export const FIGURE_LIST = gql`
    query ExtractionFigureList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,

        $filterCreatedBy: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterFigureCategories: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureCrises: [ID!],
        $filterFigureCrisisTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureEvents: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureHasDisaggregatedData: Boolean,
        $filterFigureRegions: [ID!],
        $filterFigureReviewStatus: [String!],
        $filterFigureRoles: [String!],
        $filterFigureSources: [ID!],
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
    ) {
        figureList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,

            filterCreatedBy: $filterCreatedBy,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureCategories: $filterFigureCategories,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureCrises: $filterFigureCrises,
            filterFigureCrisisTypes: $filterFigureCrisisTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureEvents: $filterFigureEvents,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureHasDisaggregatedData: $filterFigureHasDisaggregatedData,
            filterFigureRegions: $filterFigureRegions,
            filterFigureReviewStatus: $filterFigureReviewStatus,
            filterFigureRoles: $filterFigureRoles,
            filterFigureSources: $filterFigureSources,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
        ) {
            page
            pageSize
            totalCount
            results {
                id
                oldId
                createdAt
                createdBy {
                    id
                    fullName
                }
                category
                categoryDisplay
                geolocations
                sourcesReliability
                country {
                    id
                    idmcShortName
                }
                entry {
                    id
                    oldId
                    articleTitle
                }
                event {
                    id
                    oldId
                    name
                    eventType
                    eventTypeDisplay
                    crisis {
                        id
                        name
                    }
                }
                figureTypology
                role
                roleDisplay
                totalFigures
                term
                termDisplay
                flowEndDate
                flowStartDate
                stockDate
                stockReportingDate
                includeIdu
                isHousingDestruction

                reviewStatus
                reviewStatusDisplay
            }
        }
    }
`;

const FIGURES_DOWNLOAD = gql`
    mutation ExportFigures(
        $filterContextOfViolences: [ID!],
        $filterCreatedBy: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers: [ID!],
        $filterFigureCategories: [String!],
        $filterFigureCategoryTypes: [String!],
        $filterFigureCountries: [ID!],
        $filterFigureCrises: [ID!],
        $filterFigureCrisisTypes: [String!],
        $filterFigureEndBefore: Date,
        $filterFigureEvents: [ID!],
        $filterFigureGeographicalGroups: [ID!],
        $filterFigureHasDisaggregatedData: Boolean,
        $filterFigureRegions: [ID!],
        $filterFigureReviewStatus: [String!],
        $filterFigureRoles: [String!],
        $filterFigureSources: [ID!],
        $filterFigureStartAfter: Date,
        $filterFigureTags: [ID!],
        $filterFigureTerms: [ID!],
    ) {
       exportFigures(
            filterContextOfViolences: $filterContextOfViolences,
            filterCreatedBy: $filterCreatedBy,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureCategories: $filterFigureCategories,
            filterFigureCategoryTypes: $filterFigureCategoryTypes,
            filterFigureCountries: $filterFigureCountries,
            filterFigureCrises: $filterFigureCrises,
            filterFigureCrisisTypes: $filterFigureCrisisTypes,
            filterFigureEndBefore: $filterFigureEndBefore,
            filterFigureEvents: $filterFigureEvents,
            filterFigureGeographicalGroups: $filterFigureGeographicalGroups,
            filterFigureHasDisaggregatedData: $filterFigureHasDisaggregatedData,
            filterFigureRegions: $filterFigureRegions,
            filterFigureReviewStatus: $filterFigureReviewStatus,
            filterFigureRoles: $filterFigureRoles,
            filterFigureSources: $filterFigureSources,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterFigureTags: $filterFigureTags,
            filterFigureTerms: $filterFigureTerms,
        ) {
           errors
            ok
        }
    }
`;

const FIGURE_DELETE = gql`
    mutation DeleteFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<ExtractionFigureListQuery['figureList']>['results']>[number];

const keySelector = (item: FigureFields) => item.id;

interface NudeFigureTableProps {
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;
    entryColumnHidden?: boolean;
    filters?: ExtractionEntryListFiltersQueryVariables;

    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useFigureTable(props: NudeFigureTableProps) {
    const {
        className,
        eventColumnHidden,
        crisisColumnHidden,
        entryColumnHidden,
        filters,

        page,
        pageSize,
        onPageChange,
        onPageSizeChange,
        pagerPageControlDisabled,
    } = props;

    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<ExtractionFigureListQuery, ExtractionFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        deleteFigure,
        { loading: deletingFigure },
    ] = useMutation<DeleteFigureMutation, DeleteFigureMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigure: deleteFigureRes } = response;
                if (!deleteFigureRes) {
                    return;
                }
                const { errors } = deleteFigureRes;
                if (errors) {
                    notifyGQLError(errors);
                } else {
                    refetchFigures(filters);
                    notify({
                        children: 'Figure deleted successfully!',
                        variant: 'success',
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
        { loading: exportingTableData },
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

    const handleFigureDelete = useCallback(
        (id: string) => {
            deleteFigure({
                variables: { id },
            });
        },
        [deleteFigure],
    );

    const handleExportTableData = useCallback(
        () => {
            exportFigures({
                variables: filters,
            });
        },
        [exportFigures, filters],
    );

    const { user } = useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const symbolColumn: TableColumn<FigureFields, string, SymbolCellProps, TableHeaderCellProps> = {
                id: 'sources_reliability',
                title: 'Sources Reliability',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: SymbolCell,
                cellRendererParams: (_, datum) => ({
                    sourcesData: datum?.sourcesReliability,
                }),
            };

            return [
                createDateColumn<FigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                entryColumnHidden
                    ? undefined
                    : createStatusColumn<FigureFields, string>(
                        'entry__article_title',
                        'Entry',
                        (item) => ({
                            title: item.entry.articleTitle,
                            attrs: { entryId: item.entry.id },
                            ext: item.entry.oldId
                                ? `/documents/${item.entry.oldId}`
                                : undefined,
                            hash: '/figures-and-analysis',
                            search: `id=${item.id}`,
                            status: item.reviewStatus,
                        }),
                        route.entryView,
                        { sortable: true },
                    ),
                createTextColumn<FigureFields, string>(
                    'geolocations',
                    'Location',
                    (item) => item.geolocations,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.event?.eventTypeDisplay,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'figure_typology',
                    'Figure Type',
                    (item) => item.figureTypology,
                ),
                createTextColumn<FigureFields, string>(
                    'country__idmc_short_name',
                    'Country',
                    (item) => item.country?.idmcShortName,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'term',
                    'Term',
                    (item) => item.termDisplay,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'role',
                    'Role',
                    (item) => item.roleDisplay,
                    { sortable: true },
                ),
                createLinkColumn<FigureFields, string>(
                    'category',
                    'Figure Category',
                    (item) => ({
                        title: item.categoryDisplay,
                        attrs: { entryId: item.entry.id },
                        ext: item.oldId
                            ? `/facts/${item.oldId}`
                            : undefined,
                        hash: '/figures-and-analysis',
                        search: `id=${item.id}`,
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                symbolColumn,
                createNumberColumn<FigureFields, string>(
                    'total_figures',
                    'Total Figure',
                    (item) => item.totalFigures,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'flow_start_date',
                    'Start Date',
                    (item) => item.flowStartDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'flow_end_date',
                    'End Date',
                    (item) => item.flowEndDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'stock_date',
                    'Stock Date',
                    (item) => item.stockDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'stock_reporting_date',
                    'Stock Reporting Date',
                    (item) => item.stockReportingDate,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'include_idu',
                    'Excerpt IDU',
                    (item) => (item.includeIdu ? 'Yes' : 'No'),
                ),
                createTextColumn<FigureFields, string>(
                    'is_housing_destruction',
                    'Housing Destruction',
                    (item) => (item.isHousingDestruction ? 'Yes' : 'No'),
                ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.event?.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.event?.id },
                            ext: item.event?.oldId
                                ? `/events/${item.event.oldId}`
                                : undefined,
                        }),
                        route.event,
                        { sortable: true },
                    ),
                crisisColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.event?.crisis?.name,
                            attrs: { crisisId: item.event?.crisis?.id },
                            ext: undefined,
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                createCustomActionColumn<FigureFields, string, ActionProps>(
                    ActionCell,
                    (_, datum) => ({
                        id: datum.id,
                        deleteTitle: 'figure',
                        onDelete: entryPermissions?.delete ? handleFigureDelete : undefined,
                        editLinkRoute: route.entryEdit,
                        editLinkAttrs: { entryId: datum.entry.id },
                        editHash: '/figures-and-analysis',
                        editSearch: `id=${datum.id}`,
                    }),
                    'action',
                    '',
                    undefined,
                    2,
                ),
            ].filter(isDefined);
        },
        [
            handleFigureDelete,
            crisisColumnHidden,
            eventColumnHidden,
            entryColumnHidden,
            entryPermissions?.delete,
        ],
    );

    const queryBasedFigureList = figuresData?.figureList?.results;
    const totalFiguresCount = figuresData?.figureList?.totalCount ?? 0;

    return {
        exportButton: (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData}
            >
                Export
            </ConfirmButton>
        ),
        pager: (
            <Pager
                activePage={page}
                itemsCount={totalFiguresCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={onPageChange}
                onItemsPerPageChange={onPageSizeChange}
                itemsPerPageControlHidden={pagerPageControlDisabled}
            />
        ),
        table: (
            <>
                {totalFiguresCount > 0 && (
                    <Table
                        className={className}
                        data={queryBasedFigureList}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
                {(loadingFigures || deletingFigure) && <Loading absolute />}
                {!loadingFigures && totalFiguresCount <= 0 && (
                    <Message
                        message="No figures found."
                    />
                )}
            </>
        ),
    };
}
export default useFigureTable;
