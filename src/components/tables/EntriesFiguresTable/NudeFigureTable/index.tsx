import React, { useMemo, useCallback, useContext, useEffect } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    isDefined,
} from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createStatusColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import SymbolCell, { SymbolCellProps } from '#components/tableHelpers/SymbolCell';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import {
    LatestFigureListQuery,
    LatestFigureListQueryVariables,
    DeleteLatestFigureMutation,
    DeleteLatestFigureMutationVariables,
    EntriesQueryVariables,
} from '#generated/types';
import route from '#config/routes';

const FIGURE_LIST = gql`
    query LatestFigureList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $event: String,
        $filterEvents: [ID!],
        $filterEntryArticleTitle: String,
        $filterEntryPublishers:[ID!],
        $filterFigureSources: [ID!],
        $filterEntryReviewStatus: [String!],
        $filterEntryCreatedBy: [ID!],
        $filterFigureCountries: [ID!],
        $filterFigureStartAfter: Date,
        $filterEntryHasReviewComments: Boolean,
    ) {
        figureList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            event: $event,
            filterEvents: $filterEvents,
            filterEntryArticleTitle: $filterEntryArticleTitle,
            filterEntryPublishers: $filterEntryPublishers,
            filterFigureSources: $filterFigureSources,
            filterEntryReviewStatus: $filterEntryReviewStatus,
            filterEntryCreatedBy: $filterEntryCreatedBy,
            filterFigureCountries: $filterFigureCountries,
            filterFigureStartAfter: $filterFigureStartAfter,
            filterEntryHasReviewComments: $filterEntryHasReviewComments,
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
                geolocations
                sourcesReliability
                category
                categoryDisplay
                country {
                    id
                    idmcShortName
                }
                entry {
                    id
                    oldId
                    articleTitle
                    isReviewed
                    isSignedOff
                    isUnderReview
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
            }
        }
    }
`;

const FIGURE_DELETE = gql`
    mutation DeleteLatestFigure($id: ID!) {
        deleteFigure(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<LatestFigureListQuery['figureList']>['results']>[number];

const keySelector = (item: FigureFields) => item.id;

interface NudeFigureTableProps {
    className?: string;
    filters: EntriesQueryVariables;
    onTotalFiguresChange?: (value: number) => void;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;
    entryColumnHidden?: boolean;
}

function NudeFigureTable(props: NudeFigureTableProps) {
    const {
        className,
        eventColumnHidden,
        crisisColumnHidden,
        entryColumnHidden,
        filters,
        onTotalFiguresChange,
    } = props;

    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<LatestFigureListQuery, LatestFigureListQueryVariables>(FIGURE_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        deleteFigure,
        { loading: deletingFigure },
    ] = useMutation<DeleteLatestFigureMutation, DeleteLatestFigureMutationVariables>(
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

    const handleFigureDelete = useCallback(
        (id: string) => {
            deleteFigure({
                variables: { id },
            });
        },
        [deleteFigure],
    );

    const { user } = useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<FigureFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    deleteTitle: 'figure',
                    onDelete: entryPermissions?.delete ? handleFigureDelete : undefined,
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.entry.id },
                    editHash: '/figures-and-analysis',
                    editSearch: `id=${datum.id}`,
                }),
            };

            // eslint-disable-next-line max-len
            const symbolColumn: TableColumn<FigureFields, string, SymbolCellProps, TableHeaderCellProps> = {
                id: 'sourceReliability',
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
                            isReviewed: item.entry.isReviewed,
                            isSignedOff: item.entry.isSignedOff,
                            isUnderReview: item.entry.isUnderReview,
                            ext: item.entry.oldId
                                ? `/documents/${item.entry.oldId}`
                                : undefined,
                            hash: '/figures-and-analysis',
                            search: `id=${item.id}`,
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
                    'sources_reliability',
                    'Sources Reliability',
                    (item) => item.sourcesReliability,
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
                    (item) => (item.includeIdu ? 'yes' : 'no'),
                ),
                createTextColumn<FigureFields, string>(
                    'is_housing_destruction',
                    'Housing Destruction',
                    (item) => (item.isHousingDestruction ? 'yes' : 'no'),
                ),
                createTextColumn<FigureFields, string>(
                    'figure_typology',
                    'Figure Type',
                    (item) => item.figureTypology,
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
                actionColumn,
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

    // NOTE: if we don't pass total figures count this way,
    // we will have to use Portal to move the Pager component
    useEffect(
        () => {
            if (onTotalFiguresChange) {
                onTotalFiguresChange(totalFiguresCount);
            }
        },
        [onTotalFiguresChange, totalFiguresCount],
    );

    return (
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
    );
}
export default NudeFigureTable;
