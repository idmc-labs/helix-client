import React, { useCallback, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    Pager,
    Modal,
    Button,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import TableMessage from '#components/TableMessage';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import useModalState from '#hooks/useModalState';
import useFilterState from '#hooks/useFilterState';
import {
    OrganizationsListQuery,
    OrganizationsListQueryVariables,
    DeleteOrganizationMutation,
    DeleteOrganizationMutationVariables,
    ExportOrganizationsMutation,
    ExportOrganizationsMutationVariables,
} from '#generated/types';
import OrganizationForm from '#components/forms/OrganizationForm';
import { hasNoData } from '#utils/common';

import OrganizationFilter from './OrganizationFilter/index';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_ORGANIZATIONS_LIST = gql`
    query OrganizationsList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: OrganizationFilterDataInputType,
    ) {
        organizationList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
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
                categoryDisplay
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
    mutation ExportOrganizations(
        $filters: OrganizationFilterDataInputType!,
    ) {
        exportOrganizations(
            filters: $filters,
        ) {
                errors
                ok
            }
        }
`;

type OrganizationFields = NonNullable<NonNullable<OrganizationsListQuery['organizationList']>['results']>[number];

const keySelector = (item: OrganizationFields) => item.id;

interface OrganizationProps {
    className?: string;
}

function OrganizationTable(props: OrganizationProps) {
    const {
        className,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<OrganizationsListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

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

    const organizationVariables = useMemo(
        (): OrganizationsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: filter,
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        previousData,
        data: organizations = previousData,
        loading: organizationsLoading,
        refetch: refetchOrganizationList,
        error: organizationsError,
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
                    notify({
                        children: 'Organization deleted successfully!',
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
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
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
                    notify({
                        children: 'Export started successfully!',
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

    const handleExportTableData = useCallback(
        () => {
            exportOrganizations({
                variables: {
                    filters: organizationVariables?.filters ?? {},
                },
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
                { sortable: true },
                'large',
            ),
            createTextColumn<OrganizationFields, string>(
                'short_name',
                'Short Name',
                (item) => item.shortName,
                { sortable: true },
            ),
            createTextColumn<OrganizationFields, string>(
                'category',
                'Geographical Coverage',
                (item) => item.categoryDisplay,
                { sortable: true },
            ),
            createTextColumn<OrganizationFields, string>(
                'countries__idmc_short_name',
                'Countries',
                (item) => item.countries.map((c) => c.idmcShortName).join(', '),
                { sortable: true },
                'large',
            ),
            createTextColumn<OrganizationFields, string>(
                'organization_kind__name',
                'Organization Type',
                (item) => item.organizationKind?.name,
                { sortable: true },
                'large',
            ),
            createActionColumn<OrganizationFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: orgPermissions?.change ? showAddOrganizationModal : undefined,
                    onDelete: orgPermissions?.delete ? handleOrganizationDelete : undefined,
                }),
                undefined,
                2,
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
            compactContent
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
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingOrganizations}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            description={(
                <OrganizationFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalOrganizationsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loading && <Loading absolute />}
            {totalOrganizationsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={organizations?.organizationList?.results}
                        keySelector={keySelector}
                        columns={organizationColumns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {!organizationsLoading && (
                <TableMessage
                    errored={!!organizationsError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalOrganizationsCount}
                    emptyMessage="No organizations found"
                    emptyMessageWithFilters="No organizations found with applied filters"
                    errorMessage="Could not fetch organizations"
                />
            )}
            {shouldShowAddOrganizationModal && (
                <Modal
                    onClose={hideAddOrganizationModal}
                    heading={editableOrganizationId ? 'Edit Organization' : 'Add Organization'}
                    size="large"
                    freeHeight
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
