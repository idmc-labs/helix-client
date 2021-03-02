import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    TableSortDirection,
    Pager,
    createDateColumn,
    createNumberColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import route from '#config/routes';
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

const defaultSorting = {
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

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

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
        () => ([
            createLinkColumn<ReportEventFields, string>(
                'name',
                'Name',
                (item) => ({
                    title: item.name,
                    attrs: { eventId: item.id },
                }),
                route.event,
                { cellAsHeader: true, sortable: true },
            ),
            createTextColumn<ReportEventFields, string>(
                'event_type',
                'Type',
                (item) => item.eventType,
                { sortable: true },
            ),
            createDateColumn<ReportEventFields, string>(
                'start_date',
                'Start Date',
                (item) => item.startDate,
                { sortable: true },
            ),
            /*
            createDateColumn<ReportEventFields, string>(
                'end_date',
                'End Date',
                (item) => item.endDate,
                { sortable: true },
            ),
            */
            createTextColumn<ReportEventFields, string>(
                'countries',
                'Countries',
                (item) => item.countries?.map((c) => c.name).join(', '),
                { sortable: true },
            ),
            createNumberColumn<ReportEventFields, string>(
                'total_flow_conflict',
                'Flow (Conflict)',
                (item) => item.totalFlowConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportEventFields, string>(
                'total_flow_disaster',
                'Flow (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
            createNumberColumn<ReportEventFields, string>(
                'total_stock_conflict',
                'Stock (Conflict)',
                (item) => item.totalStockConflict,
                { sortable: true },
            ),
            createNumberColumn<ReportEventFields, string>(
                'total_stock_disaster',
                'Stock (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
            ),
        ]),
        [
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
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportEvents?.report?.eventsReport?.results}
                        keySelector={keySelector}
                        columns={reportEventColumns}
                    />
                </SortContext.Provider>
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
