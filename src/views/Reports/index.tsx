import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import {
    createTextColumn,
    createStatusColumn,
    createActionColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import useModalState from '#hooks/useModalState';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import {
    ReportsQuery,
    ReportsQueryVariables,
    DeleteReportMutation,
    DeleteReportMutationVariables,
    ExportReportsMutation,
    ExportReportsMutationVariables,
} from '#generated/types';
import route from '#config/routes';

import ReportForm from './ReportForm';
import styles from './styles.css';
import ReportFilter from './ReportFilter';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type ReportFields = NonNullable<NonNullable<ReportsQuery['reportList']>['results']>[number];

const REPORT_LIST = gql`
    query Reports($ordering: String, $page: Int, $pageSize: Int, $name_Unaccent_Icontains: String, $filterFigureCountries: [ID!], $reviewStatus: [String!])
        {
        reportList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Unaccent_Icontains: $name_Unaccent_Icontains, filterFigureCountries: $filterFigureCountries, reviewStatus: $reviewStatus)
            {
            totalCount
            pageSize
            page
            results {
                id
                name
                filterFigureStartAfter
                filterFigureEndBefore
                createdAt
                createdBy {
                    id
                    fullName
                }
                lastGeneration {
                    isApproved
                    isSignedOff
                }
                totalDisaggregation {
                    totalFlowConflictSum
                    totalFlowDisasterSum
                    totalStockConflictSum
                    totalStockDisasterSum
                }
            }
        }
    }
`;

const REPORT_DELETE = gql`
    mutation DeleteReport($id: ID!) {
        deleteReport(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const REPORT_DOWNLOAD = gql`
    mutation ExportReports($reviewStatus: [String!], $name_Unaccent_Icontains: String, $filterFigureCountries: [ID!]){
        exportReports(reviewStatus: $reviewStatus, name_Unaccent_Icontains: $name_Unaccent_Icontains, filterFigureCountries: $filterFigureCountries) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

const keySelector = (item: ReportFields) => item.id;

interface ReportsProps {
    className?: string;
}

function Reports(props: ReportsProps) {
    const { className } = props;

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

    const [
        shouldShowAddReportModal,
        editableReportId,
        showAddReportModal,
        hideAddReportModal,
    ] = useModalState();

    const [
        reportsQueryFilters,
        setReportsQueryFilters,
    ] = useState<PurgeNull<ReportsQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ReportsQueryVariables>) => {
            setReportsQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const reportsVariables = useMemo(
        (): ReportsQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...reportsQueryFilters,
        }),
        [ordering, page, pageSize, reportsQueryFilters],
    );

    const {
        previousData,
        data: reportsData = previousData,
        loading: loadingReports,
        refetch: refetchReports,
    } = useQuery<ReportsQuery, ReportsQueryVariables>(REPORT_LIST, {
        variables: reportsVariables,
    });

    const [
        deleteReport,
        { loading: deletingReport },
    ] = useMutation<DeleteReportMutation, DeleteReportMutationVariables>(
        REPORT_DELETE,
        {
            onCompleted: (response) => {
                const { deleteReport: deleteReportRes } = response;
                if (!deleteReportRes) {
                    return;
                }
                const { errors, result } = deleteReportRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchReports(reportsVariables);
                    notify({ children: 'Report deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleReportCreate = React.useCallback(() => {
        refetchReports(reportsVariables);
        hideAddReportModal();
    }, [refetchReports, reportsVariables, hideAddReportModal]);

    const handleReportDelete = useCallback(
        (id: string) => {
            deleteReport({
                variables: { id },
            });
        },
        [deleteReport],
    );

    const [
        exportReports,
        { loading: exportingReports },
    ] = useMutation<ExportReportsMutation, ExportReportsMutationVariables>(
        REPORT_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportReports: exportReportsResponse } = response;
                if (!exportReportsResponse) {
                    return;
                }
                const { errors, ok } = exportReportsResponse;
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

    const handleExportTableData = useCallback(
        () => {
            exportReports({
                variables: reportsQueryFilters,
            });
        },
        [exportReports, reportsQueryFilters],
    );

    const { user } = useContext(DomainContext);
    const reportPermissions = user?.permissions?.report;

    const columns = useMemo(
        () => ([
            createDateColumn<ReportFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ReportFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createStatusColumn<ReportFields, string>(
                'name',
                'Name',
                (item) => ({
                    title: item.name,
                    attrs: { reportId: item.id },
                    isUnderReview: false,
                    isReviewed: item.lastGeneration?.isApproved,
                    isSignedOff: item.lastGeneration?.isSignedOff,
                }),
                route.report,
                { sortable: true },
            ),
            createDateColumn<ReportFields, string>(
                'figure_start_after',
                'Start Date of Report',
                (item) => item.filterFigureStartAfter,
                { sortable: true },
            ),
            createDateColumn<ReportFields, string>(
                'figure_end_before',
                'End Date of Report',
                (item) => item.filterFigureEndBefore,
                { sortable: true },
            ),
            createNumberColumn<ReportFields, string>(
                'total_flow_conflict',
                'New Displacements (Conflict)',
                (item) => item.totalDisaggregation?.totalFlowConflictSum,
                // { sortable: true },
            ),
            createNumberColumn<ReportFields, string>(
                'total_stock_conflict',
                'No. of IDPs (Conflict)',
                (item) => item.totalDisaggregation?.totalStockConflictSum,
                // { sortable: true },
            ),
            createNumberColumn<ReportFields, string>(
                'total_flow_disaster',
                'New Displacements (Disaster)',
                (item) => item.totalDisaggregation?.totalFlowDisasterSum,
                // { sortable: true },
            ),
            createNumberColumn<ReportFields, string>(
                'total_stock_disaster',
                'No. of IDPs (Disaster)',
                (item) => item.totalDisaggregation?.totalStockDisasterSum,
                // { sortable: true },
            ),
            createActionColumn<ReportFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: reportPermissions?.change ? showAddReportModal : undefined,
                    onDelete: reportPermissions?.delete ? handleReportDelete : undefined,
                }),
            ),
        ]),
        [
            showAddReportModal,
            handleReportDelete,
            reportPermissions?.delete,
            reportPermissions?.change,
        ],
    );

    const totalReportsCount = reportsData?.reportList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.reports, className)}>
            <PageHeader
                title="Reports"
            />
            <Container
                heading="Reports"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <>
                        <ConfirmButton
                            confirmationHeader="Confirm Export"
                            confirmationMessage="Are you sure you want to export this table data?"
                            name={undefined}
                            onConfirm={handleExportTableData}
                            disabled={exportingReports}
                        >
                            Export
                        </ConfirmButton>
                        {reportPermissions?.add && (
                            <Button
                                name={undefined}
                                onClick={showAddReportModal}
                                disabled={loadingReports}
                            >
                                Add Report
                            </Button>
                        )}
                    </>
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={totalReportsCount}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
                description={(
                    <ReportFilter
                        onFilterChange={onFilterChange}
                    />
                )}
            >
                {totalReportsCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={reportsData?.reportList?.results}
                            keySelector={keySelector}
                            columns={columns}
                            resizableColumn
                            fixedColumnWidth
                        />
                    </SortContext.Provider>
                )}
                {(loadingReports || deletingReport) && <Loading absolute />}
                {!loadingReports && totalReportsCount <= 0 && (
                    <Message
                        message="No reports found."
                    />
                )}
                {shouldShowAddReportModal && (
                    <Modal
                        onClose={hideAddReportModal}
                        heading={editableReportId ? 'Edit Report' : 'Add Report'}
                    >
                        <ReportForm
                            id={editableReportId}
                            onReportCreate={handleReportCreate}
                            onReportFormCancel={hideAddReportModal}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default Reports;
