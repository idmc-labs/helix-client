import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    createDateColumn,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { PurgeNull } from '#types';
import { createTextColumn, createActionColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';

import useModalState from '#hooks/useModalState';

import {
    OrganizationsListQuery,
    OrganizationsListQueryVariables,
    DeleteOrganizationMutation,
    DeleteOrganizationMutationVariables,
    ExportOrganizationsMutation,
    ExportOrganizationsMutationVariables,
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

const ORGANIZATION_DOWNLOAD = gql`
    mutation ExportOrganizations($name: String){
        exportOrganizations(name: $name) {
            errors
            ok
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

    const organizationVariables = useMemo(
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
    } = useQuery<OrganizationsListQuery>(
        GET_ORGANIZATIONS_LIST,
        { variables: organizationVariables },
    );

    const handleRefetch = useCallback(
        () => {
            refetchOrganizationList(organizationVariables);
        },
        [refetchOrganizationList, organizationVariables],
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

    const [
        exportOrganizations,
        { loading: exportingOrganizations },
    ] = useMutation<ExportOrganizationsMutation, ExportOrganizationsMutationVariables>(
        ORGANIZATION_DOWNLOAD,
        {
            onCompleted: (response) => {
                const { exportOrganizations: exportOrganizationsResponse } = response;
                if (!exportOrganizationsResponse) {
                    return;
                }
                const { errors, ok } = exportOrganizationsResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Organizations Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            exportOrganizations({
                variables: organizationVariables,
            });
        },
        [exportOrganizations, organizationVariables],
    );

    const loading = organizationsLoading || deleteOrganizationLoading;

    const organizationColumns = useMemo(
        () => ([
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
            createActionColumn<OrganizationFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: orgPermissions?.change ? showAddOrganizationModal : undefined,
                    onDelete: orgPermissions?.delete ? handleOrganizationDelete : undefined,
                }),
            ),
        ]),
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
                        <>
                            <ConfirmButton
                                confirmationHeader="Confirm Export"
                                confirmationMessage="Are you sure you want to export this table data ?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={exportingOrganizations}
                            >
                                Export
                            </ConfirmButton>
                            <Button
                                name={undefined}
                                onClick={showAddOrganizationModal}
                            >
                                Add Organization
                            </Button>
                        </>
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
