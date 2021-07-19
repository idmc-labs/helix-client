import React, { useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { getOperationName } from 'apollo-link';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    createDateColumn,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Downloads';
import NotificationContext from '#components/NotificationContext';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';

import route from '#config/routes';
import {
    ReportEventsListQuery,
    ReportEventsListQueryVariables,
    ExportEventsReportMutation,
    ExportEventsReportMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_REPORT_EVENTS_LIST = gql`
    query ReportEventsList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            eventsReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowNdFigures
                    totalStockIdpFigures
                    id
                    name
                    eventType
                    startDate
                    endDate
                    crisis {
                        name
                        id
                    }
                    reviewCount {
                        reviewCompleteCount
                        signedOffCount
                        toBeReviewedCount
                        underReviewCount
                    }
                }
                page
                pageSize
            }
        }
    }
`;

const EVENT_DOWNLOAD = gql`
    mutation ExportEventsReport($name: String, $eventTypes: [String!], $crisisByIds: [ID!], $countries: [ID!], $report: String){
        exportEvents(name: $name, eventTypes: $eventTypes, crisisByIds: $crisisByIds, countries: $countries, report: $report) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'name',
    direction: 'asc',
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

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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

    const [
        exportEvents,
        { loading: exportingEvents },
    ] = useMutation<ExportEventsReportMutation, ExportEventsReportMutationVariables>(
        EVENT_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEvents: exportEventResponse } = response;
                if (!exportEventResponse) {
                    return;
                }
                const { errors, ok } = exportEventResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleExportTableData = React.useCallback(
        () => {
            exportEvents({ variables: { report } });
        },
        [exportEvents, report],
    );

    const loading = reportEventsLoading;
    const totalReportEventsCount = reportEvents?.report?.eventsReport?.totalCount ?? 0;

    const reportEventColumns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const progressColumn: TableColumn<ReportEventFields, string, StackedProgressProps, TableHeaderCellProps> = {
                id: 'progress',
                title: 'Progress',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StackedProgressCell,
                cellRendererParams: (_, datum) => ({
                    signedOff: datum.reviewCount?.signedOffCount,
                    reviewCompleted: datum.reviewCount?.reviewCompleteCount,
                    underReview: datum.reviewCount?.underReviewCount,
                    toBeReviewed: datum.reviewCount?.toBeReviewedCount,
                }),
            };
            return [
                createLinkColumn<ReportEventFields, string>(
                    'crisis__name',
                    'Crisis',
                    (item) => ({
                        title: item.crisis?.name,
                        attrs: { eventId: item.crisis?.id },
                    }),
                    route.crisis,
                    { sortable: true },
                ),
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
                createDateColumn<ReportEventFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<ReportEventFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createTextColumn<ReportEventFields, string>(
                    'event_type',
                    'Cause',
                    (item) => item.eventType,
                    { sortable: true },
                ),
                createNumberColumn<ReportEventFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<ReportEventFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                    { sortable: true },
                ),
                progressColumn,
            ];
        },
        [],
    );

    return (
        <Container
            heading={heading}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data ?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingEvents}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
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
