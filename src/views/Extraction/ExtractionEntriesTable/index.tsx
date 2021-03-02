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
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    createNumberColumn,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

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

type ExtractionEntryFields = NonNullable<NonNullable<EntriesQuery['entryList']>['results']>[number];

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}
const entriesDefaultSorting: TableSortParameter = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: ExtractionEntryFields) => item.id;

interface ExtractionEntriesTableProps {
    heading?: string;
    headingActions?: React.ReactNode;
    className?: string;
    extractionQueryFilters?: ExtractionEntryListFiltersQueryVariables;
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        heading = 'Entries',
        headingActions,
        className,
        extractionQueryFilters,
    } = props;
    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting ?? entriesDefaultSorting;

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(() => ({
        ...extractionQueryFilters,
        page,
        pageSize,
        ordering,
    }), [extractionQueryFilters, ordering, page, pageSize]);

    const {
        previousData,
        data: extractionEntryList = previousData,
        loading: extractionEntryListLoading,
        refetch: refetchEntries,
    } = useQuery<ExtractionEntryListFiltersQuery>(EXTRACTION_ENTRY_LIST, {
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
                    editLinkRoute: route.entryEdit,
                    editLinkAttrs: { entryId: datum.id },
                }),
            };

            return [
                createDateColumn<ExtractionEntryFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createLinkColumn<ExtractionEntryFields, string>(
                    'event__crisis__name',
                    'Crisis',
                    (item) => ({
                        title: item.event?.crisis?.name,
                        attrs: { crisisId: item.event?.crisis?.id },
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createLinkColumn<ExtractionEntryFields, string>(
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
                createLinkColumn<ExtractionEntryFields, string>(
                    'article_title',
                    'Entry',
                    (item) => ({
                        title: item.articleTitle,
                        attrs: { entryId: item.id },
                    }),
                    route.entryView,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<ExtractionEntryFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createDateColumn<ExtractionEntryFields, string>(
                    'publish_date',
                    'Publish Date',
                    (item) => item.publishDate,
                    { sortable: true },
                ),
                createTextColumn<ExtractionEntryFields, string>(
                    'publishers',
                    'Publishers',
                    (item) => item.publishers?.results?.map((p) => p.name).join(', '),
                ),
                createTextColumn<ExtractionEntryFields, string>(
                    'sources',
                    'Sources',
                    (item) => item.sources?.results?.map((s) => s.name).join(', '),
                ),
                createNumberColumn<ExtractionEntryFields, string>(
                    'total_stock_figures',
                    'Stock',
                    (item) => item.totalStockFigures,
                ),
                createNumberColumn<ExtractionEntryFields, string>(
                    'total_flow_figures',
                    'Flow',
                    (item) => item.totalFlowFigures,
                ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            handleEntryDelete,
            entryPermissions?.delete,
        ],
    );

    return (
        <Container
            heading={heading}
            className={_cs(className, styles.entriesTable)}
            contentClassName={styles.content}
            headerActions={headingActions}
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
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={queryBasedEntryList}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
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
