import React, { useCallback, useMemo, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoAddOutline } from 'react-icons/io5';
import {
    Table,
    Pager,
    Modal,
    Button,
    SortContext,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    createExpandColumn,
    useBooleanState,
    useTableRowExpansion,
} from '@togglecorp/toggle-ui';

import TableMessage from '#components/TableMessage';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createDateTimeColumn,
    EXPAND_COLUMN_WIDTH,
} from '#components/tableHelpers';
import CompositionBar, { CompositionBarProps } from '#components/CompositionBar';
import Container from '#components/Container';
import Loading from '#components/Loading';
import useFilterState from '#hooks/useFilterState';
import {
    HulkBulkImportsListQuery,
    HulkBulkImportsListQueryVariables,
} from '#generated/types';
import { hasNoData, diff, formatElapsedTime } from '#utils/common';

import DatasetMatrix from './DatasetMatrix';
import DatasetSummary, { DatasetSummaryProps } from './DatasetSummary';
import HulkBulkImportFilter from './HulkBulkImportFilter';
import styles from './styles.module.css';

const GET_HULK_BULK_IMPORTS_LIST = gql`
    query HulkBulkImportsList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: HulkBulkImportFilterDataInputType,
    ) {
        hulkBulkImports(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
            results {
                id
                name
                createdAt
                createdBy {
                    id
                    fullName
                }
                startedAt
                completedAt
                status
                statusDisplay
                successCount
                failureCount
                skipCount
                datasets {
                    id
                    importType
                    importFile
                    successFile
                    failureFile
                    skipFile
                    successCount
                    failureCount
                    skipCount
                }
            }
            totalCount
            pageSize
            page
        }
    }
`;

type HulkBulkImportFields = NonNullable<NonNullable<HulkBulkImportsListQuery['hulkBulkImports']>['results']>[number];

const keySelector = (item: HulkBulkImportFields) => item.id;

// Per-dataset counts are only written once the import run finishes, so until
// then any total would read as zero.
function countsPending(item: HulkBulkImportFields) {
    return item.status === 'PENDING' || item.status === 'IN_PROGRESS';
}

interface HulkBulkImportProps {
    className?: string;
}

function HulkBulkImportTable(props: HulkBulkImportProps) {
    const {
        className,
    } = props;

    const [
        newImportInfoShown,
        showNewImportInfo,
        hideNewImportInfo,
    ] = useBooleanState(false);

    const [expandedRow, setExpandedRow] = useState<string | undefined>();

    const handleRowExpand = useCallback(
        (rowId: string) => {
            setExpandedRow((previousExpandedId) => (
                previousExpandedId === rowId ? undefined : rowId
            ));
        },
        [],
    );

    const rowModifier = useTableRowExpansion<HulkBulkImportFields, string>(
        expandedRow,
        ({ datum }) => (
            <DatasetMatrix
                datasets={datum.datasets}
                pending={countsPending(datum)}
            />
        ),
    );

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,
        reset,
        changed,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<HulkBulkImportsListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const hulkBulkImportVariables = useMemo(
        (): HulkBulkImportsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: filter,
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        previousData,
        data: hulkBulkImports = previousData,
        loading: hulkBulkImportsLoading,
        error: hulkBulkImportsError,
    } = useQuery<HulkBulkImportsListQuery>(
        GET_HULK_BULK_IMPORTS_LIST,
        { variables: hulkBulkImportVariables },
    );

    const columns = useMemo(
        () => {
            const outcomeColumn: TableColumn<
                HulkBulkImportFields, string, CompositionBarProps, TableHeaderCellProps
            > = {
                id: 'outcome',
                title: 'Success Rate',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: { sortable: false },
                cellRenderer: CompositionBar,
                cellRendererParams: (_, item) => ({
                    barHeight: 12,
                    data: [
                        {
                            title: 'Success',
                            color: 'var(--color-success)',
                            value: item.successCount,
                        },
                        {
                            title: 'Skipped',
                            color: 'var(--color-warning)',
                            value: item.skipCount,
                        },
                        {
                            title: 'Failure',
                            color: 'var(--color-danger)',
                            value: item.failureCount,
                        },
                    ],
                }),
            };

            const importsColumn: TableColumn<
                HulkBulkImportFields, string, DatasetSummaryProps, TableHeaderCellProps
            > = {
                id: 'import_files',
                title: 'Imports',
                columnWidth: 240,
                columnStretch: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: { sortable: false },
                cellRenderer: DatasetSummary,
                cellRendererParams: (_, item) => ({
                    datasets: item.datasets,
                    pending: countsPending(item),
                }),
            };

            return [
                createExpandColumn<HulkBulkImportFields, string>(
                    'expand-button',
                    '',
                    handleRowExpand,
                    // TODO: should pass this using context
                    expandedRow,
                    {
                        columnWidth: EXPAND_COLUMN_WIDTH,
                        columnStretch: false,
                    },
                ),
                createDateTimeColumn<HulkBulkImportFields, string>(
                    'created_at',
                    'Created At',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                {
                    ...createTextColumn<HulkBulkImportFields, string>(
                        'created_by__full_name',
                        'Created By',
                        (item) => item.createdBy.fullName,
                        undefined,
                        'medium-large',
                    ),
                    // NOTE: let the Imports column absorb the slack instead
                    columnStretch: false,
                },
                createTextColumn<HulkBulkImportFields, string>(
                    'name',
                    'Name',
                    (item) => item.name ?? `Import ${item.id}`,
                    { sortable: true },
                ),
                createTextColumn<HulkBulkImportFields, string>(
                    'status',
                    'Status',
                    (item) => item.statusDisplay,
                    { sortable: true },
                ),
                importsColumn,
                createDateTimeColumn<HulkBulkImportFields, string>(
                    'started_at',
                    'Started At',
                    (item) => item.startedAt,
                    { sortable: true },
                ),
                createDateTimeColumn<HulkBulkImportFields, string>(
                    'completed_at',
                    'Completed At',
                    (item) => item.completedAt,
                    { sortable: true },
                ),
                createTextColumn<HulkBulkImportFields, string>(
                    'wait_time',
                    'Wait Time',
                    (item) => (
                        item.startedAt && item.createdAt
                            ? formatElapsedTime(diff(item.startedAt, item.createdAt))
                            : undefined
                    ),
                ),
                createTextColumn<HulkBulkImportFields, string>(
                    'execution_time',
                    'Execution Time',
                    (item) => (
                        item.completedAt && item.startedAt
                            ? formatElapsedTime(diff(item.completedAt, item.startedAt))
                            : undefined
                    ),
                ),
                outcomeColumn,
            ];
        },
        [
            expandedRow,
            handleRowExpand,
        ],
    );

    const totalHulkBulkImportsCount = hulkBulkImports?.hulkBulkImports?.totalCount ?? 0;

    return (
        <Container
            compactContent
            heading="Imports"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <Button
                    name={undefined}
                    onClick={showNewImportInfo}
                    icons={<IoAddOutline />}
                >
                    New Import
                </Button>
            )}
            description={(
                <HulkBulkImportFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                    onFilterReset={reset}
                    changed={changed}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalHulkBulkImportsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {hulkBulkImportsLoading && <Loading absolute />}
            {totalHulkBulkImportsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={hulkBulkImports?.hulkBulkImports?.results}
                        keySelector={keySelector}
                        columns={columns}
                        rowModifier={rowModifier}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {!hulkBulkImportsLoading && (
                <TableMessage
                    errored={!!hulkBulkImportsError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalHulkBulkImportsCount}
                    emptyMessage="No hulk imports found"
                    emptyMessageWithFilters="No hulk imports found with applied filters"
                    errorMessage="Could not fetch hulk imports"
                />
            )}
            {newImportInfoShown && (
                <Modal
                    heading="New Import"
                    onClose={hideNewImportInfo}
                    size="medium"
                    freeHeight
                    footerClassName={styles.modalFooter}
                    footer={(
                        <Button
                            name={undefined}
                            variant="primary"
                            onClick={hideNewImportInfo}
                        >
                            Close
                        </Button>
                    )}
                >
                    HULK imports cannot be created from the platform.
                    Use the pyhelix interface to prepare and trigger a bulk import.
                </Modal>
            )}
        </Container>
    );
}

export default HulkBulkImportTable;
