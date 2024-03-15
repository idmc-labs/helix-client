import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { isDefined } from '@togglecorp/fujs';
import {
    Table,
    Modal,
    Button,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from '@apollo/client/utilities';

import TableMessage from '#components/TableMessage';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import useModalState from '#hooks/useModalState';
import useFilterState from '#hooks/useFilterState';
import {
    ContextOfViolenceListQuery,
    ContextOfViolenceListQueryVariables,
    DeleteContextOfViolenceMutation,
    DeleteContextOfViolenceMutationVariables,
    ExportContextOfViolenceMutation,
    ExportContextOfViolenceMutationVariables,
} from '#generated/types';
import { hasNoData } from '#utils/common';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import ViolenceContextForm from './ViolenceContextForm';
import ViolenceContextFilter from '../ViolenceContextFilter';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type ViolenceContextFields = NonNullable<NonNullable<ContextOfViolenceListQuery['contextOfViolenceList']>['results']>[number];

const CONTEXT_OF_VIOLENCE_LIST = gql`
    query ContextOfViolenceList(
        $ordering: String,
        $filters: ContextOfViolenceFilterDataInputType,
    ) {
        contextOfViolenceList(
            ordering: $ordering,
            filters: $filters,
        ) {
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

const CONTEXT_OF_VIOLENCE_DOWNLOAD = gql`
    mutation ExportContextOfViolence(
        $filters: ContextOfViolenceFilterDataInputType!,
    ) {
        exportContextOfViolence(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;

const keySelector = (item: ViolenceContextFields) => item.id;

interface ContextOfViolenceProps {
    className?: string;
}

function ContextOfViolenceTable(props: ContextOfViolenceProps) {
    const {
        className,
    } = props;

    const {
        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,
    } = useFilterState<PurgeNull<NonNullable<ContextOfViolenceListQueryVariables['filters']>>>({
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

    const [
        shouldShowViolenceContextModal,
        editableViolenceContextId,
        showViolenceContextModal,
        hideViolenceContextModal,
    ] = useModalState();

    const variables: ContextOfViolenceListQueryVariables = useMemo(
        () => ({
            ordering,
            filters: filter,
        }),
        [
            ordering,
            filter,
        ],
    );

    const {
        previousData,
        data: violenceContextData = previousData,
        loading: loadingViolenceContext,
        refetch: refetchViolenceContext,
        error: totalViolenceContextError,
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

    const [
        exportContextOfViolence,
        { loading: exportingContextOfViolence },
    ] = useMutation<ExportContextOfViolenceMutation, ExportContextOfViolenceMutationVariables>(
        CONTEXT_OF_VIOLENCE_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportContextOfViolence: exportContextOfViolenceResponse } = response;
                if (!exportContextOfViolenceResponse) {
                    return;
                }
                const { errors, ok } = exportContextOfViolenceResponse;
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
            exportContextOfViolence({
                variables: {
                    filters: variables.filters ?? {},
                },
            });
        },
        [exportContextOfViolence, variables],
    );

    const handleViolenceContextCreate = useCallback(() => {
        hideViolenceContextModal();

        refetchViolenceContext(variables);
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
                undefined,
                2,
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
            compactContent
            className={className}
            contentClassName={styles.content}
            heading="Context of Violence"
            headerActions={violenceContextPermissions?.add && (
                <>
                    <Button
                        name={undefined}
                        onClick={showViolenceContextModal}
                        disabled={loadingViolenceContext}
                    >
                        Add Context of Violence
                    </Button>
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingContextOfViolence}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            description={(
                <ViolenceContextFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
        >
            {(loadingViolenceContext || deletingViolenceContext) && <Loading absolute />}
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
            {!loadingViolenceContext && (
                <TableMessage
                    errored={!!totalViolenceContextError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalViolenceContextCount}
                    emptyMessage="No context of violences found"
                    emptyMessageWithFilters="No context of violences found with applied filters"
                    errorMessage="Could not fetch context of violences"
                />
            )}
            {shouldShowViolenceContextModal && (
                <Modal
                    onClose={hideViolenceContextModal}
                    heading={editableViolenceContextId ? 'Edit Context of Violence' : 'Add Context of Violence'}
                    size="medium"
                    freeHeight
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
