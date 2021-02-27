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
    ReportCountriesListQuery,
    ReportCountriesListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

const GET_REPORT_COUNTRIES_LIST = gql`
    query ReportCountriesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            countriesReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowConflict
                    totalFlowDisaster
                    totalStockDisaster
                    totalStockConflict
                    id
                    name
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

type ReportCountryFields = NonNullable<NonNullable<NonNullable<ReportCountriesListQuery['report']>['countriesReport']>['results']>[number];

const keySelector = (item: ReportCountryFields) => item.id;

interface ReportCountryProps {
    className?: string;
    report: string;
}

function ReportCountryTable(props: ReportCountryProps) {
    const {
        className,
        report,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const variables = useMemo(
        (): ReportCountriesListQueryVariables => ({
            ordering,
            page,
            pageSize,
            report,
        }),
        [ordering, page, pageSize, report],
    );

    const {
        previousData,
        data: reportCountries = previousData,
        loading: reportCountriesLoading,
        // TODO: handle error
    } = useQuery<ReportCountriesListQuery>(GET_REPORT_COUNTRIES_LIST, { variables });

    const loading = reportCountriesLoading;
    const totalReportCountriesCount = reportCountries?.report?.countriesReport?.totalCount ?? 0;

    const reportCountryColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ReportCountryFields, string>;
            type numberKeys = ExtractKeys<ReportCountryFields, number>;

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
                cellRendererParams: (_: string, datum: ReportCountryFields) => ({
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
                cellRendererParams: (_: string, datum: ReportCountryFields) => ({
                    value: datum[colName],
                    placeholder: 'n/a',
                }),
            });

            return [
                createColumn(stringColumn, 'name', 'Country'),
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
            heading="Countries"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportCountriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportCountriesCount > 0 && (
                <Table
                    className={styles.table}
                    data={reportCountries?.report?.countriesReport?.results}
                    keySelector={keySelector}
                    columns={reportCountryColumns}
                />
            )}
            {loading && <Loading absolute />}
            {!reportCountriesLoading && totalReportCountriesCount <= 0 && (
                <Message
                    message="No countries found."
                />
            )}
        </Container>
    );
}

export default ReportCountryTable;
