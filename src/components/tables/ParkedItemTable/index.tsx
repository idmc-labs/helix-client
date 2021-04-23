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
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createExternalLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import ActionCell, { ActionProps } from './Action';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    ParkedItemListQuery,
    ParkedItemListQueryVariables,
    DeleteParkedItemMutation,
    DeleteParkedItemMutationVariables,
} from '#generated/types';

import ParkedItemForm from './ParkedItemForm';
import styles from './styles.css';

type ParkedItemFields = NonNullable<NonNullable<ParkedItemListQuery['parkedItemList']>['results']>[number];

const PARKING_LOT_LIST = gql`
    query ParkedItemList($ordering: String, $page: Int, $pageSize: Int, $title_Icontains: String, $statusIn: [String!], $assignedToIn: [String!]) {
        parkedItemList(ordering: $ordering, page: $page, pageSize: $pageSize, title_Icontains: $title_Icontains, statusIn: $statusIn, assignedToIn: $assignedToIn) {
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
                    idmcShortName
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
    mutation DeleteParkedItem($id: ID!) {
        deleteParkedItem(id: $id) {
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

const keySelector = (item: ParkedItemFields) => item.id;

interface ParkedItemProps {
    className?: string;
    headerActions?: JSX.Element;
    defaultUser?: string;
    defaultStatus?: string;
    detailsHidden?: boolean;
    searchHidden?: boolean;
    actionsHidden?: boolean;
}

function ParkedItemTable(props: ParkedItemProps) {
    const {
        className,
        headerActions,
        defaultStatus,
        defaultUser,
        detailsHidden,
        searchHidden,
        actionsHidden,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const { notify } = useContext(NotificationContext);

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
            title_Icontains: search,
            statusIn: defaultStatus ? [defaultStatus] : undefined,
            assignedToIn: defaultUser ? [defaultUser] : undefined,
        }),
        [ordering, page, pageSize, search, defaultStatus, defaultUser],
    );

    const {
        previousData,
        data: parkedItemData = previousData,
        loading: loadingParkedItem,
        refetch: refetchParkedItem,
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
                    notify({ children: 'Sorry, Parked item could not be deleted !' });
                }
                if (result) {
                    refetchParkedItem(variables);
                    notify({ children: 'Parked item deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleParkedItemCreate = React.useCallback(() => {
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

    const { user } = useContext(DomainContext);
    const parkedItemPermissions = user?.permissions?.parkeditem;

    const columns = useMemo(
        () => {
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ParkedItemFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: parkedItemPermissions?.delete ? handleParkedItemDelete : undefined,
                    onEdit: parkedItemPermissions?.change ? showAddParkedItemModal : undefined,
                    parkedItemStatus: datum.status,
                    actionsHidden,
                }),
            };

            return [
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
                detailsHidden
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
                    { cellAsHeader: true, sortable: true },
                ),
                detailsHidden
                    ? undefined
                    : createTextColumn<ParkedItemFields, string>(
                        'status',
                        'Status',
                        (item) => item.status,
                        { sortable: true },
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
                detailsHidden
                    ? undefined
                    : createTextColumn<ParkedItemFields, string>(
                        'comments',
                        'Comments',
                        (item) => item.comments,
                        { sortable: true },
                    ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            detailsHidden,
            actionsHidden,
            showAddParkedItemModal,
            handleParkedItemDelete,
            parkedItemPermissions?.delete,
            parkedItemPermissions?.change,
        ],
    );
    const totalParkedItemCount = parkedItemData?.parkedItemList?.totalCount ?? 0;

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
                    {!actionsHidden && parkedItemPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddParkedItemModal}
                            disabled={loadingParkedItem}
                        >
                            Add Parked Item
                        </Button>
                    )}
                </>
            )}
            footerContent={totalParkedItemCount > 0 && (
                <Pager
                    activePage={page}
                    itemsCount={totalParkedItemCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalParkedItemCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={parkedItemData?.parkedItemList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
                </SortContext.Provider>
            )}
            {(loadingParkedItem || deletingParkedItem) && <Loading absolute />}
            {!loadingParkedItem && totalParkedItemCount <= 0 && (
                <Message
                    message="No parked items found."
                />
            )}
            {shouldShowAddParkedItemModal && (
                <Modal
                    onClose={hideAddParkedItemModal}
                    heading={editableParkedItemId ? 'Edit Parked Item' : 'Add Parked Item'}
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
