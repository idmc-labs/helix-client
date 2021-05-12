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
    EntriesQuery,
    EntriesQueryVariables,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';
import EntriesFilter from './EntriesFilter/index';
import route from '#config/routes';
import styles from './styles.css';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

const ENTRY_LIST = gql`
query Entries($ordering: String, $page: Int, $pageSize: Int, $event: ID, $countries: [ID!], $createdBy: [ID!], $articleTitleContains: String, $reviewStatus: [String!]) {
    entryList(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitleContains: $articleTitleContains, event: $event, countries: $countries, createdByIds: $createdBy, reviewStatus: $reviewStatus) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
                isReviewed
                isSignedOff
                isUnderReview
                createdBy {
                    fullName
                }
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
                url
                event {
                    id
                    name
                    eventType
                    crisis {
                        id
                        name
                    }
                }
                totalStockIdpFigures
                totalFlowNdFigures
            }
        }
    }
`;

const ENTRY_DELETE = gql`
    mutation DeleteEntry($id: ID!) {
        deleteEntry(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

type EntryFields = NonNullable<NonNullable<EntriesQuery['entryList']>['results']>[number];

const entriesDefaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: EntryFields) => item.id;

interface EntriesTableProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    heading?: string;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
}

function EntriesTable(props: EntriesTableProps) {
    const {
        sortState: defaultSorting = entriesDefaultSorting,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 10,
        pagerDisabled,
        heading = 'Entries',
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
        entriesQueryFilters,
        setEntriesQueryFilters,
    ] = useState<PurgeNull<EntriesQueryVariables>>();

    const entriesVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering,
            page,
            pageSize,
            event: eventId,
            createdBy: userId ? [userId] : undefined,
            countries: country ? [country] : undefined,
            ...entriesQueryFilters,
        }),
        [ordering, page, pageSize, eventId, userId, country, entriesQueryFilters],
    );

    const {
        previousData,
        data: entriesData = previousData,
        loading: loadingEntries,
        refetch: refetchEntries,
    } = useQuery<EntriesQuery, EntriesQueryVariables>(ENTRY_LIST, {
        variables: entriesVariables,
    });

    const [
        deleteEntry,
        { loading: deletingEntry },
    ] = useMutation<DeleteEntryMutation, DeleteEntryMutationVariables>(
        ENTRY_DELETE,
        {
            onCompleted: (response) => {
                const { deleteEntry: deleteEntryRes } = response;
                if (!deleteEntryRes) {
                    return;
                }
                const { errors } = deleteEntryRes;
                if (!errors) {
                    refetchEntries(entriesVariables);
                }
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleEntryDelete = useCallback(
        (id: string) => {
            deleteEntry({
                variables: { id },
            });
        },
        [deleteEntry],
    );

    const { user } = useContext(DomainContext);

    const entryPermissions = user?.permissions?.entry;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<EntryFields, string, ActionProps, TableHeaderCellProps> = {
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
                createDateColumn<EntryFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                crisisColumnHidden
                    ? undefined
                    : createLinkColumn<EntryFields, string>(
                        'event__crisis__name',
                        'Crisis',
                        (item) => ({
                            title: item.event?.crisis?.name,
                            attrs: { crisisId: item.event?.crisis?.id },
                        }),
                        route.crisis,
                        { sortable: true },
                    ),
                eventColumnHidden
                    ? undefined
                    : createLinkColumn<EntryFields, string>(
                        'event__name',
                        'Event',
                        (item) => ({
                            title: item.event?.name,
                            // FIXME: this may be wrong
                            attrs: { eventId: item.event?.id },
                        }),
                        route.event,
                        { sortable: true },
                    ),
                createLinkColumn<EntryFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { cellAsHeader: true, sortable: true },
                ),
                userId
                    ? undefined
                    : createTextColumn<EntryFields, string>(
                        'created_by__full_name',
                        'Created by',
                        (item) => item.createdBy?.fullName,
                        { sortable: true },
                    ),
                createDateColumn<EntryFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.publishDate,
                    { sortable: true },
                ),
                createTextColumn<EntryFields, string>(
                    'publishers',
                    'Publishers',
                    (item) => item.publishers?.results?.map((p) => p.name).join(', '),
                ),
                createTextColumn<EntryFields, string>(
                    'sources',
                    'Sources',
                    (item) => item.sources?.results?.map((s) => s.name).join(', '),
                ),
                createTextColumn<EntryFields, string>(
                    'event__event_type',
                    'Type',
                    (item) => item.event.eventType,
                ),
                createNumberColumn<EntryFields, string>(
                    'total_stock_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                ),
                createNumberColumn<EntryFields, string>(
                    'total_flow_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                ),
                createStatusColumn<EntryFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isReviewed: item.isReviewed,
                        isSignedOff: item.isSignedOff,
                        isUnderReview: item.isUnderReview,
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

    const totalEntriesCount = entriesData?.entryList?.totalCount ?? 0;

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            contentClassName={styles.content}
            description={(
                <EntriesFilter
                    setEntriesQueryFilters={setEntriesQueryFilters}
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
                        data={entriesData?.entryList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {(loadingEntries || deletingEntry) && <Loading absolute />}
            {!loadingEntries && totalEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}
export default EntriesTable;
