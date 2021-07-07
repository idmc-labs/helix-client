import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
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
import { PurgeNull } from '#types';
import { createTextColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

import useModalState from '#hooks/useModalState';

import {
    OrganizationsListQuery,
    OrganizationsListQueryVariables,
    DeleteOrganizationMutation,
    DeleteOrganizationMutationVariables,
} from '#generated/types';

import OrganizationForm from './OrganizationForm';
import OrganizationFilter from './OrganizationFilter/index';
import styles from './styles.css';

const GET_ORGANIZATIONS_LIST = gql`
query OrganizationsList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
    organizationList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name) {
      results {
        id
        name
        createdAt
        shortName
        organizationKind {
            id
            name
        }
        category
        countries {
            id
            idmcShortName
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
            errors
            ok
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

type OrganizationFields = NonNullable<NonNullable<OrganizationsListQuery['organizationList']>['results']>[number];

const keySelector = (item: OrganizationFields) => item.id;

interface OrganizationProps {
    className?: string;
}

function OrganizationTable(props: OrganizationProps) {
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
        organizationsQueryFilters,
        setOrganizationsQueryFilters,
    ] = useState<PurgeNull<OrganizationsListQueryVariables>>();

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);

    const orgPermissions = user?.permissions?.organization;

    const [
        shouldShowAddOrganizationModal,
        editableOrganizationId,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<OrganizationsListQueryVariables>) => {
            setOrganizationsQueryFilters(value);
            setPage(1);
        }, [],
    );

    const variables = useMemo(
        (): OrganizationsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...organizationsQueryFilters,
        }),
        [ordering, page, pageSize, organizationsQueryFilters],
    );

    const {
        previousData,
        data: organizations = previousData,
        loading: organizationsLoading,
        refetch: refetchOrganizationList,
    } = useQuery<OrganizationsListQuery>(GET_ORGANIZATIONS_LIST, { variables });

    const handleRefetch = useCallback(
        () => {
            refetchOrganizationList(variables);
        },
        [refetchOrganizationList, variables],
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
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({ children: 'Organization deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
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
                    onEdit: orgPermissions?.change ? showAddOrganizationModal : undefined,
                    onDelete: orgPermissions?.delete ? handleOrganizationDelete : undefined,
                }),
            };

            return [
                createDateColumn<OrganizationFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<OrganizationFields, string>(
                    'name',
                    'Name',
                    (item) => item.name,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<OrganizationFields, string>(
                    'short_name',
                    'Short Name',
                    (item) => item.shortName,
                    { sortable: true },
                ),
                createTextColumn<OrganizationFields, string>(
                    'category',
                    'Category',
                    (item) => item.category,
                    { sortable: true },
                ),
                createTextColumn<OrganizationFields, string>(
                    'countries',
                    'Countries',
                    (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                ),
                createTextColumn<OrganizationFields, string>(
                    'organization_kind__name',
                    'Organization Type',
                    (item) => item.organizationKind?.name,
                    { sortable: true },
                ),
                actionColumn,
            ];
        },
        [
            showAddOrganizationModal,
            handleOrganizationDelete,
            orgPermissions?.change,
            orgPermissions?.delete,
        ],
    );

    const totalOrganizationsCount = organizations?.organizationList?.totalCount ?? 0;

    return (
        <Container
            heading="Organizations"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    {orgPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddOrganizationModal}
                        >
                            Add Organization
                        </Button>
                    )}
                </>
            )}
            description={(
                <OrganizationFilter
                    onFilterChange={onFilterChange}
                />
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalOrganizationsCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalOrganizationsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={organizations?.organizationList?.results}
                        keySelector={keySelector}
                        columns={organizationColumns}
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!organizationsLoading && totalOrganizationsCount <= 0 && (
                <Message
                    message="No organizations found."
                />
            )}
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={hideAddOrganizationModal}
                    heading={editableOrganizationId ? 'Edit Organization' : 'Add Organization'}
                >
                    <OrganizationForm
                        id={editableOrganizationId}
                        onAddOrganizationCache={handleRefetch}
                        onHideAddOrganizationModal={hideAddOrganizationModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default OrganizationTable;
