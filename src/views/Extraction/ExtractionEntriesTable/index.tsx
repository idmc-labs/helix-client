import React, { useMemo, useCallback, useContext, useState } from 'react';
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
    createDateColumn,
    SortContext,
    createExpandColumn,
    useTableRowExpansion,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createNumberColumn,
    createStatusColumn,
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
import ExtractionFigureTable from '../ExtractionFigureTable';
import { EXTRACTION_ENTRY_LIST, ENTRY_DELETE } from '../queries';

type ExtractionEntryFields = NonNullable<NonNullable<EntriesQuery['entryList']>['results']>[number];

interface TableSortParameter {
    name: string;
    direction: TableSortDirection;
}
const entriesDefaultSorting: TableSortParameter = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: ExtractionEntryFields) => item.id;

interface ExtractionEntriesTableProps {
    heading?: string;
    headingActions?: React.ReactNode;
    className?: string;
    extractionQueryFilters?: ExtractionEntryListFiltersQueryVariables;
    page: number;
    onPageChange: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number,
    onPageSizeChange: React.Dispatch<React.SetStateAction<number>>;
}

function ExtractionEntriesTable(props: ExtractionEntriesTableProps) {
    const {
        heading = 'Entries',
        headingActions,
        className,
        extractionQueryFilters,
        page,
        onPageChange,
        pageSize,
        onPageSizeChange,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting ?? entriesDefaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [expandedRow, setExpandedRow] = useState<string | undefined>();

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
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const handleRowExpand = React.useCallback(
        (rowId: string) => {
            setExpandedRow((previousExpandedId) => (
                previousExpandedId === rowId ? undefined : rowId
            ));
        }, [],
    );

    const rowModifier = useTableRowExpansion<ExtractionEntryFields, string>(
        expandedRow,
        ({ datum }) => (
            <ExtractionFigureTable
                entry={datum.id}
            />
        ),
    );

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
                    notifyGQLError(errors);
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
                createExpandColumn<ExtractionEntryFields, string>(
                    'expand-button',
                    '',
                    handleRowExpand,
                    expandedRow,
                    // FIXME: expandedRow should be <string | undefined> in createExpandColumn
                ),
                createDateColumn<ExtractionEntryFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<ExtractionEntryFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
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
                createTextColumn<ExtractionEntryFields, string>(
                    'event__event_type',
                    'Cause',
                    (item) => item.event.eventType,
                    { sortable: true },
                ),
                createNumberColumn<ExtractionEntryFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                    // { sortable: true },
                ),
                createNumberColumn<ExtractionEntryFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                    // { sortable: true },
                ),
                createStatusColumn<ExtractionEntryFields, string>(
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
            handleRowExpand,
            expandedRow,
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
                    onActivePageChange={onPageChange}
                    onItemsPerPageChange={onPageSizeChange}
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
                        rowModifier={rowModifier}
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
