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
import DateCell from '#components/tableHelpers/Date';
import Loading from '#components/Loading';

import { ExtractKeys } from '#types';

import {
    ReportEventsListQuery,
    ReportEventsListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_EVENTS_LIST = gql`
    query ReportEventsList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            eventsReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowConflict
                    totalFlowDisaster
                    totalStockDisaster
                    totalStockConflict
                    id
                    name
                    eventType
                    startDate
                    countries {
                        id
                        name
                    }
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

type ReportEventFields = NonNullable<NonNullable<NonNullable<ReportEventsListQuery['report']>['eventsReport']>['results']>[number];

const keySelector = (item: ReportEventFields) => item.id;

interface ReportEventProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportEventTable(props: ReportEventProps) {
    const {
        className,
        report,
        heading = 'Events',
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportEventsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportEvents = previousData,
        loading: reportEventsLoading,
        // TODO: handle error
    } = useQuery<ReportEventsListQuery>(GET_REPORT_EVENTS_LIST, { variables });

    const loading = reportEventsLoading;
    const totalReportEventsCount = reportEvents?.report?.eventsReport?.totalCount ?? 0;

    const reportEventColumns = useMemo(
        () => {
            interface Entity {
                id: string;
                name: string | undefined;
            }
            type stringKeys = ExtractKeys<ReportEventFields, string>;
            type numberKeys = ExtractKeys<ReportEventFields, number>;
            type entitiesKeys = ExtractKeys<ReportEventFields, Array<Entity | null | undefined>>;

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
                cellRendererParams: (_: string, datum: ReportEventFields) => ({
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
                cellRendererParams: (_: string, datum: ReportEventFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
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
                cellRendererParams: (_: string, datum: ReportEventFields) => ({
                    value: datum[colName],
                }),
            });
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ReportEventFields) => ({
                    value: datum[colName]?.map((item) => item.name).join(', '),
                }),
            });

            return [
                createColumn(stringColumn, 'name', 'Event'),
                createColumn(stringColumn, 'eventType', 'Type'),
                createColumn(dateColumn, 'startDate', 'Start Date'),
                createColumn(entitiesColumn, 'countries', 'Country'),
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
                    itemsCount={totalReportEventsCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportEventsCount > 0 && (
                <Table
                    className={styles.table}
                    data={reportEvents?.report?.eventsReport?.results}
                    keySelector={keySelector}
                    columns={reportEventColumns}
                />
            )}
            {loading && <Loading absolute />}
            {!reportEventsLoading && totalReportEventsCount <= 0 && (
                <Message
                    message="No events found."
                />
            )}
        </Container>
    );
}

export default ReportEventTable;
