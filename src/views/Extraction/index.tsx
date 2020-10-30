import React, { useMemo, useState, useCallback } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    TableCellProps,
    TableCell,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Numeral,
    Button,
} from '@togglecorp/toggle-ui';

import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';

import { ExtractKeys } from '#types';
import { ObjectError } from '#utils/errorTransform';

import styles from './styles.css';

// NOTE: move this to utils
interface EntryFields {
    id: string;
    articleTitle: string;
    createdAt: string;
    createdBy: {
        id: string;
        username?: string;
    };
    publishDate?: string;
    publisher?: string;
    source?: string;
    totalFigures?: number;
    url?: string;
    event?: {
        id: string;
        name: string;
        crisis?: {
            id: string;
            name: string;
        }
    }
}

const ENTRY_LIST = gql`
    query EntryList($ordering: String, $page: Int, $pageSize: Int, $text: String) {
        entryList(ordering: $ordering, page: $page, pageSize: $pageSize, articleTitle_Icontains: $text) {
            page
            pageSize
            totalCount
            results {
                articleTitle
                createdAt
                id
                createdBy {
                    username
                }
                publishDate
                publisher
                source
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
            errors {
                field
                messages
            }
            entry {
                id
            }
        }
    }
`;

interface DeleteEntryResponseFields {
    deleteEntry: {
        errors?: ObjectError[];
        entry: {
            id: string;
        }
    };
}

interface DeleteEntryVariables {
    id: string;
}

interface EntryListResponseFields {
    entryList: {
        results?: EntryFields[];
        totalCount: number;
        page: number;
        pageSize: number;
    };
}
interface EntryListVariables {
    ordering: string;
    page: number;
    pageSize: number;
    text: string | undefined;
}

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.asc,
};

const keySelector = (item: EntryFields) => item.id;

interface ExtractionProps {
    className?: string;
}

function Extraction(props: ExtractionProps) {
    const { className } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(25);

    const crisesVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            text: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        data: crisesData,
        loading: loadingCrises,
        refetch: refetchCrises,
    } = useQuery<EntryListResponseFields, EntryListVariables>(ENTRY_LIST, {
        variables: crisesVariables,
    });

    const [
        deleteEntry,
        { loading: deletingEntry },
    ] = useMutation<DeleteEntryResponseFields, DeleteEntryVariables>(
        ENTRY_DELETE,
        {
            onCompleted: (response) => {
                if (!response.deleteEntry.errors) {
                    refetchCrises(crisesVariables);
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

    const handleEntryAdd = useCallback(
        () => {
            console.warn('Go to next page');
        },
        [],
    );

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<EntryFields, string>;
            type numberKeys = ExtractKeys<EntryFields, number>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
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
                    value: datum[colName],
                }),
            });
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

            // Specific columns

            // eslint-disable-next-line max-len
            const articleTitleColumn: TableColumn<EntryFields, string, ExternalLinkProps, TableHeaderCellProps> = {
                id: 'articleTitle',
                title: 'Title',
                cellAsHeader: true,
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
                cellAsHeader: true,
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
                    link: `/events/${datum.event?.id}/`,
                }),
            };

            // eslint-disable-next-line max-len
            const crisisColumn: TableColumn<EntryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'crisis',
                title: 'Crisis',
                cellAsHeader: true,
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
                    title: datum.event?.crisis?.name,
                    link: `/crises/${datum.event?.crisis?.id}/`,
                }),
            };
            // eslint-disable-next-line max-len
            const createdByColumn: TableColumn<EntryFields, string, TableCellProps<React.ReactNode>, TableHeaderCellProps> = {
                id: 'createdBy',
                title: 'Created by',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'createdBy'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    value: datum.createdBy?.username,
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
                    onDelete: handleEntryDelete,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                crisisColumn,
                eventColumn,
                articleTitleColumn,
                createdByColumn,
                createColumn(dateColumn, 'publishDate', 'Publish Date'),
                createColumn(stringColumn, 'publisher', 'Publisher'),
                createColumn(stringColumn, 'source', 'Source'),
                createColumn(numberColumn, 'totalFigures', 'Figures'),
                actionColumn,
            ];
        },
        [setSortState, validSortState, handleEntryDelete],
    );

    return (
        <div className={_cs(styles.extraction, className)}>
            <PageHeader
                title="New Query"
            />
            <Container
                heading="Entries"
                className={styles.container}
                headerActions={(
                    <>
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
                        <Button
                            name={undefined}
                            onClick={handleEntryAdd}
                            disabled
                        >
                            Add Entry
                        </Button>
                    </>
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={crisesData?.entryList.totalCount ?? 0}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
            >
                <Table
                    className={styles.table}
                    data={crisesData?.entryList.results}
                    keySelector={keySelector}
                    columns={columns}
                />
                {(loadingCrises || deletingEntry) && <Loading />}
            </Container>
        </div>
    );
}

export default Extraction;
