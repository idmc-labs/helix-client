import React, { useState, useMemo, useCallback, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    createColumn,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
} from '@togglecorp/toggle-ui';

import { ExtractKeys } from '#types';
import {
    UserListQuery,
    ToggleUserActiveStatusMutation,
    ToggleUserActiveStatusMutationVariables,
    UserListQueryVariables,
} from '#generated/types';
import useModalState from '#hooks/useModalState';

import NotificationContext from '#components/NotificationContext';
import Container from '#components/Container';
import DateCell from '#components/tableHelpers/Date';
import YesNoCell from '#components/tableHelpers/YesNo';
import Loading from '#components/Loading';

import ActionCell, { ActionProps } from './UserActions';
import UserRoleForm from './UserRoleForm';

import styles from './styles.css';

// TODO: Filter based on other fields as well
const GET_USERS_LIST = gql`
query UserList($ordering: String, $page: Int, $pageSize: Int) {
    users(ordering: $ordering, page: $page, pageSize: $pageSize) {
        results {
            dateJoined
            isActive
            id
            fullName
            username
            role
            email
        }
        totalCount
        pageSize
        page
        }
    }
`;

const TOGGLE_USER_ACTIVE_STATUS = gql`
    mutation ToggleUserActiveStatus($id: ID!, $isActive: Boolean) {
        updateUser(data: {id: $id, isActive: $isActive}) {
            result {
                dateJoined
                isActive
                id
                fullName
                username
                role
                email
            }
            errors
        }
    }
`;

const defaultSortState = {
    name: 'dateJoined',
    direction: TableSortDirection.dsc,
};

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

const keySelector = (item: UserRolesField) => item.id;

interface UserRolesProps {
    className? : string;
}

function UserRoles(props: UserRolesProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const usersVariables = useMemo(
        (): UserListQueryVariables => ({
            ordering,
            page,
            pageSize,
        }),
        [ordering, page, pageSize],
    );

    const [
        userRoleFormOpened,
        editableUserId,
        showUserRoleForm,
        hideUserRoleForm,
    ] = useModalState();

    const { notify } = useContext(NotificationContext);

    const {
        data: userList,
        loading: usersLoading,
    } = useQuery<UserListQuery>(GET_USERS_LIST, {
        variables: usersVariables,
    });

    const [
        toggleUserActiveStatus,
        { loading: updateLoading },
    ] = useMutation<ToggleUserActiveStatusMutation, ToggleUserActiveStatusMutationVariables>(
        TOGGLE_USER_ACTIVE_STATUS, {
            onCompleted: (response) => {
                const { updateUser: updateUserRes } = response;
                if (!updateUserRes) {
                    return;
                }
                const { errors, result } = updateUserRes;
                if (errors) {
                    notify({ children: 'Sorry, user active status could not be updated!' });
                }
                if (result) {
                    notify({ children: 'User active status updated successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const loadingUsers = usersLoading || updateLoading;

    const handleToggleUserActiveStatus = useCallback(
        (id: string, newActiveStatus: boolean) => {
            toggleUserActiveStatus({
                variables: {
                    id,
                    isActive: newActiveStatus,
                },
            });
        },
        [toggleUserActiveStatus],
    );

    const usersColumn = useMemo(
        () => {
            type stringKeys = ExtractKeys<UserRolesField, string>;
            type booleanKeys = ExtractKeys<UserRolesField, boolean>;
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
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: UserRolesField) => ({
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
                cellRendererParams: (_: string, datum: UserRolesField) => ({
                    value: datum[colName],
                }),
            });
            const booleanColumn = (colName: booleanKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: YesNoCell,
                cellRendererParams: (_: string, datum: UserRolesField) => ({
                    value: datum[colName],
                }),
            });

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<UserRolesField, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: 'Actions',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    activeStatus: datum.isActive,
                    onToggleUserActiveStatus: handleToggleUserActiveStatus,
                    onShowUserRoleForm: showUserRoleForm,
                }),
            };

            return [
                createColumn(dateColumn, 'dateJoined', 'Date Joined'),
                createColumn(stringColumn, 'username', 'Username', true),
                createColumn(stringColumn, 'fullName', 'Name'),
                createColumn(stringColumn, 'email', 'Email'),
                createColumn(stringColumn, 'role', 'Role'),
                createColumn(booleanColumn, 'isActive', 'Active'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            handleToggleUserActiveStatus,
            showUserRoleForm,
        ],
    );

    return (
        <Container
            heading="Users"
            className={_cs(className, styles.userContainer)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={userList?.users?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            <Table
                className={styles.table}
                data={userList?.users?.results}
                keySelector={keySelector}
                columns={usersColumn}
            />
            {loadingUsers && <Loading />}
            {userRoleFormOpened && editableUserId && (
                <Modal
                    heading="Edit User"
                    onClose={hideUserRoleForm}
                >
                    <UserRoleForm
                        userId={editableUserId}
                        onUserFormClose={hideUserRoleForm}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default UserRoles;
