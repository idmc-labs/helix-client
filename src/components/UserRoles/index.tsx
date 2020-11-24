import React, { useState, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    createColumn,
    TableHeaderCell,
    TableCell,
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

import DateCell from '#components/tableHelpers/Date';
import YesNoCell from '#components/tableHelpers/YesNo';
import Loading from '#components/Loading';

import styles from './styles.css';

// TODO: Filter based on other fields as well
const GET_USERS_LIST = gql`
query UserList($ordering: String) {
    users(ordering: $ordering) {
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
        () => ({
            ordering,
        }),
        [ordering],
    );

    const {
        data: userList,
        loading: usersLoading,
        // TODO: handle error
    } = useQuery<UserListQuery>(GET_USERS_LIST, {
        variables: usersVariables,
    });

    const loadingUsers = usersLoading;

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

            return [
                createColumn(dateColumn, 'dateJoined', 'Date Joined'),
                createColumn(stringColumn, 'username', 'Username', true),
                createColumn(stringColumn, 'fullName', 'Name'),
                createColumn(stringColumn, 'email', 'Email'),
                createColumn(stringColumn, 'role', 'Role'),
                createColumn(booleanColumn, 'isActive', 'Active'),
            ];
        },
        [
            setSortState,
            validSortState,
        ],
    );

    return (
        <Container
            heading="Users"
            className={_cs(className, styles.userContainer)}
            headerActions={(
                <Button
                    name={undefined}
                    disabled
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
