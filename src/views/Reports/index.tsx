import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createStatusColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import useModalState from '#hooks/useModalState';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import {
    ReportsQuery,
    ReportsQueryVariables,
    DeleteReportMutation,
    DeleteReportMutationVariables,
} from '#generated/types';
import route from '#config/routes';

import ReportForm from './ReportForm';
import styles from './styles.css';
import ReportFilter from './ReportFilter';

type ReportFields = NonNullable<NonNullable<ReportsQuery['reportList']>['results']>[number];

const REPORT_LIST = gql`
    query Reports($ordering: String, $page: Int, $pageSize: Int, $name_Icontains: String, $filterFigureCountries: [ID!], $reviewStatus: [String!])
        {
        reportList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name_Icontains, filterFigureCountries: $filterFigureCountries, reviewStatus: $reviewStatus)
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
    const { notify } = useContext(NotificationContext);

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
                    notify({ children: 'Sorry, Report could not be deleted!' });
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

    const { user } = useContext(DomainContext);
    const reportPermissions = user?.permissions?.report;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ReportFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: reportPermissions?.delete ? handleReportDelete : undefined,
                    onEdit: reportPermissions?.change ? showAddReportModal : undefined,
                }),
            };

            return [
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
                createLinkColumn<ReportFields, string>(
                    'name',
                    'Name',
                    (item) => ({
                        title: item.name,
                        attrs: { reportId: item.id },
                    }),
                    route.report,
                    { cellAsHeader: true, sortable: true },
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
                    (item) => item.totalDisaggregation.totalFlowConflictSum,
                    // { sortable: true },
                ),
                createNumberColumn<ReportFields, string>(
                    'total_stock_conflict',
                    'No. of IDPs (Conflict)',
                    (item) => item.totalDisaggregation.totalStockConflictSum,
                    // { sortable: true },
                ),
                createNumberColumn<ReportFields, string>(
                    'total_flow_disaster',
                    'New Displacements (Disaster)',
                    (item) => item.totalDisaggregation.totalFlowDisasterSum,
                    // { sortable: true },
                ),
                createNumberColumn<ReportFields, string>(
                    'total_stock_disaster',
                    'No. of IDPs (Disaster)',
                    (item) => item.totalDisaggregation.totalStockDisasterSum,
                    // { sortable: true },
                ),
                createStatusColumn<ReportFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isUnderReview: false,
                        isReviewed: item?.lastGeneration?.isApproved,
                        isSignedOff: item?.lastGeneration?.isSignedOff,
                    }),
                ),
                actionColumn,
            ];
        },
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
                footerContent={totalReportsCount > 0 && (
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
                        setReportsQueryFilters={setReportsQueryFilters}
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
