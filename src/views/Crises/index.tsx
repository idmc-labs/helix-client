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
    Button,
    Modal,
    createNumberColumn,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import CrisisForm from '#components/forms/CrisisForm';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    CrisesQuery,
    CrisesQueryVariables,
    DeleteCrisisMutation,
    DeleteCrisisMutationVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

type CrisisFields = NonNullable<NonNullable<CrisesQuery['crisisList']>['results']>[number];

const CRISIS_LIST = gql`
    query Crises($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        crisisList(ordering: $ordering, page: $page, pageSize: $pageSize, name: $name) {
            totalCount
            pageSize
            page
            results {
                name
                id
                crisisType
                crisisNarrative
                createdAt
                events {
                    totalCount
                }
                countries {
                    id
                    name
                }
                startDate
                endDate
                totalStockIdpFigures
                totalFlowNdFigures
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

const defaultSorting = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
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

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);
    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

    const crisesVariables = useMemo(
        (): CrisesQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
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
                    notify({ children: 'Sorry, Crisis could not be deleted!' });
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

    const { user } = useContext(DomainContext);
    const crisisPermissions = user?.permissions?.crisis;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<CrisisFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: crisisPermissions?.delete ? handleCrisisDelete : undefined,
                    onEdit: crisisPermissions?.change ? showAddCrisisModal : undefined,
                }),
            };

            return [
                createDateColumn<CrisisFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
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
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<CrisisFields, string>(
                    'crisis_type',
                    'Type',
                    (item) => item.crisisType,
                    { sortable: true },
                ),
                createTextColumn<CrisisFields, string>(
                    'crisis_narrative',
                    'Narrative',
                    (item) => item.crisisNarrative,
                    { sortable: true },
                ),
                createTextColumn<CrisisFields, string>(
                    'countries',
                    'Countries',
                    (item) => item.countries.map((c) => c.name).join(', '),
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
                createNumberColumn<CrisisFields, string>(
                    'event_count',
                    'Events',
                    (item) => item.events?.totalCount,
                ),
                createNumberColumn<CrisisFields, string>(
                    'total_stock_figures',
                    'No. of IDPs',
                    (item) => item.totalStockIdpFigures,
                ),
                createNumberColumn<CrisisFields, string>(
                    'total_flow_figures',
                    'New Displacements',
                    (item) => item.totalFlowNdFigures,
                ),
                actionColumn,
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
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
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
