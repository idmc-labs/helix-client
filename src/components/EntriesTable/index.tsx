import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { IoIosSearch } from 'react-icons/io';
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
    TextInput,
    SortContext,
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

import {
    EntriesQuery,
    EntriesQueryVariables,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}

// TODO: Fix in Backend. countries is [String] but only takes a single string
const ENTRY_LIST = gql`
query Entries($ordering: String, $page: Int, $pageSize: Int, $text: String, $event: ID, $countries: [String], $createdBy: ID) {
    entryList(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitleContains: $text, event: $event, countries: $countries, createdBy: $createdBy) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
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
                    crisis {
                        id
                        name
                    }
                }
                totalStockFigures
                totalFlowFigures
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
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: EntryFields) => item.id;

interface EntriesTableProps {
    sortState?: TableSortParameter;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    searchDisabled?: boolean;
    heading?: string;
    className?: string;
    eventColumnHidden?: boolean;
    crisisColumnHidden?: boolean;

    eventId?: string;
    userId?: string;
    country?: string;
}

function EntriesTable(props: EntriesTableProps) {
    const [search, setSearch] = useState<string | undefined>();

    const {
        sortState: defaultSorting = entriesDefaultSorting,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 10,
        pagerDisabled,
        searchDisabled,
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

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(defaultPage);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const entriesVariables = useMemo(
        (): EntriesQueryVariables => ({
            ordering,
            page,
            pageSize,
            text: search,
            event: eventId,
            createdBy: userId,
            countries: country ? [country] : undefined,
        }),
        [ordering, page, pageSize, search, eventId, userId, country],
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
                createTextColumn<EntryFields, string>(
                    'article_title',
                    'Entry',
                    (item) => item.articleTitle,
                    { cellAsHeader: true, sortable: true },
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
                createNumberColumn<EntryFields, string>(
                    'total_stock_figures',
                    'Stock',
                    (item) => item.totalStockFigures,
                ),
                createNumberColumn<EntryFields, string>(
                    'total_flow_figures',
                    'Flow',
                    (item) => item.totalFlowFigures,
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
            headerActions={!searchDisabled && (
                <TextInput
                    icons={<IoIosSearch />}
                    name="search"
                    value={search}
                    placeholder="Search"
                    onChange={setSearch}
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
