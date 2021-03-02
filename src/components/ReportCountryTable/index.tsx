import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    TableSortDirection,
    Pager,
    SortContext,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import { createLinkColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import route from '#config/routes';
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

const defaultSorting = {
    name: 'name',
    direction: TableSortDirection.asc,
};

type ReportCountryFields = NonNullable<NonNullable<NonNullable<ReportCountriesListQuery['report']>['countriesReport']>['results']>[number];

const keySelector = (item: ReportCountryFields) => item.id;

interface ReportCountryProps {
    className?: string;
    report: string;
    heading?: React.ReactNode;
}

function ReportCountryTable(props: ReportCountryProps) {
    const {
        className,
        report,
        heading = 'Countries',
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

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
        () => ([
            createLinkColumn<ReportCountryFields, string>(
                'name',
                'Name',
                (item) => ({
                    title: item.name,
                    attrs: { countryId: item.id },
                }),
                route.country,
                { cellAsHeader: true, sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_flow_conflict',
                'Flow (Conflict)',
                (item) => item.totalFlowConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_flow_disaster',
                'Flow (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
            createNumberColumn<ReportCountryFields, string>(
                'total_stock_conflict',
                'Stock (Conflict)',
                (item) => item.totalStockConflict,
                { sortable: true },
            ),

            createNumberColumn<ReportCountryFields, string>(
                'total_stock_disaster',
                'Stock (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
        ]),
        [],
    );

    return (
        <Container
            heading={heading}
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
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportCountries?.report?.countriesReport?.results}
                        keySelector={keySelector}
                        columns={reportCountryColumns}
                    />
                </SortContext.Provider>
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
