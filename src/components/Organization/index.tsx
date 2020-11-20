import React, { useCallback, useState, useMemo } from 'react';
import { gql, useQuery, MutationUpdaterFn } from '@apollo/client';
import produce from 'immer';
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
import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

import {
    OrganizationsListQuery,
    UpdateOrganizationMutation,
} from '#generated/types';

import DateCell from '#components/tableHelpers/Date';

import Loading from '#components/Loading';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import styles from './styles.css';
import OrganizationForm from './OrganizationForm';

// TODO - update nameContains in backend
const GET_ORGANIZATIONS_LIST = gql`
query OrganizationsList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
    organizationList(ordering: $ordering, page: $page, pageSize: $pageSize, name: $name) {
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

interface OrganizationProps {
    className? : string;
}

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

function Organization(props: OrganizationProps) {
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

    const [
        shouldShowAddOrganizationModal,
        showAddOrganizationModal,
        hideAddOrganizationModal,
    ] = useModalState();

    const variables = useMemo(
        () => ({
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

    // eslint-disable-next-line max-len
    const handleUpdateOrganizationCache: MutationUpdaterFn<UpdateOrganizationMutation> = useCallback(
        (cache, data) => {
            const organization = data?.data?.updateOrganization?.result;
            if (!organization) {
                return;
            }

            const cacheData = cache.readQuery<OrganizationsListQuery>({
                query: GET_ORGANIZATIONS_LIST,
                variables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.organizationList?.results) {
                    return;
                }
                const { results } = safeCacheData.organizationList;
                const organizationIndex = results.findIndex((res) => res.id === organization.id);
                if (organizationIndex !== -1) {
                    results.splice(organizationIndex, 1);
                }
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_ORGANIZATIONS_LIST,
                data: updatedValue,
            });
        },
        [variables],
    );

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

    const loading = organizationsLoading;

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
                    onEdit: handleSetOrganizationIdOnEdit,
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
                    />
                    <Button
                        name={undefined}
                        onClick={showAddOrganizationModal}
                        label="Add New Organization"
                        disabled={loading}
                    >
                        Add New Organization
                    </Button>
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
                        onUpdateOrganizationCache={handleUpdateOrganizationCache}
                        onHideAddOrganizationModal={handleHideAddOrganizationModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default Organization;
