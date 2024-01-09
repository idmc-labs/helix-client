import React, { useMemo, useCallback, useContext } from 'react';
import { isDefined } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    Modal,
    ConfirmButton,
    Button,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createDateColumn,
    createNumberColumn,
    createActionColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import Loading from '#components/Loading';
import CrisisForm, { CrisisFormProps } from '#components/forms/CrisisForm';
import StackedProgressCell, { StackedProgressProps } from '#components/tableHelpers/StackedProgress';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import useModalState from '#hooks/useModalState';
import {
    CrisesQuery,
    CrisesQueryVariables,
    DeleteCrisisMutation,
    DeleteCrisisMutationVariables,
    ExportCrisesMutation,
    ExportCrisesMutationVariables,
} from '#generated/types';

import route from '#config/routes';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type CrisisFields = NonNullable<NonNullable<CrisesQuery['crisisList']>['results']>[number];

export const CRISIS_LIST = gql`
    query Crises(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: CrisisFilterDataInputType,
    ) {
        crisisList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
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

const CRISIS_DOWNLOAD = gql`
    mutation ExportCrises(
        $filters: CrisisFilterDataInputType!,
    ) {
        exportCrises(
            filters: $filters,
        ) {
            errors
            ok
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

const keySelector = (item: CrisisFields) => item.id;

interface Props {
    className?: string;
    filters: CrisesQueryVariables | undefined;

    hiddenColumns?: ('countries' | 'createdBy')[];
    disabledFields?: ('countries')[];
    defaultFormValue?: CrisisFormProps['defaultFormValue'];

    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useCrisisTable(props: Props) {
    const {
        className,
        filters,

        hiddenColumns = [],
        disabledFields,
        defaultFormValue,

        page,
        pageSize,
        onPageChange,
        onPageSizeChange,
        pagerPageControlDisabled,
    } = props;

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

    const { user } = useContext(DomainContext);

    const crisisPermissions = user?.permissions?.crisis;

    const {
        previousData,
        data: crisesData = previousData,
        loading: loadingCrises,
        refetch: refetchCrises,
    } = useQuery<CrisesQuery, CrisesQueryVariables>(CRISIS_LIST, {
        variables: filters,
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
                    refetchCrises(filters);
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
        { loading: exportingTableData },
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

    const handleCrisisCreate = useCallback(() => {
        refetchCrises(filters);
        hideAddCrisisModal();
    }, [
        refetchCrises,
        filters,
        hideAddCrisisModal,
    ]);

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
                variables: {
                    filters: filters?.filters ?? {},
                },
            });
        },
        [exportCrises, filters],
    );

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
                hiddenColumns.includes('createdBy')
                    ? undefined
                    : createTextColumn<CrisisFields, string>(
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
                hiddenColumns.includes('countries')
                    ? undefined
                    : createTextColumn<CrisisFields, string>(
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
            ].filter(isDefined);
        },
        [
            handleCrisisDelete,
            showAddCrisisModal,
            crisisPermissions?.delete,
            crisisPermissions?.change,
            hiddenColumns,
        ],
    );
    const totalCrisesCount = crisesData?.crisisList?.totalCount ?? 0;

    return {
        exportButton: (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData}
            >
                Export
            </ConfirmButton>
        ),
        addButton: (
            crisisPermissions?.add && (
                <Button
                    name={undefined}
                    onClick={showAddCrisisModal}
                >
                    Add Crisis
                </Button>
            )
        ),
        pager: (
            <Pager
                activePage={page}
                itemsCount={totalCrisesCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={onPageChange}
                onItemsPerPageChange={onPageSizeChange}
                itemsPerPageControlHidden={pagerPageControlDisabled}
            />
        ),
        table: (
            <>
                {totalCrisesCount > 0 && (
                    <Table
                        className={className}
                        data={crisesData?.crisisList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
                {(
                    loadingCrises
                    || deletingCrisis
                ) && <Loading absolute />}
                {!loadingCrises && totalCrisesCount <= 0 && (
                    <Message
                        message="No crises found."
                    />
                )}
                {shouldShowAddCrisisModal && (
                    <Modal
                        onClose={hideAddCrisisModal}
                        // eslint-disable-next-line no-nested-ternary
                        heading={editableCrisisId
                            ? 'Edit Crisis'
                            : 'Add Crisis'}
                        size="large"
                        freeHeight
                    >
                        <CrisisForm
                            id={editableCrisisId}
                            onCrisisCreate={handleCrisisCreate}
                            onCrisisFormCancel={hideAddCrisisModal}
                            defaultFormValue={defaultFormValue}
                            disabledFields={disabledFields}
                        />
                    </Modal>
                )}
            </>
        ),
    };
}

export default useCrisisTable;
