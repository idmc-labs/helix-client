import React, { useMemo, useCallback, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
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
import useFilterState from '#hooks/useFilterState';

import {
    UserListQuery,
    UserListQueryVariables,
    ToggleUserActiveStatusMutation,
    ToggleUserActiveStatusMutationVariables,
    ToggleUserAdminStatusMutation,
    ToggleUserAdminStatusMutationVariables,
    ToggleUserDirectorsOfficeStatusMutation,
    ToggleUserDirectorsOfficeStatusMutationVariables,
    ToggleUserReportingTeamStatusMutation,
    ToggleUserReportingTeamStatusMutationVariables,
} from '#generated/types';
import useModalState from '#hooks/useModalState';
import { expandObject } from '#utils/common';

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
        $filters: UserFilterDataInputType,
    ) {
        users(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
            results {
                dateJoined
                isActive
                isAdmin
                isDirectorsOffice
                isReportingTeam
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

const TOGGLE_USER_ADMIN_STATUS = gql`
    mutation ToggleUserAdminStatus($user: ID!, $register: Boolean!) {
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

const TOGGLE_USER_DIRECTORS_OFFICE_STATUS = gql`
    mutation ToggleUserDirectorsOfficeStatus($user: ID!, $register: Boolean!) {
        updateDirectorsOfficePortfolio(data: {user: $user, register: $register}) {
            errors
            ok
            result {
                portfolioRole
                portfolioRoleDisplay
                id
                isDirectorsOffice
            }
        }
    }
`;

const TOGGLE_USER_REPORTING_TEAM_STATUS = gql`
    mutation ToggleUserReportingTeamStatus($user: ID!, $register: Boolean!) {
        updateReportingTeamPortfolio(data: {user: $user, register: $register}) {
            errors
            ok
            result {
                portfolioRole
                portfolioRoleDisplay
                id
                isReportingTeam
            }
        }
    }
`;

type UserRolesField = NonNullable<NonNullable<UserListQuery['users']>['results']>[number];

const keySelector = (item: UserRolesField) => item.id;

interface UserRolesProps {
    className?: string;
}

function UserRoles(props: UserRolesProps) {
    const {
        className,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        initialFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<UserListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'date_joined',
            direction: 'dsc',
        },
    });

    const [
        shouldShowEmailEditModal,
        editableUserId,
        showEmailEditModal,
        hideEmailEditModal,
    ] = useModalState();

    const usersVariables = useMemo(
        (): UserListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<UserListQueryVariables['filters']>>(
                filter,
                { includeInactive: true },
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
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
        toggleUserAdminStatus,
        { loading: adminStatusLoading },
    ] = useMutation<ToggleUserAdminStatusMutation, ToggleUserAdminStatusMutationVariables>(
        TOGGLE_USER_ADMIN_STATUS,
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

    const [
        toggleUserDirectorsOfficeStatus,
        { loading: directorsOfficeStatusLoading },
    ] = useMutation<
        ToggleUserDirectorsOfficeStatusMutation,
        ToggleUserDirectorsOfficeStatusMutationVariables
    >(
        TOGGLE_USER_DIRECTORS_OFFICE_STATUS,
        {
            onCompleted: (response) => {
                const { updateDirectorsOfficePortfolio: updateRoleRes } = response;
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

    const [
        toggleUserReportingTeamStatus,
        { loading: reportingTeamStatusLoading },
    ] = useMutation<
        ToggleUserReportingTeamStatusMutation,
        ToggleUserReportingTeamStatusMutationVariables
    >(
        TOGGLE_USER_REPORTING_TEAM_STATUS,
        {
            onCompleted: (response) => {
                const { updateReportingTeamPortfolio: updateRoleRes } = response;
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

    const handleToggleAdminStatus = useCallback(
        (id: string, roleStatus: boolean) => {
            toggleUserAdminStatus({
                variables: {
                    user: id,
                    register: !roleStatus,
                },
            });
        },
        [toggleUserAdminStatus],
    );

    const handleToggleDirectorsOfficeStatus = useCallback(
        (id: string, roleStatus: boolean) => {
            toggleUserDirectorsOfficeStatus({
                variables: {
                    user: id,
                    register: !roleStatus,
                },
            });
        },
        [toggleUserDirectorsOfficeStatus],
    );

    const handleToggleReportingTeamStatus = useCallback(
        (id: string, roleStatus: boolean) => {
            toggleUserReportingTeamStatus({
                variables: {
                    user: id,
                    register: !roleStatus,
                },
            });
        },
        [toggleUserReportingTeamStatus],
    );

    const loadingUsers = usersLoading
        || updateLoading
        || adminStatusLoading
        || directorsOfficeStatusLoading
        || reportingTeamStatusLoading;

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
                'is_directors_office',
                'Director\'s Office',
                (item) => item.isDirectorsOffice,
                // { sortable: true },
            ),
            createYesNoColumn<UserRolesField, string>(
                'is_reporting_team',
                'Reporting Team',
                (item) => item.isReportingTeam,
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
                    onEdit: showEmailEditModal,
                    activeStatus: datum.isActive,
                    onToggleUserActiveStatus: handleToggleUserActiveStatus,
                    isAdmin: datum.isAdmin,
                    onToggleAdminStatus: handleToggleAdminStatus,
                    isDirectorsOffice: datum.isDirectorsOffice,
                    onToggleDirectorsOfficeStatus: handleToggleDirectorsOfficeStatus,
                    isReportingTeam: datum.isReportingTeam,
                    onToggleReportingTeamStatus: handleToggleReportingTeamStatus,
                }),
                'action',
                '',
                undefined,
                5,
            ),
        ]),
        [
            showEmailEditModal,
            handleToggleUserActiveStatus,
            handleToggleAdminStatus,
            handleToggleDirectorsOfficeStatus,
            handleToggleReportingTeamStatus,
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
                    activePage={rawPage}
                    itemsCount={totalUsersCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
            description={(
                <UserFilter
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
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
