import React, { useMemo, useState, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
} from '@togglecorp/toggle-ui';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';

import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    DeleteViolenceContextMutation,
    DeleteViolenceContextMutationVariables,
    ViolenceContextListQuery,
    ViolenceContextListQueryVariables,
} from '#generated/types';

import ViolenceContextForm from './ViolenceContextForm';
import ViolenceContextFilter from '../ViolenceContextFilter';
import styles from './styles.css';

type ViolenceContextFields = NonNullable<NonNullable<ViolenceContextListQuery['contextOfViolenceList']>['results']>[number];

const VIOLENCE_CONTEXT_LIST = gql`
    query ViolenceContextList(
    $ordering: String,
    $name_Icontains: String
    ) {
        contextOfViolenceList(
        ordering: $ordering,
        name_Icontains: $name_Icontains
        ) {
            totalCount
            page
            pageSize
            results {
                id
                name
                createdAt
                createdBy {
                  id
                  fullName
                }
            }
        }
    }
`;

const VIOLENCE_CONTEXT_DELETE = gql`
    mutation DeleteViolenceContext($id: ID!) {
        deleteContextOfViolence(id: $id) {
            errors
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

const keySelector = (item: ViolenceContextFields) => item.id;

interface ViolenceContextProps {
    className?: string;
}

function ViolenceContextTable(props: ViolenceContextProps) {
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        violenceContextFilters,
        setViolenceContextFilters,
    ] = useState<PurgeNull<ViolenceContextListQueryVariables>>();

    const [
        shouldShowViolenceContextModal,
        editableViolenceContextId,
        showViolenceContextModal,
        hideViolenceContextModal,
    ] = useModalState();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ViolenceContextListQueryVariables>) => {
            setViolenceContextFilters(value);
            setPage(1);
        }, [],
    );

    const variables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            ...violenceContextFilters,
        }),
        [ordering, page, pageSize, violenceContextFilters],
    );

    const {
        previousData,
        data: violenceContextData = previousData,
        loading: loadingViolenceContext,
        refetch: refetchViolenceContext,
    } = useQuery<ViolenceContextListQuery, ViolenceContextListQueryVariables>(
        VIOLENCE_CONTEXT_LIST,
        {
            variables,
        },
    );

    const [
        deleteViolenceContext,
        { loading: deletingViolenceContext },
    ] = useMutation<DeleteViolenceContextMutation, DeleteViolenceContextMutationVariables>(
        VIOLENCE_CONTEXT_DELETE,
        {
            onCompleted: (response) => {
                const { deleteContextOfViolence: deleteViolenceContextRes } = response;
                if (!deleteViolenceContextRes) {
                    return;
                }
                const { errors, result } = deleteViolenceContextRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    refetchViolenceContext(variables);
                    notify({
                        children: 'Violence Context deleted successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (errors) => {
                notify({
                    children: errors.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleViolenceContextCreate = React.useCallback(() => {
        refetchViolenceContext(variables);
        hideViolenceContextModal();
    }, [
        refetchViolenceContext,
        variables,
        hideViolenceContextModal,
    ]);

    const handleViolenceContextDelete = useCallback(
        (id: string) => {
            deleteViolenceContext({
                variables: { id },
            });
        },
        [deleteViolenceContext],
    );

    const { user } = useContext(DomainContext);
    const violenceContextPermissions = user?.permissions?.figure;

    const columns = useMemo(
        () => ([
            createDateColumn<ViolenceContextFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createTextColumn<ViolenceContextFields, string>(
                'created_by__full_name',
                'Created by',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createTextColumn<ViolenceContextFields, string>(
                'name',
                'Name',
                (item) => item.name,
                { sortable: true },
                'large',
            ),
            createActionColumn<ViolenceContextFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onDelete: violenceContextPermissions?.delete
                        ? handleViolenceContextDelete : undefined,
                    onEdit: violenceContextPermissions?.change
                        ? showViolenceContextModal : undefined,
                }),
            ),
        ].filter(isDefined)),
        [
            showViolenceContextModal,
            handleViolenceContextDelete,
            violenceContextPermissions?.delete,
            violenceContextPermissions?.change,
        ],
    );
    const totalViolenceContextCount = violenceContextData?.contextOfViolenceList?.totalCount ?? 0;

    return (
        <Container
            className={className}
            contentClassName={styles.content}
            heading="Violence Context"
            headerActions={violenceContextPermissions?.add && (
                <Button
                    name={undefined}
                    onClick={showViolenceContextModal}
                    disabled={loadingViolenceContext}
                >
                    Add ViolenceContext
                </Button>
            )}
            description={(
                <ViolenceContextFilter
                    onFilterChange={onFilterChange}
                />
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={totalViolenceContextCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            {totalViolenceContextCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={violenceContextData?.contextOfViolenceList?.results}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {(loadingViolenceContext || deletingViolenceContext) && <Loading absolute />}
            {!loadingViolenceContext && totalViolenceContextCount <= 0 && (
                <Message
                    message="No violence context found."
                />
            )}
            {shouldShowViolenceContextModal && (
                <Modal
                    onClose={hideViolenceContextModal}
                    heading={editableViolenceContextId ? 'Edit ViolenceContext' : 'Add ViolenceContext'}
                >
                    <ViolenceContextForm
                        id={editableViolenceContextId}
                        onCreate={handleViolenceContextCreate}
                        onFormCancel={hideViolenceContextModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ViolenceContextTable;
