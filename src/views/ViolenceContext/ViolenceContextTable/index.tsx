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
    ContextOfViolenceListQuery,
    ContextOfViolenceListQueryVariables,
    DeleteContextOfViolenceMutation,
    DeleteContextOfViolenceMutationVariables,
} from '#generated/types';

import ViolenceContextForm from './ViolenceContextForm';
import ViolenceContextFilter from '../ViolenceContextFilter';
import styles from './styles.css';

type ViolenceContextFields = NonNullable<NonNullable<ContextOfViolenceListQuery['contextOfViolenceList']>['results']>[number];

const CONTEXT_OF_VIOLENCE_LIST = gql`
    query ContextOfViolenceList($ordering: String, $name_Icontains: String) {
        contextOfViolenceList(name_Icontains: $name_Icontains, ordering: $ordering) {
            page
            pageSize
            totalCount
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

const CONTEXT_OF_VIOLENCE_DELETE = gql`
    mutation DeleteContextOfViolence($id: ID!) {
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

interface ContextOfViolenceProps {
    className?: string;
}

function ContextOfViolenceTable(props: ContextOfViolenceProps) {
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
        violenceContextQueryFilters,
        setViolenceContextQueryFilters,
    ] = useState<PurgeNull<ContextOfViolenceListQueryVariables>>();

    const [
        shouldShowViolenceContextModal,
        editableViolenceContextId,
        showViolenceContextModal,
        hideViolenceContextModal,
    ] = useModalState();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ContextOfViolenceListQueryVariables>) => {
            setViolenceContextQueryFilters(value);
            setPage(1);
        }, [],
    );

    const variables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            ...violenceContextQueryFilters,
        }),
        [
            ordering,
            page,
            pageSize,
            violenceContextQueryFilters,
        ],
    );

    const {
        previousData,
        data: violenceContextData = previousData,
        loading: loadingViolenceContext,
        refetch: refetchViolenceContext,
    } = useQuery<ContextOfViolenceListQuery, ContextOfViolenceListQueryVariables>(
        CONTEXT_OF_VIOLENCE_LIST,
        {
            variables,
        },
    );

    const [
        deleteViolenceContext,
        { loading: deletingViolenceContext },
    ] = useMutation<DeleteContextOfViolenceMutation, DeleteContextOfViolenceMutationVariables>(
        CONTEXT_OF_VIOLENCE_DELETE,
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
                        children: 'Context of Violence deleted successfully!',
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
    const violenceContextPermissions = user?.permissions?.contextofviolence;

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
                    onDelete: violenceContextPermissions
                        ?.delete ? handleViolenceContextDelete : undefined,
                    onEdit: violenceContextPermissions
                        ?.change ? showViolenceContextModal : undefined,
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
            heading="Context of Violence"
            headerActions={violenceContextPermissions?.add && (
                <Button
                    name={undefined}
                    onClick={showViolenceContextModal}
                    disabled={loadingViolenceContext}
                >
                    Add Context of Violence
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
                    message="No Context of Violence found."
                />
            )}
            {shouldShowViolenceContextModal && (
                <Modal
                    onClose={hideViolenceContextModal}
                    heading={editableViolenceContextId ? 'Edit Context of Violence' : 'Add Context of Violence'}
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

export default ContextOfViolenceTable;
