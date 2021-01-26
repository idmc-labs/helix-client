import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
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
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    TableSortParameter,
    Pager,
    Numeral,
} from '@togglecorp/toggle-ui';

import StringCell, { StringCellProps } from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DateCell from '#components/tableHelpers/Date';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { ExtractKeys } from '#types';

import {
    EntriesQuery,
    DeleteEntryMutation,
    DeleteEntryMutationVariables,
    ExtractionEntryListFiltersQueryVariables,
    ExtractionEntryListFiltersQuery,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';
import { EXTRACTION_ENTRY_LIST, ENTRY_DELETE } from '../queries';

interface Entity {
    id: string;
    name: string | undefined;
}

type ExtractionEntryFields = NonNullable<NonNullable<EntriesQuery['entryList']>['results']>[number];

const entriesDefaultSortState: TableSortParameter = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: ExtractionEntryFields) => item.id;

interface ExtractionEntriesTableProps {
    heading?: string;
    className?: string;
    extractionQueryFilters?: ExtractionEntryListFiltersQueryVariables;
    searchText?: string;
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        heading = 'Entries',
        className,
        extractionQueryFilters,
        searchText,
    } = props;
    const { sortState, setSortState } = useSortState();
    const validSortState = sortState ?? entriesDefaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    // const [searchText, setSearchText] = useState<string>();

    const variables = useMemo(() => {
        if (extractionQueryFilters) {
            return {
                ...extractionQueryFilters,
                page,
                pageSize,
                ordering,
                articleTitle: searchText,
            };
        }
        return {
            page,
            pageSize,
            ordering,
            articleTitle: searchText,
        };
    }, [extractionQueryFilters, ordering, page, pageSize, searchText]);

    const {
        data: extractionEntryList,
        loading: extractionEntryListLoading,
        refetch: refetchEntries,
    } = useQuery<ExtractionEntryListFiltersQuery>(EXTRACTION_ENTRY_LIST, {
        skip: !extractionQueryFilters,
        variables,
    });

    const queryBasedEntryList = extractionEntryList?.extractionEntryList?.results;
    const totalEntriesCount = extractionEntryList?.extractionEntryList?.totalCount ?? 0;
    const { notify } = useContext(NotificationContext);

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
                const { errors, result } = deleteEntryRes;
                if (errors) {
                    notify({ children: 'Sorry, entry could not be deleted!' });
                }
                if (result) {
                    refetchEntries(variables);
                    notify({ children: 'Entry deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
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
            type stringKeys = ExtractKeys<ExtractionEntryFields, string>;
            type numberKeys = ExtractKeys<ExtractionEntryFields, number>;
            // eslint-disable-next-line max-len
            type entitiesKeys = ExtractKeys<ExtractionEntryFields, { results?: Entity[] | null | undefined }>;

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
                cellRendererParams: (_: string, datum: ExtractionEntryFields) => ({
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
                cellRendererParams: (_: string, datum: ExtractionEntryFields) => ({
                    value: datum[colName],
                }),
            });
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ExtractionEntryFields) => ({
                    value: datum[colName]?.results?.map((item) => item.name).join(', '),
                }),
            });

            // Specific columns

            // eslint-disable-next-line max-len
            const articleTitleColumn: TableColumn<ExtractionEntryFields, string, ExternalLinkProps, TableHeaderCellProps> = {
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

            // eslint-disable-next-line max-len
            const eventColumn: TableColumn<ExtractionEntryFields, string, LinkProps, TableHeaderCellProps> = {
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
            const crisisColumn: TableColumn<ExtractionEntryFields, string, LinkProps, TableHeaderCellProps> = {
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
                    title: datum.event?.crisis?.name,
                    route: route.crisis,
                    attrs: { crisisId: datum.event?.crisis?.id },
                }),
            };
            // eslint-disable-next-line max-len
            const createdByColumn: TableColumn<ExtractionEntryFields, string, StringCellProps, TableHeaderCellProps> = {
                id: 'createdBy',
                title: 'Created by',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_, datum) => ({
                    value: datum.createdBy?.fullName,
                }),
            };

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ExtractionEntryFields, string, ActionProps, TableHeaderCellProps> = {
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
                crisisColumn,
                eventColumn,
                articleTitleColumn,
                createdByColumn,
                createColumn(dateColumn, 'publishDate', 'Publish Date'),
                createColumn(entitiesColumn, 'publishers', 'Publishers'),
                createColumn(entitiesColumn, 'sources', 'Sources'),
                createColumn(numberColumn, 'totalFigures', 'Figures'),
                actionColumn,
            ].filter(isDefined);
        },
        [
            setSortState, validSortState,
            handleEntryDelete,
            entryPermissions?.delete,
        ],
    );

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            contentClassName={styles.content}
            // headerActions={(
            //     <TextInput
            //         icons={<IoIosSearch />}
            //         name="search"
            //         value={searchText}
            //         placeholder="Search"
            //         onChange={setSearchText}
            //     />
            // )}
            footerContent={(
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
                    data={queryBasedEntryList}
                    keySelector={keySelector}
                    columns={columns}
                />
            )}
            {(extractionEntryListLoading || deletingEntry) && <Loading absolute />}
            {!extractionEntryListLoading && totalEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}
export default ExtractionEntriesTable;
