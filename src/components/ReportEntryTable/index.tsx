import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    createColumn,
    TableHeaderCell,
    useSortState,
    TableSortDirection,
    Pager,
    Numeral,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import DateCell from '#components/tableHelpers/Date';
import Container from '#components/Container';
import StringCell from '#components/tableHelpers/StringCell';
import Loading from '#components/Loading';

import { ExtractKeys } from '#types';

import {
    ReportEntriesListQuery,
    ReportEntriesListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_ENTRIES_LIST = gql`
    query ReportEntriesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            entriesReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowConflict
                    totalFlowDisaster
                    totalStockDisaster
                    totalStockConflict
                    id
                    articleTitle
                    createdAt
                }
                page
                pageSize
            }
        }
    }
`;

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.asc,
};

type ReportEntryFields = NonNullable<NonNullable<NonNullable<ReportEntriesListQuery['report']>['entriesReport']>['results']>[number];

const keySelector = (item: ReportEntryFields) => item.id;

interface ReportEntryProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportEntryTable(props: ReportEntryProps) {
    const {
        className,
        report,
        heading = 'Entries',
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportEntriesListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportEntries = previousData,
        loading: reportEntriesLoading,
        // TODO: handle error
    } = useQuery<ReportEntriesListQuery>(GET_REPORT_ENTRIES_LIST, { variables });

    const loading = reportEntriesLoading;
    const totalReportEntriesCount = reportEntries?.report?.entriesReport?.totalCount ?? 0;

    const reportEntryColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ReportEntryFields, string>;
            type numberKeys = ExtractKeys<ReportEntryFields, number>;

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
                cellAsHeader: true,
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ReportEntryFields) => ({
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
                cellRendererParams: (_: string, datum: ReportEntryFields) => ({
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
                cellRendererParams: (_: string, datum: ReportEntryFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
                }),
            });

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(stringColumn, 'articleTitle', 'Entry', true),
                createColumn(numberColumn, 'totalFlowConflict', 'Flow (Conflict)'),
                createColumn(numberColumn, 'totalFlowDisaster', 'Flow (Disaster)'),
                createColumn(numberColumn, 'totalStockConflict', 'Stock (Conflict)'),
                createColumn(numberColumn, 'totalStockDisaster', 'Stock (Disaster)'),
            ];
        },
        [
            setSortState,
            validSortState,
        ],
    );

    return (
        <Container
            heading={heading}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportEntriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportEntriesCount > 0 && (
                <Table
                    className={styles.table}
                    data={reportEntries?.report?.entriesReport?.results}
                    keySelector={keySelector}
                    columns={reportEntryColumns}
                />
            )}
            {loading && <Loading absolute />}
            {!reportEntriesLoading && totalReportEntriesCount <= 0 && (
                <Message
                    message="No entries found."
                />
            )}
        </Container>
    );
}

export default ReportEntryTable;
