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
    TableCellProps,
    TableCell,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    TableSortParameter,
    Pager,
    Numeral,
    TextInput,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DateCell from '#components/tableHelpers/Date';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DomainContext from '#components/DomainContext';

import { ExtractKeys } from '#types';

import {
    EntriesQuery,
    EntriesQueryVariables,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

interface Entity {
    id: string;
    name: string | undefined;
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
                publisher {
                    id
                    name
                }
                source {
                    id
                    name
                }
                totalFigures
                url
                event {
                    id
                    name
                    crisis {
                        id
                        name
                    }
                }
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

const entriesDefaultSortState: TableSortParameter = {
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
        sortState: defaultSortState = entriesDefaultSortState,
        page: defaultPage = 1,
        pageSize: defaultPageSize = 25,
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
    const { sortState, setSortState } = useSortState();
    const validSortState = sortState ?? defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

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
        data: entriesData,
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
            type stringKeys = ExtractKeys<EntryFields, string>;
            type numberKeys = ExtractKeys<EntryFields, number>;
            type entityKeys = ExtractKeys<EntryFields, Entity>;

            // Generic columns
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: EntryFields) => ({
                    value: datum[colName],
                }),
            });
            const numberColumn = (colName: numberKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_: string, datum: EntryFields) => ({
                    value: datum[colName],
                }),
            });
            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: EntryFields) => ({
                    value: datum[colName]?.name,
                }),
            });

            // Specific columns

            // eslint-disable-next-line max-len
            const articleTitleColumn: TableColumn<EntryFields, string, ExternalLinkProps, TableHeaderCellProps> = {
                id: 'articleTitle',
                title: 'Title',
                cellAsHeader: true,
                cellContainerClassName: styles.articleTitle,
                headerContainerClassName: styles.articleTitle,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'articleTitle'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: ExternalLinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.articleTitle,
                    /* FIXME: use pathnames and substitution */
                    link: datum.url,
                }),
            };

            const eventColumn: TableColumn<EntryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'event',
                title: 'Event',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'event'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.event?.name,
                    route: route.event,
                    attrs: { eventId: datum.id },
                }),
            };

            // eslint-disable-next-line max-len
            const crisisColumn: TableColumn<EntryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'crisis',
                title: 'Crisis',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'crisis'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    route: route.crisis,
                    attrs: { crisisId: datum.id },
                }),
            };
            // eslint-disable-next-line max-len
            const createdByColumn: TableColumn<EntryFields, string, TableCellProps<React.ReactNode>, TableHeaderCellProps> = {
                id: 'createdBy',
                title: 'Created by',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    value: datum.createdBy?.fullName,
                }),
            };

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
                    editLinkRoute: route.entry,
                    editLinkAttrs: { entryId: datum.id },
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                crisisColumnHidden ? undefined : crisisColumn,
                eventColumnHidden ? undefined : eventColumn,
                articleTitleColumn,
                userId ? undefined : createdByColumn,
                createColumn(dateColumn, 'publishDate', 'Publish Date'),
                createColumn(entityColumn, 'publisher', 'Publisher'),
                createColumn(entityColumn, 'source', 'Source'),
                createColumn(numberColumn, 'totalFigures', 'Figures'),
                actionColumn,
            ].filter(isDefined);
        },
        [
            setSortState, validSortState,
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
                <Table
                    className={styles.table}
                    data={entriesData?.entryList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
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
