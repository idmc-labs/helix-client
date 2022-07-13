import React, { useState, useMemo, useContext, useCallback } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { getOperationName } from 'apollo-link';
import {
    Table,
    useSortState,
    Pager,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createStatusColumn,
    createDateColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NotificationContext from '#components/NotificationContext';

import route from '#config/routes';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';

import useDebouncedValue from '#hooks/useDebouncedValue';
import {
    ReportEntriesListQuery,
    ReportEntriesListQueryVariables,
    ExportEntriesReportMutation,
    ExportEntriesReportMutationVariables,
} from '#generated/types';

import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_REPORT_ENTRIES_LIST = gql`
    query ReportEntriesList(
        $report: ID!,
        $ordering: String,
        $page: Int,
        $pageSize: Int,
    ) {
        report(id: $report) {
            id
            entriesReport(
                ordering: $ordering,
                page: $page,
                pageSize: $pageSize,
            ) {
                totalCount
                results {
                    # totalFlowNdFigures
                    # totalStockIdpFigures
                    id
                    oldId
                    isReviewed
                    isSignedOff
                    isUnderReview
                    url
                    articleTitle
                    createdAt
                    createdBy {
                        fullName
                    }
                    publishDate
                }
                page
                pageSize
            }
        }
    }
`;

export const ENTRIES_DOWNLOAD = gql`
    mutation ExportEntriesReport(
    $report: String
    ) {
        exportEntries(
        report: $report
        ) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'created_at',
    direction: 'asc',
};

type ReportEntryFields = NonNullable<NonNullable<NonNullable<ReportEntriesListQuery['report']>['entriesReport']>['results']>[number];

const keySelector = (item: ReportEntryFields) => item.id;

interface ReportEntryProps {
    className?: string;
    report: string;
    tabs?: React.ReactNode;
}

function ReportEntryTable(props: ReportEntryProps) {
    const {
        className,
        report,
        tabs,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const variables = useMemo(
        (): ReportEntriesListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            report,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            report,
        ],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const {
        previousData,
        data: reportEntries = previousData,
        loading: reportEntriesLoading,
        // TODO: handle error
    } = useQuery<ReportEntriesListQuery>(GET_REPORT_ENTRIES_LIST, { variables });

    const [
        exportEntries,
        { loading: exportingEntries },
    ] = useMutation<ExportEntriesReportMutation, ExportEntriesReportMutationVariables>(
        ENTRIES_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportEntries: exportEntriesResponse } = response;
                if (!exportEntriesResponse) {
                    return;
                }
                const { errors, ok } = exportEntriesResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleExportEntriesData = React.useCallback(
        () => {
            exportEntries({ variables: { report } });
        },
        [exportEntries, report],
    );

    const loading = reportEntriesLoading;
    const totalReportEntriesCount = reportEntries?.report?.entriesReport?.totalCount ?? 0;

    const reportEntryColumns = useMemo(
        () => ([
            createDateColumn<ReportEntryFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ReportEntryFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createStatusColumn<ReportEntryFields, string>(
                'article_title',
                'Entry',
                (item) => ({
                    title: item.articleTitle,
                    attrs: { entryId: item.id },
                    isReviewed: item.isReviewed,
                    isSignedOff: item.isSignedOff,
                    isUnderReview: item.isUnderReview,
                    ext: item?.oldId
                        ? `/documents/${item.oldId}`
                        : undefined,
                }),
                route.entryView,
                { sortable: true },
            ),
            createDateColumn<ReportEntryFields, string>(
                'publish_date',
                'Publish Date',
                (item) => item.publishDate,
                { sortable: true },
            ),
            /*
            // Note: This is hidden as per request but it might be used in future
            createNumberColumn<ReportEntryFields, string>(
                'total_flow_nd_figures',
                'New Displacements',
                (item) => item.totalFlowNdFigures,
                { sortable: true },
            ),
            createNumberColumn<ReportEntryFields, string>(
                'total_stock_idp_figures',
                'No. of IDPs',
                (item) => item.totalStockIdpFigures,
                { sortable: true },
            ),
            */
        ]),
        [],
    );

    return (
        <Container
            tabs={tabs}
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <ConfirmButton
                        confirmationHeader="Export"
                        confirmationMessage="Are you sure you want to export entries?"
                        name={undefined}
                        onConfirm={handleExportEntriesData}
                        disabled={exportingEntries}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalReportEntriesCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                />
            )}
        >
            {totalReportEntriesCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={reportEntries?.report?.entriesReport?.results}
                        keySelector={keySelector}
                        columns={reportEntryColumns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
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
