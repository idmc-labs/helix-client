import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
} from '@togglecorp/toggle-ui';

import StringCell from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
// import ReportForm from '#components/ReportForm';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';
import DateCell from '#components/tableHelpers/Date';

import { ExtractKeys } from '#types';

import {
    ReportsQuery,
    ReportsQueryVariables,
    /*
    DeleteReportMutation,
    DeleteReportMutationVariables,
    */
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

interface User {
    id: string;
    email: string;
    fullName?: string | null;
}

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
                analysis
                challenges
                methodology
                summary
                significantUpdates
                createdAt
                createdBy {
                    id
                    email
                    fullName
                }
            }
        }
    }
`;

/*
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
*/

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: ReportFields) => item.id;

interface ReportsProps {
    className?: string;
}

function Reports(props: ReportsProps) {
    const { className } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    /*
    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddReportModal,
        editableReportId,
        showAddReportModal,
        hideAddReportModal,
    ] = useModalState();
    */

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
        data: reportsData,
        loading: loadingReports,
        // refetch: refetchReports,
    } = useQuery<ReportsQuery, ReportsQueryVariables>(REPORT_LIST, {
        variables: reportsVariables,
    });

    /*
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
    */

    const columns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ReportFields, string>;
            type userKeys = ExtractKeys<ReportFields, User>;

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
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ReportFields) => ({
                    value: datum[colName],
                }),
            });
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: ReportFields) => ({
                    value: datum[colName],
                }),
            });
            // eslint-disable-next-line max-len
            const userColumn = (colName: userKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ReportFields) => ({
                    value: datum[colName]?.fullName,
                }),
            });

            // Specific columns
            const nameColumn: TableColumn<ReportFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'name',
                title: 'Name',
                cellAsHeader: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'name'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.name,
                    route: route.report,
                    attrs: { reportId: datum.id },
                }),
            };

            /*
            const actionColumn:
            TableColumn<ReportFields, string, ActionProps, TableHeaderCellProps> = {
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
            */

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(userColumn, 'createdBy', 'Created By'),
                nameColumn,
                createColumn(stringColumn, 'analysis', 'Analysis'),
                createColumn(stringColumn, 'challenges', 'Challenges'),
                createColumn(stringColumn, 'methodology', 'Methodology'),
                createColumn(stringColumn, 'summary', 'Summary'),
                createColumn(stringColumn, 'significantUpdates', 'Significant Updates'),
                // actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            /*
            handleReportDelete,
            showAddReportModal,
            reportPermissions?.delete,
            reportPermissions?.change,
            */
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
                        {/* reportPermissions?.add && (
                            <Button
                                name={undefined}
                                onClick={showAddReportModal}
                                disabled={loadingReports}
                            >
                                Add Report
                            </Button>
                        ) */}
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
                    <Table
                        className={styles.table}
                        data={reportsData?.reportList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                )}
                {(loadingReports /* || deletingReport */) && <Loading absolute />}
                {!loadingReports && totalReportsCount <= 0 && (
                    <Message
                        message="No reports found."
                    />
                )}
                {/* shouldShowAddReportModal && (
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
                ) */}
            </Container>
        </div>
    );
}

export default Reports;
