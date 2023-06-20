import React, { useState, useMemo, useCallback, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    Modal,
    SortContext,
    createYesNoColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createDateColumn,
    createCustomActionColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import {
    UserListQuery,
    UserListQueryVariables,
    ToggleUserActiveStatusMutation,
    ToggleUserActiveStatusMutationVariables,
    ToggleUserRoleStatusMutation,
    ToggleUserRoleStatusMutationVariables,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';
import useModalState from '#hooks/useModalState';

import Message from '#components/Message';
import NotificationContext from '#components/NotificationContext';
import Container from '#components/Container';
import Loading from '#components/Loading';

import ActionCell, { ActionProps } from './UserActions';
import UserFilter from './UserFilter/index';
import styles from './styles.css';
import UserEmailChangeForm from '#components/forms/UserEmailChangeForm';

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
                isAdmin
                id
                fullName
                portfolioRole
                portfolioRoleDisplay
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
                portfolioRole
                portfolioRoleDisplay
                id
                isAdmin
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
    const debouncedPage = useDebouncedValue(page);

    const [
        usersQueryFilters,
        setUsersQueryFilters,
    ] = useState<PurgeNull<UserListQueryVariables>>();

    const [
        shouldShowEmailEditModal,
        editableUserId,
        showEmailEditModal,
        hideEmailEditModal,
    ] = useModalState();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<UserListQueryVariables>) => {
            setUsersQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const usersVariables = useMemo(
        (): UserListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            ...usersQueryFilters,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            usersQueryFilters,
        ],
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
                    notify({
                        children: 'User active status updated successfully!',
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
                    notify({
                        children: 'User role updated successfully!',
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
        () => ([
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
                'large',
            ),
            createTextColumn<UserRolesField, string>(
                'portfolio_role',
                'Role',
                (item) => item.portfolioRoleDisplay,
                undefined,
                'large',
            ),
            createYesNoColumn<UserRolesField, string>(
                'is_admin',
                'Admin',
                (item) => item.isAdmin,
                // { sortable: true },
            ),
            createYesNoColumn<UserRolesField, string>(
                'is_active',
                'Active',
                (item) => item.isActive,
                { sortable: true },
            ),
            createCustomActionColumn<UserRolesField, string, ActionProps>(
                ActionCell,
                (_, datum) => ({
                    id: datum.id,
                    activeStatus: datum.isActive,
                    isAdmin: datum.isAdmin,
                    onEdit: showEmailEditModal,
                    onToggleUserActiveStatus: handleToggleUserActiveStatus,
                    onToggleRoleStatus: handleToggleRoleStatus,
                }),
                'action',
                '',
                undefined,
                3,
            ),
        ]),
        [
            showEmailEditModal,
            handleToggleUserActiveStatus,
            handleToggleRoleStatus,
        ],
    );

    const totalUsersCount = userList?.users?.totalCount ?? 0;

    return (
        <Container
            compactContent
            heading="Users"
            contentClassName={styles.content}
            className={_cs(className, styles.userContainer)}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalUsersCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
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
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {loadingUsers && <Loading absolute />}
            {!loadingUsers && totalUsersCount <= 0 && (
                <Message
                    message="No users found."
                />
            )}
            {shouldShowEmailEditModal && (
                <Modal
                    onClose={hideEmailEditModal}
                    heading="Update user"
                    size="small"
                    freeHeight
                >
                    <UserEmailChangeForm
                        id={editableUserId}
                        onEmailChangeFormCancel={hideEmailEditModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default UserRoles;
