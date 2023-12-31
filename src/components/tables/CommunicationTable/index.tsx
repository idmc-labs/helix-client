import React, { useCallback, useContext, useMemo } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    Table,
    Pager,
    Button,
    Modal,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';
import { createTextColumn, createActionColumn } from '#components/tableHelpers';

import useFilterState from '#hooks/useFilterState';
import { expandObject } from '#utils/common';
import { PurgeNull } from '#types';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    CommunicationListQuery,
    CommunicationListQueryVariables,
    DeleteCommunicationMutation,
    DeleteCommunicationMutationVariables,
} from '#generated/types';

import CommunicationForm from '#components/forms/CommunicationForm';

import CommunicationFilter from './CommunicationFilter/index';
import styles from './styles.css';

const GET_COMMUNICATIONS_LIST = gql`
    query CommunicationList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: CommunicationFilterDataInputType,
    ) {
        communicationList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,

            filters: $filters,
            # FIXME: check subjectContains: $subject,
        ) {
            results {
                id
                content
                date
                subject
                contact {
                    id
                }
                country {
                    id
                    idmcShortName
                }
                medium {
                    id
                    name
                }
                createdAt
            }
            totalCount
            pageSize
            page
        }
    }
`;

const DELETE_COMMUNICATION = gql`
    mutation DeleteCommunication($id: ID!) {
        deleteCommunication(id: $id) {
            errors
            ok
            result {
                id
            }
        }
    }
`;

type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];

const keySelector = (item: CommunicationFields) => item.id;

interface CommunicationListProps {
    className?: string;
    compact?: boolean;

    contact: string;
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        contact,
        compact,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        // rawFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
    } = useFilterState<PurgeNull<NonNullable<CommunicationListQueryVariables['filters']>>>({
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
        shouldShowAddCommunicationModal,
        editableCommunicationId,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();

    const communicationsVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<CommunicationListQueryVariables['filters']>>(
                filter,
                {
                    contact,
                },
            ),
        }),
        [
            ordering,
            page,
            filter,
            pageSize,
            contact,
        ],
    );

    const {
        previousData,
        data: communications = previousData,
        loading: communicationsLoading,
        refetch: refetchCommunications,
    } = useQuery<CommunicationListQuery>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });

    const handleRefetch = useCallback(
        () => {
            refetchCommunications(communicationsVariables);
        },
        [refetchCommunications, communicationsVariables],
    );

    const [
        deleteCommunication,
        { loading: deleteCommunicationLoading },
    ] = useMutation<DeleteCommunicationMutation, DeleteCommunicationMutationVariables>(
        DELETE_COMMUNICATION,
        {
            update: handleRefetch,
            onCompleted: (response) => {
                const { deleteCommunication: deleteCommunicationRes } = response;
                if (!deleteCommunicationRes) {
                    return;
                }
                const { errors, result } = deleteCommunicationRes;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (result) {
                    notify({
                        children: 'Communication deleted successfully!',
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

    const handleCommunicationDelete = useCallback(
        (id) => {
            deleteCommunication({
                variables: { id },
            });
        },
        [deleteCommunication],
    );

    const { user } = useContext(DomainContext);
    const commPermissions = user?.permissions?.communication;

    const communicationColumns = useMemo(
        () => ([
            createDateColumn<CommunicationFields, string>(
                'created_at',
                'Date Created',
                (item) => item.createdAt,
                { sortable: true },
            ),
            createDateColumn<CommunicationFields, string>(
                'date',
                'Date of Communication',
                (item) => item.date,
                { sortable: true },
            ),
            createTextColumn<CommunicationFields, string>(
                'subject',
                'Subject',
                (item) => item.subject,
                { sortable: true },
                'large',
            ),
            createTextColumn<CommunicationFields, string>(
                'medium',
                'Medium',
                (item) => item.medium?.name,
                { sortable: true },
            ),
            createTextColumn<CommunicationFields, string>(
                'country__idmc_short_name',
                'Country',
                (item) => item.country?.idmcShortName,
                { sortable: true },
                'large',
            ),
            createActionColumn<CommunicationFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onDelete: commPermissions?.delete ? handleCommunicationDelete : undefined,
                    onEdit: commPermissions?.change ? showAddCommunicationModal : undefined,
                }),
                undefined,
                2,
            ),
        ].filter(isDefined)),
        [
            handleCommunicationDelete,
            showAddCommunicationModal,
            commPermissions?.delete,
            commPermissions?.change,
        ],
    );

    const communicationsList = communications?.communicationList?.results;
    const totalCommunicationsCount = communications?.communicationList?.totalCount ?? 0;
    const loadingCommunications = deleteCommunicationLoading || communicationsLoading;

    return (
        <Container
            compactContent
            heading={compact ? undefined : 'Communication'}
            compact={compact}
            borderless={compact}
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={!compact && commPermissions?.add && (
                <Button
                    name={undefined}
                    onClick={showAddCommunicationModal}
                >
                    Add Communication
                </Button>
            )}
            description={!compact && (
                <CommunicationFilter
                    onFilterChange={setFilter}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalCommunicationsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    itemsPerPageControlHidden
                />
            )}
        >
            {totalCommunicationsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={communicationsList}
                        keySelector={keySelector}
                        columns={communicationColumns}
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {loadingCommunications && <Loading absolute />}
            {!loadingCommunications && totalCommunicationsCount <= 0 && (
                <Message
                    message="No communications found."
                />
            )}
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={hideAddCommunicationModal}
                    heading={editableCommunicationId ? 'Edit Communication' : 'Add Communication'}
                    size="large"
                    freeHeight
                >
                    <CommunicationForm
                        id={editableCommunicationId}
                        contact={contact}
                        onHideAddCommunicationModal={hideAddCommunicationModal}
                        onAddCommunicationCache={handleRefetch}
                    />
                </Modal>
            )}
        </Container>

    );
}

export default CommunicationTable;
