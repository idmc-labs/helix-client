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
    ActorsListQuery,
    ActorsListQueryVariables,
    DeleteActorMutation,
    DeleteActorMutationVariables,
} from '#generated/types';

import ActorForm from './ActorForm';
import styles from './styles.css';

const GET_ACTORS_LIST = gql`
    query ActorsList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        actorList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name) {
            results {
                id
                name
                createdAt
            }
            totalCount
            pageSize
            page
        }
    }
`;

const DELETE_ACTOR = gql`
    mutation DeleteActor($id: ID!) {
        deleteActor(id: $id) {
            errors
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

type ActorFields = NonNullable<NonNullable<ActorsListQuery['actorList']>['results']>[number];

const keySelector = (item: ActorFields) => item.id;

interface ActorProps {
    className?: string;
}

function ActorTable(props: ActorProps) {
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

    const { notify } = useContext(NotificationContext);
    const { user } = useContext(DomainContext);

    const actorPermissions = user?.permissions?.actor;

    const [
        shouldShowAddActorModal,
        actorIdOnEdit,
        showAddActorModal,
        hideAddActorModal,
    ] = useModalState();

    const variables = useMemo(
        (): ActorsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        data: actors,
        loading: actorsLoading,
        refetch: refetchActorList,
        // TODO: handle error
    } = useQuery<ActorsListQuery>(GET_ACTORS_LIST, { variables });

    const handleRefetch = useCallback(
        () => {
            refetchActorList(variables);
        },
        [refetchActorList, variables],
    );

    const [
        deleteActor,
        { loading: deleteActorLoading },
    ] = useMutation<DeleteActorMutation, DeleteActorMutationVariables>(
        DELETE_ACTOR,
        {
            update: handleRefetch,
            onCompleted: (response) => {
                const { deleteActor: deleteActorRes } = response;
                if (!deleteActorRes) {
                    return;
                }
                const { errors, result } = deleteActorRes;
                if (errors) {
                    notify({ children: 'Sorry, actor could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'Actor deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleActorDelete = useCallback((id) => {
        deleteActor({
            variables: { id },
        });
    }, [deleteActor]);

    const loading = actorsLoading || deleteActorLoading;
    const totalActorsCount = actors?.actorList?.totalCount ?? 0;

    const actorColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ActorFields, string>;
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
                cellRendererParams: (_: string, datum: ActorFields) => ({
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
                cellRendererParams: (_: string, datum: ActorFields) => ({
                    value: datum[colName],
                }),
            });

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ActorFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onEdit: actorPermissions?.change ? showAddActorModal : undefined,
                    onDelete: actorPermissions?.delete ? handleActorDelete : undefined,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                createColumn(stringColumn, 'name', 'Name', true),
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            showAddActorModal,
            handleActorDelete,
            actorPermissions?.change,
            actorPermissions?.delete,
        ],
    );

    return (
        <Container
            heading="Actors"
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
                    {actorPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddActorModal}
                            label="Add New Actor"
                            disabled={loading}
                        >
                            Add New Actor
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalActorsCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            <Table
                className={styles.table}
                data={actors?.actorList?.results}
                keySelector={keySelector}
                columns={actorColumns}
            />
            {loading && <Loading />}
            {!loading && totalActorsCount <= 0 && (
                <div className={styles.noActors}>
                    No Actors found
                </div>
            )}
            {shouldShowAddActorModal && (
                <Modal
                    onClose={showAddActorModal}
                    heading={actorIdOnEdit ? 'Edit Actor' : 'Add New Actor'}
                >
                    <ActorForm
                        id={actorIdOnEdit}
                        onAddActorCache={handleRefetch}
                        onHideAddActorModal={hideAddActorModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ActorTable;
