import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    isDefined,
    _cs,
} from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    SortContext,
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createStatusColumn,
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import { PurgeNull } from '#types';

import {
    LatestFigureListQuery,
    LatestFigureListQueryVariables,
    DeleteLatestFigureMutation,
    DeleteLatestFigureMutationVariables,
} from '#generated/types';
import EntriesFilter from '../EntriesFilter/index';
import route from '#config/routes';
import styles from './styles.css';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

const FIGURE_LIST = gql`
query LatestFigureList(
    $ordering: String,
    $page: Int,
    $pageSize: Int,
    $event: String,
    $filterEntryArticleTitle: String,
    $filterEntryPublishers:[ID!],
    $filterEntrySources: [ID!],
    $filterEntryReviewStatus: [String!],
    $filterEntryCreatedBy: [ID!],
    $filterFigureCountries: [ID!],
    $filterFigureStartAfter: Date
    ) {
    figureList(
        ordering: $ordering,
        page: $page,
        pageSize: $pageSize,
        event: $event,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntrySources: $filterEntrySources,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        filterFigureCountries: $filterFigureCountries,
        filterFigureStartAfter: $filterFigureStartAfter
        ) {
            page
            pageSize
            totalCount
            results {
                id
                createdAt
                createdBy {
                    id
                    fullName
                }
                category {
                    id
                    name
                }
                country {
                    id
                    name
                }
                entry {
                    id
                    articleTitle
                    publishDate
                    publishers {
                        results {
                            id
                            name
                        }
                    }
                    sources {
                        results {
                            id
                            name
                        }
                    }
                    event {
                        id
                        name
                        eventType
                        crisis {
                            id
                            name
                        }
                    }
                    isReviewed
                    isSignedOff
                    isUnderReview
                    totalStockIdpFigures(data: {categories: $filterFigureCountries, roles: $filterEntryReviewStatus, startDate: $filterFigureStartAfter, endDate: $filterFigureStartAfter})
                    totalFlowNdFigures(data: {categories: $filterFigureCountries, roles: $filterEntryReviewStatus, startDate: $filterFigureStartAfter, endDate: $filterFigureStartAfter})
                }
                role
                totalFigures
                term {
                    id
                    name
                }
                endDate
                startDate
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

const figuresDefaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: FigureFields) => item.id;

interface FigurePanelProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    heading?: React.ReactNode;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
}

function FigurePanel(props: FigurePanelProps) {
    const {
        sortState: defaultSorting = figuresDefaultSorting,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 10,
        pagerDisabled,
        heading = 'Figures',
        className,
        eventColumnHidden,
        crisisColumnHidden,
        eventId,
        userId,
        country,
    } = props;
    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting ?? defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const [
        figuresQueryFilters,
        setFiguresQueryFilters,
    ] = useState<PurgeNull<LatestFigureListQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<LatestFigureListQueryVariables>) => {
            setFiguresQueryFilters(value);
            setPage(1);
        },
        [setPage],
    );

    const figureVariables = useMemo(
        (): LatestFigureListQueryVariables => ({
            ordering,
            page,
            pageSize,
            event: eventId,
            filterEntryCreatedBy: userId ? [userId] : undefined,
            filterFigureCountries: country ? [country] : undefined,
            ...figuresQueryFilters,
        }),
        [ordering, page, pageSize, eventId, userId, country, figuresQueryFilters],
    );

    const {
        previousData,
        data: figuresData = previousData,
        loading: loadingFigures,
        refetch: refetchFigures,
    } = useQuery<LatestFigureListQuery, LatestFigureListQueryVariables>(FIGURE_LIST, {
        variables: figureVariables,
    });

    const [
        deleteFigure,
        { loading: deletingEntry },
    ] = useMutation<DeleteLatestFigureMutation, DeleteLatestFigureMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteFigure: deleteEntryRes } = response;
                if (!deleteEntryRes) {
                    return;
                }
                const { errors } = deleteEntryRes;
                if (!errors) {
                    refetchFigures(figureVariables);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleEntryDelete = useCallback(
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
                    onDelete: entryPermissions?.delete ? handleEntryDelete : undefined,
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.id },
                }),
            };

            return [
                createDateColumn<FigureFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                crisisColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.entry.event?.crisis?.name,
                            attrs: { crisisId: item.entry.event?.crisis?.id },
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.entry.event?.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.entry.event?.id },
                        }),
                        route.event,
                        { sortable: true },
                    ),
                createLinkColumn<FigureFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                userId
                    ? undefined
                    : createTextColumn<FigureFields, string>(
                        'created_by__full_name',
                        'Created by',
                        (item) => item.createdBy?.fullName,
                        { sortable: true },
                    ),
                createDateColumn<FigureFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.entry.publishDate,
                    { sortable: true },
                ),
                userId
                    ? undefined
                    : createTextColumn<FigureFields, string>(
                        'publishers',
                        'Publishers',
                        (item) => item.entry.publishers?.results?.map((p) => p.name).join(', '),
                    ),
                userId
                    ? undefined
                    : createTextColumn<FigureFields, string>(
                        'sources',
                        'Sources',
                        (item) => item.entry.sources?.results?.map((s) => s.name).join(', '),
                    ),
                createTextColumn<FigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.entry.event.eventType,
                    { sortable: true },
                ),
                createNumberColumn<FigureFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.entry.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<FigureFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.entry.totalStockIdpFigures,
                    { sortable: true },
                ),
                createStatusColumn<FigureFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isReviewed: item.entry.isReviewed,
                        isSignedOff: item.entry.isSignedOff,
                        isUnderReview: item.entry.isUnderReview,
                    }),
                ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleEntryDelete,
            crisisColumnHidden, eventColumnHidden, userId,
            entryPermissions?.delete,
        ],
    );

    const totalEntriesCount = figuresData?.figureList?.totalCount ?? 0;

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.figuresTable)}
            contentClassName={styles.content}
            description={(
                <EntriesFilter
                    onFilterChange={onFilterChange}
                />
            )}
            footerContent={!pagerDisabled && (
                <Pager
                    activePage={page}
                    itemsCount={totalEntriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalEntriesCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={figuresData?.figureList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {(loadingFigures || deletingEntry) && <Loading absolute />}
            {!loadingFigures && totalEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}
export default FigurePanel;
