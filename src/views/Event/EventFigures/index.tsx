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
import EntriesFilter from '#components/tables/EntriesTable/EntriesFilter';
import {
    FiguresListQuery,
    FiguresListQueryVariables,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';
import route from '#config/routes';
import styles from './styles.css';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

const FIGURE_LIST = gql`
query FiguresList(
    $ordering: String,
    $page: Int,
    $pageSize: Int,
    $filterEntryArticleTitle: String,
    $filterEntryPublishers:[ID!],
    $filterEntrySources: [ID!],
    $filterEntryReviewStatus: [String!],
    $filterEntryCreatedBy: [ID!],
    $event: String,
    $filterFigureCountries: [ID!],
    ) {
    figureList(
        ordering: $ordering,
        page: $page,
        pageSize: $pageSize,
        filterEntryArticleTitle: $filterEntryArticleTitle,
        filterEntryPublishers: $filterEntryPublishers,
        filterEntrySources: $filterEntrySources,
        filterEntryReviewStatus: $filterEntryReviewStatus,
        filterEntryCreatedBy: $filterEntryCreatedBy,
        event: $event,
        filterFigureCountries: $filterFigureCountries,
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
    mutation DeleteEntry($id: ID!) {
        deleteEntry(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type FigureFields = NonNullable<NonNullable<FiguresListQuery['figureList']>['results']>[number];

const figuresDefaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: FigureFields) => item.id;

interface EventFiguresProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
    heading?: React.ReactNode;
}

function EventFigures(props: EventFiguresProps) {
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
    ] = useState<PurgeNull<FiguresListQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<FiguresListQueryVariables>) => {
            setFiguresQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const figuresVariables = useMemo(
        (): FiguresListQueryVariables => ({
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
        data: entriesData = previousData,
        loading: loadingEntries,
        refetch: refetchEntries,
    } = useQuery<FiguresListQuery, FiguresListQueryVariables>(FIGURE_LIST, {
        variables: figuresVariables,
    });

    const [
        deleteEntry,
        { loading: deletingFigure },
    ] = useMutation<DeleteEntryMutation, DeleteEntryMutationVariables>(
        FIGURE_DELETE,
        {
            onCompleted: (response) => {
                const { deleteEntry: deleteEntryRes } = response;
                if (!deleteEntryRes) {
                    return;
                }
                const { errors } = deleteEntryRes;
                if (!errors) {
                    refetchEntries(figuresVariables);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleFigureDelete = useCallback(
        (id: string) => {
            deleteEntry({
                variables: { id },
            });
        },
        [deleteEntry],
    );

    const { user } = useContext(DomainContext);

    const figurePermissions = user?.permissions?.entry;

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
                    onDelete: figurePermissions?.delete ? handleFigureDelete : undefined,
                    // editLinkRoute: route.entryEdit,
                    // editLinkAttrs: { entryId: datum.id },
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
                createTextColumn<FigureFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<FigureFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.entry?.event.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.entry?.event.id },
                        }),
                        route.event,
                        { sortable: true },
                    ),
                createLinkColumn<FigureFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.entry?.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'country_name',
                    'Country',
                    (item) => item.country?.name,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'term__name',
                    'Term',
                    (item) => item.term?.name,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'role',
                    'Role',
                    (item) => item.role,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'category__name',
                    'Figure Type',
                    (item) => item.category?.name,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.entry?.event.eventType,
                    { sortable: true },
                ),
                createTextColumn<FigureFields, string>(
                    'category__name',
                    'Figure Type',
                    (item) => item.category?.name,
                    { sortable: true },
                ),
                createNumberColumn<FigureFields, string>(
                    'total_figures',
                    'Total Figure',
                    (item) => item.totalFigures,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<FigureFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createStatusColumn<FigureFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isReviewed: item.entry?.isReviewed,
                        isSignedOff: item.entry?.isSignedOff,
                        isUnderReview: item.entry?.isUnderReview,
                    }),
                ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleFigureDelete,
            figurePermissions?.delete,
            crisisColumnHidden,
            eventColumnHidden,
        ],
    );

    const totalEntriesCount = entriesData?.figureList?.totalCount ?? 0;

    return (
        <Container
            heading={heading}
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
                        data={entriesData?.figureList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {(loadingEntries || deletingFigure) && <Loading absolute />}
            {!loadingEntries && totalEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}
export default EventFigures;
