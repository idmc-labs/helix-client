import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    SortContext,
    Pager,
    Modal,
    Button,
    createDateColumn,
} from '@togglecorp/toggle-ui';
import { createTextColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import Loading from '#components/Loading';
import ActionCell, { ActionProps } from '#components/tableHelpers/Action';
import DomainContext from '#components/DomainContext';

import useModalState from '#hooks/useModalState';

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
                country {
                    id
                    idmcShortName
                }
                torg
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

const defaultSorting = {
    name: 'created_at',
    direction: 'dsc',
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

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);
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
        previousData,
        data: actors = previousData,
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
                    notifyGQLError(errors);
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
                createDateColumn<ActorFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<ActorFields, string>(
                    'name',
                    'Name',
                    (item) => item.name,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<ActorFields, string>(
                    'country__idmc_short_name',
                    'Country',
                    (item) => item.country?.idmcShortName,
                    { sortable: true },
                ),
                createTextColumn<ActorFields, string>(
                    'torg',
                    'Torg',
                    (item) => item.torg,
                    { sortable: true },
                ),
                actionColumn,
            ];
        },
        [
            showAddActorModal,
            handleActorDelete,
            actorPermissions?.change,
            actorPermissions?.delete,
        ],
    );

    return (
        <Container
            heading="Actors"
            contentClassName={styles.content}
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
                        >
                            Add Actor
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
            {totalActorsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={actors?.actorList?.results}
                        keySelector={keySelector}
                        columns={actorColumns}
                    />
                </SortContext.Provider>
            )}
            {loading && <Loading absolute />}
            {!actorsLoading && totalActorsCount <= 0 && (
                <Message
                    message="No actors found."
                />
            )}
            {shouldShowAddActorModal && (
                <Modal
                    onClose={hideAddActorModal}
                    heading={actorIdOnEdit ? 'Edit Actor' : 'Add Actor'}
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
