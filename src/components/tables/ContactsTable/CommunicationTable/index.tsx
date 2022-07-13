import React, { useCallback, useContext, useMemo, useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    Table,
    Pager,
    Button,
    useSortState,
    Modal,
    createDateColumn,
    SortContext,
} from '@togglecorp/toggle-ui';
import { _cs, isDefined } from '@togglecorp/fujs';
import { createTextColumn, createActionColumn } from '#components/tableHelpers';

import { PurgeNull } from '#types';
import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { CountryOption } from '#components/selections/CountrySelectInput';

import useModalState from '#hooks/useModalState';
import useDebouncedValue from '#hooks/useDebouncedValue';

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
    query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $contact: ID, $subject: String, $country: ID) {
        communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, contact: $contact, subjectContains: $subject, country: $country) {
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

const communicationDefaultSorting = {
    name: 'created_at',
    direction: 'dsc',
};

type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];

const keySelector = (item: CommunicationFields) => item.id;

interface CommunicationListProps {
    className?: string;
    contact: string;
    defaultCountry: CountryOption | undefined | null;
    compact?: boolean;
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        contact,
        defaultCountry,
        compact,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validCommunicationSorting = sorting || communicationDefaultSorting;
    const communicationOrdering = validCommunicationSorting.direction === 'asc'
        ? validCommunicationSorting.name
        : `-${validCommunicationSorting.name}`;
    const [communicationPage, setCommunicationPage] = useState(1);
    const debouncedPage = useDebouncedValue(communicationPage);

    const communicationPageSize = 10;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        communicationQueryFilters,
        setCommunicationQueryFilters,
    ] = useState<PurgeNull<CommunicationListQueryVariables>>();

    const [
        shouldShowAddCommunicationModal,
        editableCommunicationId,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<CommunicationListQueryVariables>) => {
            setCommunicationQueryFilters(value);
            setCommunicationPage(1);
        }, [],
    );

    const communicationsVariables = useMemo(
        (): CommunicationListQueryVariables => ({
            ordering: communicationOrdering,
            page: debouncedPage,
            pageSize: communicationPageSize,
            contact,
            country: defaultCountry?.id,
            ...communicationQueryFilters,
        }),
        [
            communicationOrdering,
            debouncedPage,
            communicationPageSize,
            contact,
            defaultCountry?.id,
            communicationQueryFilters,
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
            defaultCountry
                ? undefined
                : createTextColumn<CommunicationFields, string>(
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
            ),
        ].filter(isDefined)),
        [
            defaultCountry,
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
                    onFilterChange={onFilterChange}
                />
            )}
            footerContent={(
                <Pager
                    activePage={communicationPage}
                    itemsCount={totalCommunicationsCount}
                    maxItemsPerPage={communicationPageSize}
                    onActivePageChange={setCommunicationPage}
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
                        contact={contact}
                        id={editableCommunicationId}
                        onHideAddCommunicationModal={hideAddCommunicationModal}
                        onAddCommunicationCache={handleRefetch}
                        defaultCountry={defaultCountry}
                    />
                </Modal>
            )}
        </Container>

    );
}

export default CommunicationTable;
