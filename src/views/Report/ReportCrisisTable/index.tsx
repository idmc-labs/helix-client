import React, { useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    SortContext,
    createDateColumn,
    ConfirmButton,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';
import NotificationContext from '#components/NotificationContext';

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';

import route from '#config/routes';
import {
    ReportCrisesListQuery,
    ReportCrisesListQueryVariables,
    ExportCrisesReportMutation,
    ExportCrisesReportMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_REPORT_CRISES_LIST = gql`
    query ReportCrisesList($report: ID!, $ordering: String, $page: Int, $pageSize: Int) {
        report(id: $report) {
            id
            crisesReport(ordering: $ordering, page: $page, pageSize: $pageSize) {
                totalCount
                results {
                    totalFlowNdFigures
                    totalStockIdpFigures
                    id
                    name
                    crisisType
                    startDate
                    endDate
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

const EXPORT_CRISIS_REPORT = gql`
    mutation ExportCrisesReport($name: String, $crisisTypes: [String!], $countries: [String!], $report: String){
        exportCrises(name: $name, crisisTypes: $crisisTypes, countries: $countries, report: $report) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'name',
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
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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

    const [
        exportCrises,
        { loading: exportingCrisis },
    ] = useMutation<ExportCrisesReportMutation, ExportCrisesReportMutationVariables>(
        EXPORT_CRISIS_REPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportCrises: exportCrisisResponse } = response;
                if (!exportCrisisResponse) {
                    return;
                }
                const { errors, ok } = exportCrisisResponse;
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
            exportCrises({ variables: { report } });
        },
        [exportCrises, report],
    );

    const loading = reportCrisesLoading;
    const totalReportCrisesCount = reportCrises?.report?.crisesReport?.totalCount ?? 0;

    const reportCrisisColumns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const progressColumn: TableColumn<ReportCrisisFields, string, StackedProgressProps, TableHeaderCellProps> = {
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
                createLinkColumn<ReportCrisisFields, string>(
                    'name',
                    'Name',
                    (item) => ({
                        title: item.name,
                        attrs: { crisisId: item.id },
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createDateColumn<ReportCrisisFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<ReportCrisisFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createTextColumn<ReportCrisisFields, string>(
                    'crisis_type',
                    'Cause',
                    (item) => item.crisisType,
                    { sortable: true },
                ),
                createNumberColumn<ReportCrisisFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<ReportCrisisFields, string>(
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
            headerClassName={styles.header}
            headingContainerClassName={styles.heading}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingCrisis}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
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
                        resizableColumn
                        fixedColumnWidth
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
