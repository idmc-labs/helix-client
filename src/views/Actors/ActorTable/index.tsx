import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    SortContext,
    Pager,
    Modal,
    Button,
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
    ActorsListQuery,
    ActorsListQueryVariables,
    DeleteActorMutation,
    DeleteActorMutationVariables,
    ExportActorsMutation,
    ExportActorsMutationVariables,
} from '#generated/types';

import ActorForm from './ActorForm';
import ActorsFilter from './ActorFilters/index';
import styles from './styles.css';

const GET_ACTORS_LIST = gql`
    query ActorsList($ordering: String, $page: Int, $pageSize: Int, $name_Icontains: String) {
        actorList(ordering: $ordering, page: $page, pageSize: $pageSize, name_Icontains: $name_Icontains) {
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

const ACTORS_DOWNLOAD = gql`
    mutation ExportActors(
        $name_Icontains: String,
        ){
        exportActors(
            name_Icontains: $name_Icontains,
            ) {
            errors
            ok
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
    const [pageSize, setPageSize] = useState(10);
    const [
        actorsQueryFilters,
        setActorsQueryFilters,
    ] = useState<PurgeNull<ActorsListQueryVariables>>();

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

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ActorsListQueryVariables>) => {
            setActorsQueryFilters(value);
            setPage(1);
        }, [],
    );

    const variables = useMemo(
        (): ActorsListQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...actorsQueryFilters,
        }),
        [ordering, page, pageSize, actorsQueryFilters],
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

    const actorsExportVariables = useMemo(
        (): ExportActorsMutationVariables => ({
            actorsQueryFilters,
        }),
        [actorsQueryFilters],
    );

    const [
        exportActors,
        { loading: exportingActors },
    ] = useMutation<ExportActorsMutation, ExportActorsMutationVariables>(
        ACTORS_DOWNLOAD,
        {
            onCompleted: (response) => {
                const { exportActors: exportActorsResponse } = response;
                if (!exportActorsResponse) {
                    return;
                }
                const { errors, ok } = exportActorsResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            exportActors({
                variables: actorsExportVariables,
            });
        },
        [exportActors, actorsExportVariables],
    );

    const loading = actorsLoading || deleteActorLoading;
    const totalActorsCount = actors?.actorList?.totalCount ?? 0;

    const actorColumns = useMemo(
        () => ([
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
            createActionColumn<ActorFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: actorPermissions?.change ? showAddActorModal : undefined,
                    onDelete: actorPermissions?.delete ? handleActorDelete : undefined,
                }),
            ),
        ]),
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
                    {actorPermissions?.add && (
                        <>
                            <ConfirmButton
                                confirmationHeader="Confirm Export"
                                confirmationMessage="Are you sure you want to export this table data ?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={exportingActors}
                            >
                                Export
                            </ConfirmButton>
                            <Button
                                name={undefined}
                                onClick={showAddActorModal}
                            >
                                Add Contact
                            </Button>
                        </>
                    )}
                </>
            )}
            description={(
                <ActorsFilter
                    onFilterChange={onFilterChange}
                />
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
