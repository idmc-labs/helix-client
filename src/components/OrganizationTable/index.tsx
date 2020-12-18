import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import DateCell from '#components/tableHelpers/Date';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

import {
    OrganizationsListQuery,
    OrganizationsListQueryVariables,
    DeleteOrganizationMutation,
    DeleteOrganizationMutationVariables,
} from '#generated/types';

import OrganizationForm from './OrganizationForm';
import styles from './styles.css';

const GET_ORGANIZATIONS_LIST = gql`
query OrganizationsList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
    organizationList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name) {
      results {
        id
        name
        createdAt
        shortName
        breakdown
        methodology
        organizationKind {
            id
            name
        }
      }
      totalCount
      pageSize
      page
    }
  }
`;

const DELETE_ORGANIZATION = gql`
    mutation DeleteOrganization($id: ID!) {
        deleteOrganization(id: $id) {
            errors {
                field
                messages
            }
            ok
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

type OrganizationFields = NonNullable<NonNullable<OrganizationsListQuery['organizationList']>['results']>[number];

interface Entity {
    id: string;
    name: string | undefined;
}

const keySelector = (item: OrganizationFields) => item.id;

interface OrganizationProps {
    className?: string;
}

function OrganizationTable(props: OrganizationProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(25);
    const [organizationIdOnEdit, setOrganizationIdOnEdit] = useState<OrganizationFields['id'] | undefined>();

    const { notify } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);

    const orgPermissions = user?.permissions?.organization;

    const [
        shouldShowAddOrganizationModal,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

    const variables = useMemo(
        (): OrganizationsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        data: organizations,
        loading: organizationsLoading,
        refetch: refetchOrganizationList,
        // TODO: handle error
    } = useQuery<OrganizationsListQuery>(GET_ORGANIZATIONS_LIST, { variables });

    const handleRefetch = useCallback(
        () => {
            refetchOrganizationList(variables);
        },
        [refetchOrganizationList, variables],
    );

    const handleHideAddOrganizationModal = useCallback(
        () => {
            setOrganizationIdOnEdit(undefined);
            hideAddOrganizationModal();
        },
        [hideAddOrganizationModal, setOrganizationIdOnEdit],
    );

    const handleSetOrganizationIdOnEdit = useCallback(
        (organizationId) => {
            setOrganizationIdOnEdit(organizationId);
            showAddOrganizationModal();
        },
        [setOrganizationIdOnEdit, showAddOrganizationModal],
    );

    const [
        deleteOrganization,
        { loading: deleteOrganizationLoading },
    ] = useMutation<DeleteOrganizationMutation, DeleteOrganizationMutationVariables>(
        DELETE_ORGANIZATION,
        {
            update: handleRefetch,
            onCompleted: (response) => {
                const { deleteOrganization: deleteOrganizationRes } = response;
                if (!deleteOrganizationRes) {
                    return;
                }
                const { errors, result } = deleteOrganizationRes;
                // console.error(errors);
                // TODO: handle what to do if not okay?
                if (errors) {
                    notify({ children: 'Sorry, organization could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'Organization deleted successfully!' });
                }
            },
            // TODO: handle onError
        },
    );

    const handleOrganizationDelete = useCallback((id) => {
        deleteOrganization({
            variables: { id },
        });
    }, [deleteOrganization]);

    const loading = organizationsLoading || deleteOrganizationLoading;

    const organizationColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<OrganizationFields, string>;
            type entityKeys = ExtractKeys<OrganizationFields, Entity>;

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
                cellRendererParams: (_: string, datum: OrganizationFields) => ({
                    value: datum[colName],
                }),
            });

            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: OrganizationFields) => ({
                    value: datum[colName]?.name,
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
                cellRendererParams: (_: string, datum: OrganizationFields) => ({
                    value: datum[colName],
                }),
            });

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<OrganizationFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onEdit: orgPermissions?.change ? handleSetOrganizationIdOnEdit : undefined,
                    onDelete: orgPermissions?.delete ? handleOrganizationDelete : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(stringColumn, 'name', 'Name', true),
                createColumn(stringColumn, 'shortName', 'Short Name'),
                createColumn(stringColumn, 'methodology', 'Methodology'),
                createColumn(stringColumn, 'breakdown', 'Breakdown'),
                createColumn(entityColumn, 'organizationKind', 'Organization Type'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            handleSetOrganizationIdOnEdit,
            handleOrganizationDelete,
            orgPermissions?.change,
            orgPermissions?.delete,
        ],
    );

    return (
        <Container
            heading="Organizations"
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={search}
                        placeholder="Search"
                        onChange={setSearch}
                        disabled={loading}
                    />
                    {orgPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddOrganizationModal}
                            label="Add New Organization"
                            disabled={loading}
                        >
                            Add New Organization
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={organizations?.organizationList?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loading && <Loading />}
            <Table
                className={styles.table}
                data={organizations?.organizationList?.results}
                keySelector={keySelector}
                columns={organizationColumns}
            />
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={handleHideAddOrganizationModal}
                    heading={organizationIdOnEdit ? 'Edit Organization' : 'Add New Organization'}
                >
                    <OrganizationForm
                        id={organizationIdOnEdit}
                        onAddOrganizationCache={handleRefetch}
                        onHideAddOrganizationModal={handleHideAddOrganizationModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default OrganizationTable;
