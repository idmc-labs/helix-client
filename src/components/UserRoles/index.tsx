import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TableCell,
    TableCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import { ExtractKeys } from '#types';

import {
    UserListQuery,
} from '#generated/types';

import Loading from '#components/Loading';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import styles from './styles.css';

// TODO: Filter based on other fields as well
const GET_USERS_LIST = gql`
query UserList($ordering: String) {
    users(ordering: $ordering) {
        results {
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

const defaultSortState = {
    name: 'username',
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
        () => ({
            ordering,
        }),
        [ordering],
    );

    const {
        data: userList,
        loading: usersLoading,
        refetch: refetchUsers,
        // TODO: handle error
    } = useQuery<UserListQuery>(GET_USERS_LIST, {
        variables: usersVariables,
    });

    const loadingUsers = usersLoading;

    const usersColumn = useMemo(
        () => {
            type stringKeys = ExtractKeys<UserRolesField, string>;
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

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<UserRolesField, string, TableCellProps<string>, TableHeaderCellProps> = {
                id: 'fullName',
                title: 'Name',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    // FIXME: No need to set default string value
                    value: datum.fullName ?? '',
                }),
            };
            // eslint-disable-next-line max-len
            const roleColumn: TableColumn<UserRolesField, string, TableCellProps<string>, TableHeaderCellProps> = {
                id: 'roleame',
                title: 'Role',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    // FIXME: No need to set default string value
                    value: datum.fullName ?? '',
                }),
            };
            // TODO add actions
            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<UserRolesField, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                }),
            };

            return [
                createColumn(stringColumn, 'username', 'User Name'),
                nameColumn,
                createColumn(stringColumn, 'email', 'Email'),
                roleColumn,
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
        ],
    );

    return (
        <Container
            heading="User Roles"
            className={_cs(className, styles.userContainer)}
            headerActions={(
                <Button
                    name={undefined}
                    label="Add New User"
                >
                    Add New User
                </Button>
            )}
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
            {loadingUsers && <Loading />}
            <Table
                className={styles.table}
                data={userList?.users?.results}
                keySelector={keySelector}
                columns={usersColumn}
            />
        </Container>
    );
}

export default UserRoles;
