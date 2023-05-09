import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    Button,
    Modal,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createActionColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import CrisisForm from '#components/forms/CrisisForm';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';
import useDebouncedValue from '#hooks/useDebouncedValue';

import {
    CrisesQuery,
    CrisesQueryVariables,
    DeleteCrisisMutation,
    DeleteCrisisMutationVariables,
    ExportCrisesMutation,
    ExportCrisesMutationVariables,
} from '#generated/types';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import route from '#config/routes';

import CrisesFilter from './CrisesFilter/index';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type CrisisFields = NonNullable<NonNullable<CrisesQuery['crisisList']>['results']>[number];

const CRISIS_LIST = gql`
    query Crises(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $name: String,
        $crisisTypes: [String!],
        $createdByIds: [ID!],
        $events: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
    ) {
        crisisList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            name: $name,
            crisisTypes: $crisisTypes,
            createdByIds: $createdByIds,
            events: $events
            startDate_Gte: $startDate_Gte,
            endDate_Lte: $endDate_Lte,
        ) {
            totalCount
            pageSize
            page
            results {
                name
                id
                crisisType
                crisisTypeDisplay
                createdAt
                createdBy {
                    id
                    fullName
                }
                eventCount
                countries {
                    id
                    idmcShortName
                }
                startDate
                endDate
                totalStockIdpFigures
                totalFlowNdFigures
                reviewCount {
                    reviewApprovedCount
                    reviewInProgressCount
                    reviewReRequestCount
                    reviewNotStartedCount
                }
            }
        }
    }
`;

const CRISIS_DELETE = gql`
    mutation DeleteCrisis($id: ID!) {
        deleteCrisis(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const CRISIS_DOWNLOAD = gql`
    mutation ExportCrises(
        $name: String,
        $crisisTypes: [String!],
        $createdByIds: [ID!],
        $events: [ID!],
        $startDate_Gte: Date,
        $endDate_Lte: Date,
    ) {
        exportCrises(
            name: $name,
            crisisTypes: $crisisTypes,
            createdByIds: $createdByIds,
            events: $events
            startDate_Gte: $startDate_Gte,
            endDate_Lte: $endDate_Lte,
        ) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'createdAt',
    direction: 'dsc',
};

const keySelector = (item: CrisisFields) => item.id;

interface CrisesProps {
    className?: string;
}

function Crises(props: CrisesProps) {
    const { className } = props;

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

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const [
        crisesQueryFilters,
        setCrisesQueryFilters,
    ] = useState<PurgeNull<CrisesQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<CrisesQueryVariables>) => {
            setCrisesQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            ...crisesQueryFilters,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            crisesQueryFilters,
        ],
    );

    const {
        previousData,
        data: crisesData = previousData,
        loading: loadingCrises,
        refetch: refetchCrises,
    } = useQuery<CrisesQuery, CrisesQueryVariables>(CRISIS_LIST, {
        variables: crisesVariables,
    });

    const [
        deleteCrisis,
        { loading: deletingCrisis },
    ] = useMutation<DeleteCrisisMutation, DeleteCrisisMutationVariables>(
        CRISIS_DELETE,
        {
            onCompleted: (response) => {
                const { deleteCrisis: deleteCrisisRes } = response;
                if (!deleteCrisisRes) {
                    return;
                }
                const { errors, result } = deleteCrisisRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchCrises(crisesVariables);
                    notify({
                        children: 'Crisis deleted successfully!',
                        variant: 'success',
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

    const [
        exportCrises,
        { loading: exportingCrisis },
    ] = useMutation<ExportCrisesMutation, ExportCrisesMutationVariables>(
        CRISIS_DOWNLOAD,
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

    const handleCrisisCreate = React.useCallback(() => {
        refetchCrises(crisesVariables);
        hideAddCrisisModal();
    }, [refetchCrises, crisesVariables, hideAddCrisisModal]);

    const handleCrisisDelete = useCallback(
        (id: string) => {
            deleteCrisis({
                variables: { id },
            });
        },
        [deleteCrisis],
    );

    const handleExportTableData = useCallback(
        () => {
            exportCrises({
                variables: crisesQueryFilters,
            });
        },
        [exportCrises, crisesQueryFilters],
    );

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const progressColumn: TableColumn<CrisisFields, string, StackedProgressProps, TableHeaderCellProps> = {
                id: 'progress',
                title: 'Progress',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: StackedProgressCell,
                cellRendererParams: (_, item) => ({
                    approved: item.reviewCount?.reviewApprovedCount,
                    inProgress: item.reviewCount?.reviewInProgressCount,
                    notStarted: item.reviewCount?.reviewNotStartedCount,
                    reRequested: item.reviewCount?.reviewReRequestCount,
                }),
            };

            return [
                createDateColumn<CrisisFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<CrisisFields, string>(
                    'created_by__full_name',
                    'Created by',
                    (item) => item.createdBy?.fullName,
                    { sortable: true },
                ),
                createLinkColumn<CrisisFields, string>(
                    'name',
                    'Name',
                    (item) => ({
                        title: item.name,
                        attrs: { crisisId: item.id },
                        ext: undefined,
                    }),
                    route.crisis,
                    { sortable: true },
                ),
                createDateColumn<CrisisFields, string>(
                    'start_date',
                    'Start Date',
                    (item) => item.startDate,
                    { sortable: true },
                ),
                createDateColumn<CrisisFields, string>(
                    'end_date',
                    'End Date',
                    (item) => item.endDate,
                    { sortable: true },
                ),
                createTextColumn<CrisisFields, string>(
                    'countries__idmc_short_name',
                    'Countries',
                    (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                    { sortable: true },
                    'large',
                ),
                createTextColumn<CrisisFields, string>(
                    'crisis_type',
                    'Cause',
                    (item) => item.crisisTypeDisplay,
                    { sortable: true },
                ),
                createNumberColumn<CrisisFields, string>(
                    'event_count',
                    'Events',
                    (item) => item.eventCount,
                    { sortable: true },
                ),
                createNumberColumn<CrisisFields, string>(
                    'total_flow_nd_figures',
                    'Internal Displacements',
                    (item) => item.totalFlowNdFigures,
                    { sortable: true },
                ),
                createNumberColumn<CrisisFields, string>(
                    'total_stock_idp_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                    { sortable: true },
                ),
                progressColumn,
                createActionColumn<CrisisFields, string>(
                    'action',
                    '',
                    (item) => ({
                        id: item.id,
                        deleteTitle: 'crisis',
                        onDelete: crisisPermissions?.delete ? handleCrisisDelete : undefined,
                        onEdit: crisisPermissions?.change ? showAddCrisisModal : undefined,
                    }),
                    undefined,
                    2,
                ),
            ];
        },
        [
            handleCrisisDelete,
            showAddCrisisModal,
            crisisPermissions?.delete,
            crisisPermissions?.change,
        ],
    );

    const totalCrisesCount = crisesData?.crisisList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.crises, className)}>
            <PageHeader
                title="Crises"
            />
            <Container
                compactContent
                heading="Crises"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <>
                        {crisisPermissions?.add && (
                            <Button
                                name={undefined}
                                onClick={showAddCrisisModal}
                                disabled={loadingCrises}
                            >
                                Add Crisis
                            </Button>
                        )}
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
                description={(
                    <CrisesFilter
                        onFilterChange={onFilterChange}
                    />
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={totalCrisesCount}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={handlePageSizeChange}
                    />
                )}
            >
                {totalCrisesCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={crisesData?.crisisList?.results}
                            keySelector={keySelector}
                            columns={columns}
                            resizableColumn
                            fixedColumnWidth
                        />
                    </SortContext.Provider>
                )}
                {(loadingCrises || deletingCrisis) && <Loading absolute />}
                {!loadingCrises && totalCrisesCount <= 0 && (
                    <Message
                        message="No crises found."
                    />
                )}
                {shouldShowAddCrisisModal && (
                    <Modal
                        onClose={hideAddCrisisModal}
                        heading={editableCrisisId ? 'Edit Crisis' : 'Add Crisis'}
                        size="large"
                        freeHeight
                    >
                        <CrisisForm
                            id={editableCrisisId}
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={hideAddCrisisModal}
                        />
                    </Modal>
                )}
            </Container>
        </div>
    );
}

export default Crises;
