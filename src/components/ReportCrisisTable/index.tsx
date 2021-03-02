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
import Container from '#components/Container';
import StringCell from '#components/tableHelpers/StringCell';
import Loading from '#components/Loading';

import { ExtractKeys } from '#types';

import {
    ReportCrisesListQuery,
    ReportCrisesListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_CRISES_LIST = gql`
    query ReportCrisesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            crisesReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowConflict
                    totalFlowDisaster
                    totalStockDisaster
                    totalStockConflict
                    id
                    name
                    crisisType
                }
                page
                pageSize
            }
        }
    }
`;

const defaultSortState = {
    name: 'name',
    direction: TableSortDirection.asc,
};

type ReportCrisisFields = NonNullable<NonNullable<NonNullable<ReportCrisesListQuery['report']>['crisesReport']>['results']>[number];

const keySelector = (item: ReportCrisisFields) => item.id;

interface ReportCrisisProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportCrisisTable(props: ReportCrisisProps) {
    const {
        className,
        report,
        heading = 'Crises',
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportCrisesListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportCrises = previousData,
        loading: reportCrisesLoading,
        // TODO: handle error
    } = useQuery<ReportCrisesListQuery>(GET_REPORT_CRISES_LIST, { variables });

    const loading = reportCrisesLoading;
    const totalReportCrisesCount = reportCrises?.report?.crisesReport?.totalCount ?? 0;

    const reportCrisisColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ReportCrisisFields, string>;
            type numberKeys = ExtractKeys<ReportCrisisFields, number>;

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
                cellRendererParams: (_: string, datum: ReportCrisisFields) => ({
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
                cellRendererParams: (_: string, datum: ReportCrisisFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
                }),
            });

            return [
                createColumn(stringColumn, 'name', 'Crisis'),
                createColumn(stringColumn, 'crisisType', 'Type'),
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
                    itemsCount={totalReportCrisesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportCrisesCount > 0 && (
                <Table
                    className={styles.table}
                    data={reportCrises?.report?.crisesReport?.results}
                    keySelector={keySelector}
                    columns={reportCrisisColumns}
                />
            )}
            {loading && <Loading absolute />}
            {!reportCrisesLoading && totalReportCrisesCount <= 0 && (
                <Message
                    message="No crises found."
                />
            )}
        </Container>
    );
}

export default ReportCrisisTable;
