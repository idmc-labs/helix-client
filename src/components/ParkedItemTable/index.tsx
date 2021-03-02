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
import ParkedItemForm from '#components/ParkedItemForm';
import ExternalLinkCell, { ExternalLinkProps } from '#components/tableHelpers/ExternalLink';
import ActionCell, { ActionProps } from './Action';
import StringCell from '#components/tableHelpers/StringCell';
import DateCell from '#components/tableHelpers/Date';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import { ExtractKeys } from '#types';

import {
    ParkedItemListQuery,
    ParkedItemListQueryVariables,
    DeleteParkedItemMutation,
    DeleteParkedItemMutationVariables,
} from '#generated/types';

import styles from './styles.css';

type ParkedItemFields = NonNullable<NonNullable<ParkedItemListQuery['parkedItemList']>['results']>[number];

const PARKING_LOT_LIST = gql`
    query ParkedItemList($ordering: String, $page: Int, $pageSize: Int, $title_Icontains: String, $statusIn: [String], $assignedToIn: [String]) {
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
    mutation DeleteParkedItem($id: ID!) {
        deleteParkedItem(id: $id) {
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
            interface User {
                id: string;
                email: string;
                fullName?: string | null;
            }

            type stringKeys = ExtractKeys<ParkedItemFields, string>;
            type userKeys = ExtractKeys<ParkedItemFields, User>;

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
                cellRendererParams: (_: string, datum: ParkedItemFields) => ({
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
                cellRendererParams: (_: string, datum: ParkedItemFields) => ({
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
                cellRendererParams: (_: string, datum: ParkedItemFields) => ({
                    value: datum[colName]?.fullName,
                }),
            });

            // Specific columns

            // eslint-disable-next-line max-len
            const urlColumn: TableColumn<ParkedItemFields, string, ExternalLinkProps, TableHeaderCellProps> = {
                id: 'viewUrl',
                title: 'URL',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ExternalLinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.url,
                    link: datum.url,
                }),
            };

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
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(userColumn, 'createdBy', 'Created By'),
                !detailsHidden ? createColumn(userColumn, 'assignedTo', 'Assignee') : undefined,
                createColumn(stringColumn, 'title', 'Title', true),
                !detailsHidden ? createColumn(stringColumn, 'status', 'Status') : undefined,
                urlColumn,
                !detailsHidden ? createColumn(stringColumn, 'comments', 'Comments') : undefined,
                actionColumn,
            ].filter(isDefined);
        },
        [
            detailsHidden,
            actionsHidden,
            showAddParkedItemModal,
            setSortState,
            validSortState,
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
            footerContent={(
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
                <Table
                    className={styles.table}
                    data={parkedItemData?.parkedItemList?.results}
                    keySelector={keySelector}
                    columns={columns}
                />
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
