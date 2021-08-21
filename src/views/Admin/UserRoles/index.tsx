import React, { useState, useMemo, useCallback, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    SortContext,
    createYesNoColumn,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import { createTextColumn } from '#components/tableHelpers';
import { PurgeNull } from '#types';

import {
    UserListQuery,
    UserListQueryVariables,
    ToggleUserActiveStatusMutation,
    ToggleUserActiveStatusMutationVariables,
    ToggleUserRoleStatusMutation,
    ToggleUserRoleStatusMutationVariables,
} from '#generated/types';

import Message from '#components/Message';
import NotificationContext from '#components/NotificationContext';
import Container from '#components/Container';
import Loading from '#components/Loading';

import ActionCell, { ActionProps } from './UserActions';
import UserFilter from './UserFilter/index';
import styles from './styles.css';

const GET_USERS_LIST = gql`
query UserList(
    $ordering: String,
    $page: Int,
    $pageSize: Int,
    $fullName: String,
    $roleIn: [String!],
    $isActive: Boolean,
    ) {
    users(
       includeInactive: true,
       ordering: $ordering,
       page: $page,
       pageSize: $pageSize,
       fullName: $fullName,
       roleIn: $roleIn,
       isActive: $isActive,
    ) {
        results {
            dateJoined
            isActive
            id
            fullName
            highestRole
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
                isActive
                id
            }
            errors
        }
    }
`;

const TOGGLE_USER_ROLE_STATUS = gql`
    mutation ToggleUserRoleStatus($user: ID!, $register: Boolean!) {
        updateAdminPortfolio(data: {user: $user, register: $register}) {
            errors
            ok
            result {
                highestRole
                id
            }
        }
    }
`;

const defaultSorting = {
    name: 'date_joined',
    direction: 'dsc',
};

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

const keySelector = (item: UserRolesField) => item.id;

interface UserRolesProps {
    className?: string;
}

function UserRoles(props: UserRolesProps) {
    const {
        className,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [
        usersQueryFilters,
        setUsersQueryFilters,
    ] = useState<PurgeNull<UserListQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<UserListQueryVariables>) => {
            setUsersQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const usersVariables = useMemo(
        (): UserListQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...usersQueryFilters,
        }),
        [ordering, page, pageSize, usersQueryFilters],
    );

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        previousData,
        data: userList = previousData,
        loading: usersLoading,
    } = useQuery<UserListQuery, UserListQueryVariables>(GET_USERS_LIST, {
        variables: usersVariables,
    });

    const [
        toggleUserActiveStatus,
        { loading: updateLoading },
    ] = useMutation<ToggleUserActiveStatusMutation, ToggleUserActiveStatusMutationVariables>(
        TOGGLE_USER_ACTIVE_STATUS,
        {
            onCompleted: (response) => {
                const { updateUser: updateUserRes } = response;
                if (!updateUserRes) {
                    return;
                }
                const { errors, result } = updateUserRes;
                if (errors) {
                    notifyGQLError(errors);
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

    const [
        toggleUserRoleStatus,
        { loading: roleLoading },
    ] = useMutation<ToggleUserRoleStatusMutation, ToggleUserRoleStatusMutationVariables>(
        TOGGLE_USER_ROLE_STATUS,
        {
            onCompleted: (response) => {
                const { updateAdminPortfolio: updateRoleRes } = response;
                if (!updateRoleRes) {
                    return;
                }
                const { errors, ok } = updateRoleRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'User role updated successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

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

    const handleToggleRoleStatus = useCallback(
        (id: string, roleStatus: boolean) => {
            toggleUserRoleStatus({
                variables: {
                    user: id,
                    register: !roleStatus,
                },
            });
        },
        [toggleUserRoleStatus],
    );

    const loadingUsers = usersLoading || updateLoading || roleLoading;

    const usersColumn = useMemo(
        () => {
            const actionColumn: TableColumn<
                UserRolesField,
                string,
                ActionProps,
                TableHeaderCellProps
            > = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    activeStatus: datum.isActive,
                    roleStatus: datum.highestRole,
                    onToggleUserActiveStatus: handleToggleUserActiveStatus,
                    onToggleRoleStatus: handleToggleRoleStatus,
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
                    { sortable: true },
                ),
                createTextColumn<UserRolesField, string>(
                    'highest_role',
                    'Role',
                    (item) => item.highestRole,
                    // { sortable: true },
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
            handleToggleRoleStatus,
        ],
    );

    const totalUsersCount = userList?.users?.totalCount ?? 0;

    return (
        <Container
            heading="Users"
            contentClassName={styles.content}
            className={_cs(className, styles.userContainer)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalUsersCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
            description={(
                <UserFilter
                    onFilterChange={onFilterChange}
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
        </Container>
    );
}

export default UserRoles;
