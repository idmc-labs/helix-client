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
    createDateColumn,
    SortContext,
    ConfirmButton,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createActionColumn,
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
                createdAt
                createdBy {
                    id
                    fullName
                }
                events {
                    totalCount
                }
                countries {
                    id
                    idmcShortName
                }
                startDate
                endDate
                totalStockIdpFigures
                totalFlowNdFigures
                reviewCount {
                    reviewCompleteCount
                    signedOffCount
                    toBeReviewedCount
                    underReviewCount
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
    mutation ExportCrises($name: String, $crisisTypes: [String!], $countries: [String!]){
        exportCrises(name: $name, crisisTypes: $crisisTypes, countries: $countries) {
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
    // const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);
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

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...crisesQueryFilters,
        }),
        [ordering, page, pageSize, crisesQueryFilters],
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
                    notify({ children: 'Crisis deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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
                cellRendererParams: (_, datum) => ({
                    signedOff: datum.reviewCount?.signedOffCount,
                    reviewCompleted: datum.reviewCount?.reviewCompleteCount,
                    underReview: datum.reviewCount?.underReviewCount,
                    toBeReviewed: datum.reviewCount?.toBeReviewedCount,
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
                    'countries',
                    'Countries',
                    (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                    { sortable: true },
                ),
                createNumberColumn<CrisisFields, string>(
                    'event_count',
                    'Events',
                    (item) => item.events?.totalCount,
                ),
                createTextColumn<CrisisFields, string>(
                    'crisis_type',
                    'Cause',
                    (item) => item.crisisType,
                    { sortable: true },
                ),
                createNumberColumn<CrisisFields, string>(
                    'total_flow_nd_figures',
                    'New Displacements',
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
                        onDelete: crisisPermissions?.delete ? handleCrisisDelete : undefined,
                        onEdit: crisisPermissions?.change ? showAddCrisisModal : undefined,
                    }),
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
                heading="Crises"
                className={styles.container}
                contentClassName={styles.content}
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
                        {crisisPermissions?.add && (
                            <Button
                                name={undefined}
                                onClick={showAddCrisisModal}
                                disabled={loadingCrises}
                            >
                                Add Crisis
                            </Button>
                        )}
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
                        onItemsPerPageChange={setPageSize}
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
