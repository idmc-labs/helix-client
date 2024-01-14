import React, { useCallback, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Table,
    SortContext,
    Pager,
    Modal,
    Button,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import TableMessage from '#components/TableMessage';
import useFilterState from '#hooks/useFilterState';
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
import useModalState from '#hooks/useModalState';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import {
    ActorsListQuery,
    ActorsListQueryVariables,
    DeleteActorMutation,
    DeleteActorMutationVariables,
    ExportActorsMutation,
    ExportActorsMutationVariables,
} from '#generated/types';
import { hasNoData } from '#utils/common';

import ActorForm from './ActorForm';
import ActorsFilter from './ActorFilters/index';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_ACTORS_LIST = gql`
    query ActorsList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ActorFilterDataInputType,
    ) {
        actorList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
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
        $filters: ActorFilterDataInputType!,
    ) {
        exportActors(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;

type ActorFields = NonNullable<NonNullable<ActorsListQuery['actorList']>['results']>[number];

const keySelector = (item: ActorFields) => item.id;

interface ActorProps {
    className?: string;
}

function ActorTable(props: ActorProps) {
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
    } = useFilterState<PurgeNull<NonNullable<ActorsListQueryVariables['filters']>>>({
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
        data: actors = previousData,
        loading: actorsLoading,
        refetch: refetchActorList,
        error: actorsError,
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
                    notify({
                        children: 'Actor deleted successfully!',
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

    const handleActorDelete = useCallback((id) => {
        deleteActor({
            variables: { id },
        });
    }, [deleteActor]);

    const [
        exportActors,
        { loading: exportingActors },
    ] = useMutation<ExportActorsMutation, ExportActorsMutationVariables>(
        ACTORS_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
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
            exportActors({
                variables: {
                    filters: variables?.filters ?? {},
                },
            });
        },
        [exportActors, variables],
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
                { sortable: true },
                'large',
            ),
            createTextColumn<ActorFields, string>(
                'country__idmc_short_name',
                'Country',
                (item) => item.country?.idmcShortName,
                { sortable: true },
                'large',
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
                undefined,
                2,
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
            compactContent
            heading="Actors"
            contentClassName={styles.content}
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    {actorPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddActorModal}
                        >
                            Add Actor
                        </Button>
                    )}
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingActors}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            description={(
                <ActorsFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalActorsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {loading && <Loading absolute />}
            {totalActorsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={actors?.actorList?.results}
                        keySelector={keySelector}
                        columns={actorColumns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {!loadingActors && (
                <TableMessage
                    errored={!!actorsError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalActorsCount}
                    emptyMessage="No actors found"
                    emptyMessageWithFilters="No actors found with applied filters"
                    errorMessage="Could not fetch actors"
                />
            )}
            {shouldShowAddActorModal && (
                <Modal
                    onClose={hideAddActorModal}
                    heading={actorIdOnEdit ? 'Edit Actor' : 'Add Actor'}
                    size="medium"
                    freeHeight
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
