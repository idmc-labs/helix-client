import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    Pager,
    Modal,
    Button,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createExternalLinkColumn,
    createDateColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import ParkedItemForm from '#components/forms/ParkedItemForm';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import { expandObject, hasNoData } from '#utils/common';
import useFilterState from '#hooks/useFilterState';
import useModalState from '#hooks/useModalState';
import { PurgeNull } from '#types';

import {
    ParkedItemListQuery,
    ParkedItemListQueryVariables,
    DeleteParkedItemMutation,
    DeleteParkedItemMutationVariables,
    ExportParkedItemMutation,
    ExportParkedItemMutationVariables,
} from '#generated/types';

import ParkedItemFilter from './ParkedItemFilter/index';
import ActionCell, { ActionProps } from './Action';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type ParkedItemFields = NonNullable<NonNullable<ParkedItemListQuery['parkedItemList']>['results']>[number];

const PARKING_LOT_LIST = gql`
    query ParkedItemList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ParkingLotFilterDataInputType,
    ) {
        parkedItemList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
            # check title_Unaccent_Icontains: $title,
        ) {
            totalCount
            page
            pageSize
            results {
                assignedTo {
                    id
                    fullName
                }
                country {
                    id
                    idmcShortName
                }
                comments
                createdAt
                createdBy {
                    id
                    fullName
                }
                id
                status
                statusDisplay
                title
                url
            }
        }
    }
`;

const PARKING_LOT_DELETE = gql`
    mutation DeleteParkedItem($id: ID!) {
        deleteParkedItem(id: $id) {
            errors
            result {
                id
            }
        }
    }
`;

const PARKED_ITEM_DOWNLOAD = gql`
    mutation ExportParkedItem(
        $filters: ParkingLotFilterDataInputType!,
    ) {
        exportParkedItem(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;

const keySelector = (item: ParkedItemFields) => item.id;

interface ParkedItemProps {
    className?: string;
    headerActions?: JSX.Element;

    assignedUser?: string;
    status?: string;
}

function ParkedItemTable(props: ParkedItemProps) {
    const {
        className,
        headerActions,

        assignedUser,
        status,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<ParkedItemListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        shouldShowAddParkedItemModal,
        editableParkedItemId,
        showAddParkedItemModal,
        hideAddParkedItemModal,
    ] = useModalState();

    const variables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<ParkedItemListQueryVariables['filters']>>(
                filter,
                {
                    statusIn: status ? [status] : undefined,
                    assignedToIn: assignedUser ? [assignedUser] : undefined,
                },
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
            status,
            assignedUser,
        ],
    );

    const {
        previousData,
        data: parkedItemData = previousData,
        loading: loadingParkedItem,
        refetch: refetchParkedItem,
        error: parkedItemError,
    } = useQuery<ParkedItemListQuery, ParkedItemListQueryVariables>(PARKING_LOT_LIST, {
        variables,
    });

    const [
        deleteParkedItem,
        { loading: deletingParkedItem },
    ] = useMutation<DeleteParkedItemMutation, DeleteParkedItemMutationVariables>(
        PARKING_LOT_DELETE,
        {
            onCompleted: (response) => {
                const { deleteParkedItem: deleteParkedItemRes } = response;
                if (!deleteParkedItemRes) {
                    return;
                }
                const { errors, result } = deleteParkedItemRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchParkedItem(variables);
                    notify({
                        children: 'Parked item deleted successfully!',
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

    const handleParkedItemCreate = useCallback(() => {
        refetchParkedItem(variables);
        hideAddParkedItemModal();
    }, [refetchParkedItem, variables, hideAddParkedItemModal]);

    const handleParkedItemDelete = useCallback(
        (id: string) => {
            deleteParkedItem({
                variables: { id },
            });
        },
        [deleteParkedItem],
    );

    const [
        exportParkedItems,
        { loading: exportingParkedItems },
    ] = useMutation<ExportParkedItemMutation, ExportParkedItemMutationVariables>(
        PARKED_ITEM_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportParkedItem: exportParkedItemsResponse } = response;
                if (!exportParkedItemsResponse) {
                    return;
                }
                const { errors, ok } = exportParkedItemsResponse;
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

    const handleExportTableData = useCallback(
        () => {
            exportParkedItems({
                variables: {
                    filters: variables.filters ?? {},
                },
            });
        },
        [exportParkedItems, variables],
    );

    const { user: userFromDomain } = useContext(DomainContext);
    const parkedItemPermissions = userFromDomain?.permissions?.parkeditem;

    const columns = useMemo(
        () => ([
            createDateColumn<ParkedItemFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ParkedItemFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            assignedUser
                ? undefined
                : createTextColumn<ParkedItemFields, string>(
                    'assigned_to__full_name',
                    'Assignee',
                    (item) => item.assignedTo?.fullName,
                    { sortable: true },
                ),
            createTextColumn<ParkedItemFields, string>(
                'title',
                'Title',
                (item) => item.title,
                { sortable: true },
                'large',
            ),
            status
                ? undefined
                : createTextColumn<ParkedItemFields, string>(
                    'status',
                    'Status',
                    (item) => item.statusDisplay,
                    { sortable: true },
                    'large',
                ),
            createExternalLinkColumn<ParkedItemFields, string>(
                'url',
                'URL',
                (item) => ({
                    title: item.url,
                    link: item.url,
                }),
                { sortable: true },
            ),
            createTextColumn<ParkedItemFields, string>(
                'comments',
                'Comments',
                (item) => item.comments,
                { sortable: true },
                'large',
            ),
            createCustomActionColumn<ParkedItemFields, string, ActionProps>(
                ActionCell,
                (_, datum) => ({
                    id: datum.id,
                    onDelete: parkedItemPermissions?.delete
                        ? handleParkedItemDelete
                        : undefined,
                    onEdit: parkedItemPermissions?.change
                        ? showAddParkedItemModal
                        : undefined,
                    parkedItemStatus: datum.status,
                    actionsHidden: false,
                }),
                'action',
                '',
                undefined,
                3,
            ),
        ].filter(isDefined)),
        [
            assignedUser,
            status,
            showAddParkedItemModal,
            handleParkedItemDelete,
            parkedItemPermissions?.delete,
            parkedItemPermissions?.change,
        ],
    );
    const totalParkedItemCount = parkedItemData?.parkedItemList?.totalCount ?? 0;

    return (
        <Container
            compactContent
            className={className}
            contentClassName={styles.content}
            heading="Parking Lot"
            headerActions={(
                <>
                    {headerActions}
                    {parkedItemPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddParkedItemModal}
                            disabled={loadingParkedItem}
                        >
                            Add Parked Item
                        </Button>
                    )}
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingParkedItems}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            description={(
                <ParkedItemFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                    status={status}
                    assignedUser={assignedUser}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalParkedItemCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {(loadingParkedItem || deletingParkedItem) && <Loading absolute />}
            {totalParkedItemCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={parkedItemData?.parkedItemList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {!loadingParkedItem && (
                <TableMessage
                    errored={!!parkedItemError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalParkedItemCount}
                    emptyMessage="No parked items found"
                    emptyMessageWithFilters="No parked items found with applied filters"
                    errorMessage="Could not fetch parked items"
                />
            )}
            {shouldShowAddParkedItemModal && (
                <Modal
                    onClose={hideAddParkedItemModal}
                    heading={editableParkedItemId ? 'Edit Parked Item' : 'Add Parked Item'}
                    size="large"
                    freeHeight
                >
                    <ParkedItemForm
                        id={editableParkedItemId}
                        onParkedItemCreate={handleParkedItemCreate}
                        onParkedItemFormCancel={hideAddParkedItemModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ParkedItemTable;
