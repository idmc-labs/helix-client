import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
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
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import ParkingLotForm from '#components/ParkingLotForm';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import StringCell from '#components/tableHelpers/StringCell';
import DateCell from '#components/tableHelpers/Date';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import { ExtractKeys } from '#types';

import {
    ParkingLotListQuery,
    ParkingLotListQueryVariables,
    DeleteParkingLotMutation,
    DeleteParkingLotMutationVariables,
} from '#generated/types';

import styles from './styles.css';

type ParkingLotFields = NonNullable<NonNullable<ParkingLotListQuery['parkingLotList']>['results']>[number];

const PARKING_LOT_LIST = gql`
    query ParkingLotList($ordering: String, $page: Int, $pageSize: Int, $title_Icontains: String, $statusIn: [String], $assignedToIn: [String]) {
        parkingLotList(ordering: $ordering, page: $page, pageSize: $pageSize, title_Icontains: $title_Icontains, statusIn: $statusIn, assignedToIn: $assignedToIn) {
            totalCount
            page
            pageSize
            results {
                assignedTo {
                    id
                    email
                    fullName
                }
                country {
                    id
                    name
                }
                comments
                createdAt
                createdBy {
                    id
                    email
                    fullName
                }
                id
                status
                title
                url
            }
        }
    }
`;

const PARKING_LOT_DELETE = gql`
    mutation DeleteParkingLot($id: ID!) {
        deleteParkingLot(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const defaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

const keySelector = (item: ParkingLotFields) => item.id;

interface ParkingLotProps {
    className?: string;
    headerActions?: JSX.Element;
    defaultUser?: string;
    defaultStatus?: string;
    detailsHidden?: boolean;
    searchHidden?: boolean;
    actionsHidden?: boolean;
}

function ParkingLotTable(props: ParkingLotProps) {
    const {
        className,
        headerActions,
        defaultStatus,
        defaultUser,
        detailsHidden,
        searchHidden,
        actionsHidden,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;
    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddParkingLotModal,
        editableParkingLotId,
        showAddParkingLotModal,
        hideAddParkingLotModal,
    ] = useModalState();

    const variables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            title_Icontains: search,
            status: defaultStatus ? [defaultStatus] : undefined,
            assignedToIn: defaultUser ? [defaultUser] : undefined,
        }),
        [ordering, page, pageSize, search, defaultStatus, defaultUser],
    );

    const {
        data: parkingLotData,
        loading: loadingParkingLot,
        refetch: refetchParkingLot,
    } = useQuery<ParkingLotListQuery, ParkingLotListQueryVariables>(PARKING_LOT_LIST, {
        variables,
    });

    const [
        deleteParkingLot,
        { loading: deletingParkingLot },
    ] = useMutation<DeleteParkingLotMutation, DeleteParkingLotMutationVariables>(
        PARKING_LOT_DELETE,
        {
            onCompleted: (response) => {
                const { deleteParkingLot: deleteParkingLotRes } = response;
                if (!deleteParkingLotRes) {
                    return;
                }
                const { errors, result } = deleteParkingLotRes;
                if (errors) {
                    notify({ children: 'Sorry, Parked item could not be deleted !' });
                }
                if (result) {
                    refetchParkingLot(variables);
                    notify({ children: 'Parked item deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleParkingLotCreate = React.useCallback(() => {
        refetchParkingLot(variables);
        hideAddParkingLotModal();
    }, [refetchParkingLot, variables, hideAddParkingLotModal]);

    const handleParkingLotDelete = useCallback(
        (id: string) => {
            deleteParkingLot({
                variables: { id },
            });
        },
        [deleteParkingLot],
    );

    const { user } = useContext(DomainContext);
    const parkingLotPermissions = user?.permissions?.parkinglot;

    const columns = useMemo(
        () => {
            interface User {
                id: string;
                email: string;
                fullName?: string | null;
            }

            type stringKeys = ExtractKeys<ParkingLotFields, string>;
            type userKeys = ExtractKeys<ParkingLotFields, User>;

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
                cellAsHeader: true,
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ParkingLotFields) => ({
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
                cellRendererParams: (_: string, datum: ParkingLotFields) => ({
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
                cellRendererParams: (_: string, datum: ParkingLotFields) => ({
                    value: datum[colName]?.fullName,
                }),
            });

            // Specific columns

            // eslint-disable-next-line max-len
            const urlColumn: TableColumn<ParkingLotFields, string, ExternalLinkProps, TableHeaderCellProps> = {
                id: 'viewUrl',
                title: 'URL',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: true,
                },
                cellRenderer: ExternalLinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.url,
                    link: datum.url,
                }),
            };

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ParkingLotFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: parkingLotPermissions?.delete ? handleParkingLotDelete : undefined,
                    onEdit: parkingLotPermissions?.change ? showAddParkingLotModal : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(userColumn, 'createdBy', 'Created By'),
                !detailsHidden ? createColumn(userColumn, 'assignedTo', 'Assignee') : undefined,
                createColumn(stringColumn, 'title', 'Title', true),
                !detailsHidden ? createColumn(stringColumn, 'status', 'Status') : undefined,
                urlColumn,
                !detailsHidden ? createColumn(stringColumn, 'comments', 'Comments') : undefined,
                !actionsHidden ? actionColumn : undefined,
            ].filter(isDefined);
        },
        [
            detailsHidden,
            actionsHidden,
            showAddParkingLotModal,
            setSortState,
            validSortState,
            handleParkingLotDelete,
            parkingLotPermissions?.delete,
            parkingLotPermissions?.change,
        ],
    );
    const totalParkingLotCount = parkingLotData?.parkingLotList?.totalCount ?? 0;

    return (
        <Container
            className={className}
            contentClassName={styles.content}
            heading="Parking Lot"
            headerActions={(
                <>
                    {headerActions}
                    {!searchHidden && (
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
                    )}
                    {!actionsHidden && parkingLotPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddParkingLotModal}
                            disabled={loadingParkingLot}
                        >
                            Add Parked Item
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalParkingLotCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalParkingLotCount > 0 && (
                <Table
                    className={styles.table}
                    data={parkingLotData?.parkingLotList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
            )}
            {(loadingParkingLot || deletingParkingLot) && <Loading absolute />}
            {!loadingParkingLot && totalParkingLotCount <= 0 && (
                <Message
                    message="No parked items found."
                />
            )}
            {shouldShowAddParkingLotModal && (
                <Modal
                    onClose={hideAddParkingLotModal}
                    heading={editableParkingLotId ? 'Edit Parked Item' : 'Add Parked Item'}
                >
                    <ParkingLotForm
                        id={editableParkingLotId}
                        onParkingLotCreate={handleParkingLotCreate}
                        onParkingLotFormCancel={hideAddParkingLotModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ParkingLotTable;
