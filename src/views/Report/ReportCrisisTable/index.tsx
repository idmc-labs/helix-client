import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    SortContext,
    createNumberColumn,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import route from '#config/routes';
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
                    crisis {
                        id
                        name
                        crisisType
                        startDate
                        endDate
                    }
                }
                page
                pageSize
            }
        }
    }
`;

const defaultSorting = {
    name: 'entry__event__crisis__name',
    direction: 'asc',
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

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

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
        () => ([
            createLinkColumn<ReportCrisisFields, string>(
                'entry__event__crisis__name',
                'Name',
                (item) => ({
                    title: item.crisis.name,
                    attrs: { crisisId: item.crisis.id },
                }),
                route.crisis,
                { cellAsHeader: true, sortable: true },
            ),
            createDateColumn<ReportCrisisFields, string>(
                'entry__event__crisis__start_date',
                'Start Date',
                (item) => item.crisis.startDate,
                { sortable: true },
            ),
            createDateColumn<ReportCrisisFields, string>(
                'entry__event__crisis__end_date',
                'End Date',
                (item) => item.crisis.endDate,
                { sortable: true },
            ),
            createTextColumn<ReportCrisisFields, string>(
                'entry__event__crisis__crisis_type',
                'Type',
                (item) => item.crisis.crisisType,
                { sortable: true },
            ),
            createNumberColumn<ReportCrisisFields, string>(
                'total_flow_conflict',
                'New Displacements (Conflict)',
                (item) => item.totalFlowConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportCrisisFields, string>(
                'total_stock_conflict',
                'No. of IDPs (Conflict)',
                (item) => item.totalStockConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportCrisisFields, string>(
                'total_flow_disaster',
                'New Displacements (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
            createNumberColumn<ReportCrisisFields, string>(
                'total_stock_disaster',
                'No. of IDPs (Disaster)',
                (item) => item.totalStockDisaster,
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
                    itemsCount={totalReportCrisesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalReportCrisesCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportCrises?.report?.crisesReport?.results}
                        keySelector={keySelector}
                        columns={reportCrisisColumns}
                    />
                </SortContext.Provider>
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
