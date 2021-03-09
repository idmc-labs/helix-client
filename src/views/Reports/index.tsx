import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
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

type ReportFields = NonNullable<NonNullable<ReportsQuery['reportList']>['results']>[number];

const REPORT_LIST = gql`
    query Reports($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        reportList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name) {
            totalCount
            pageSize
            page
            results {
                id
                name
                figureStartAfter
                figureEndBefore
                createdAt
                createdBy {
                    id
                    email
                    fullName
                }
                isApproved
                isSignedOff
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
    direction: TableSortDirection.dsc,
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

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddReportModal,
        editableReportId,
        showAddReportModal,
        hideAddReportModal,
    ] = useModalState();

    const reportsVariables = useMemo(
        (): ReportsQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
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
                    'Start Date',
                    (item) => item.figureStartAfter,
                    { sortable: true },
                ),
                createDateColumn<ReportFields, string>(
                    'figure_end_before',
                    'End Date',
                    (item) => item.figureEndBefore,
                    { sortable: true },
                ),
                createNumberColumn<ReportFields, string>(
                    'total_flow_conflict',
                    'Flow (Conflict)',
                    (item) => item.totalDisaggregation.totalFlowConflictSum,
                ),
                createNumberColumn<ReportFields, string>(
                    'total_stock_conflict',
                    'Stock (Conflict)',
                    (item) => item.totalDisaggregation.totalStockConflictSum,
                ),
                createNumberColumn<ReportFields, string>(
                    'total_flow_disaster',
                    'Flow (Disaster)',
                    (item) => item.totalDisaggregation.totalFlowDisasterSum,
                ),
                createNumberColumn<ReportFields, string>(
                    'total_stock_disaster',
                    'Stock (Disaster)',
                    (item) => item.totalDisaggregation.totalStockDisasterSum,
                ),
                createStatusColumn<ReportFields, string>(
                    'status',
                    '',
                    (item) => ({
                        isUnderReview: false,
                        isReviewed: item.isApproved,
                        isSignedOff: item.isSignedOff,
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
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
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
