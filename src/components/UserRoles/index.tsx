import React, { useState, useMemo, useCallback, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    TextInput,
    SortContext,
    createYesNoColumn,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import { IoIosSearch } from 'react-icons/io';
import { createTextColumn } from '#components/tableHelpers';

import {
    UserListQuery,
    ToggleUserActiveStatusMutation,
    ToggleUserActiveStatusMutationVariables,
    UserListQueryVariables,
} from '#generated/types';
import useModalState from '#hooks/useModalState';

import Message from '#components/Message';
import NotificationContext from '#components/NotificationContext';
import Container from '#components/Container';
import Loading from '#components/Loading';

import ActionCell, { ActionProps } from './UserActions';
import UserRoleForm from './UserRoleForm';

import styles from './styles.css';

// TODO: Filter based on other fields as well
const GET_USERS_LIST = gql`
query UserList($ordering: String, $page: Int, $pageSize: Int, $fullName: String) {
    users(includeInactive: true, ordering: $ordering, page: $page, pageSize: $pageSize, fullName: $fullName) {
        results {
            dateJoined
            isActive
            id
            fullName
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
                role
                email
            }
            errors
        }
    }
`;

const defaultSorting = {
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

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [userSearch, setUserSearch] = useState<string | undefined>();

    const usersVariables = useMemo(
        (): UserListQueryVariables => ({
            ordering,
            page,
            pageSize,
            fullName: userSearch,
        }),
        [ordering, page, pageSize, userSearch],
    );

    const [
        userRoleFormOpened,
        editableUserId,
        showUserRoleForm,
        hideUserRoleForm,
    ] = useModalState();

    const { notify } = useContext(NotificationContext);

    const {
        previousData,
        data: userList = previousData,
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
                createDateColumn<UserRolesField, string>(
                    'date_joined',
                    'Date Joined',
                    (item) => item.dateJoined,
                    { sortable: true },
                ),
                createTextColumn<UserRolesField, string>(
                    'full_name',
                    'Name',
                    (item) => item.fullName,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<UserRolesField, string>(
                    'email',
                    'Email',
                    (item) => item.email,
                    { sortable: true },
                ),
                createTextColumn<UserRolesField, string>(
                    'role',
                    'Role',
                    (item) => item.role,
                ),
                createYesNoColumn<UserRolesField, string>(
                    'is_active',
                    'Active',
                    (item) => item.isActive,
                    { sortable: true },
                ),
                actionColumn,
            ];
        },
        [
            handleToggleUserActiveStatus,
            showUserRoleForm,
        ],
    );

    const totalUsersCount = userList?.users?.totalCount ?? 0;

    return (
        <Container
            heading="Users"
            contentClassName={styles.content}
            className={_cs(className, styles.userContainer)}
            headerActions={(
                <TextInput
                    icons={<IoIosSearch />}
                    name="search"
                    value={userSearch}
                    placeholder="Search"
                    onChange={setUserSearch}
                />
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalUsersCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalUsersCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={userList?.users?.results}
                        keySelector={keySelector}
                        columns={usersColumn}
                    />
                </SortContext.Provider>
            )}
            {loadingUsers && <Loading absolute />}
            {!loadingUsers && totalUsersCount <= 0 && (
                <Message
                    message="No users found."
                />
            )}
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
