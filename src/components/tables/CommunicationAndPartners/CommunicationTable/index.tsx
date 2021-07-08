import React, { useCallback, useContext, useMemo, useState } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
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

import Message from '#components/Message';
import Container from '#components/Container';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';
import { CountryOption } from '#components/selections/CountrySelectInput';

import useModalState from '#hooks/useModalState';

import {
    CommunicationListQuery,
    CommunicationListQueryVariables,
    DeleteCommunicationMutation,
    DeleteCommunicationMutationVariables,
} from '#generated/types';

import CommunicationForm from './CommunicationForm';
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
                    name
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
}

function CommunicationTable(props: CommunicationListProps) {
    const {
        className,
        contact,
        defaultCountry,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validCommunicationSorting = sorting || communicationDefaultSorting;
    const communicationOrdering = validCommunicationSorting.direction === 'asc'
        ? validCommunicationSorting.name
        : `-${validCommunicationSorting.name}`;
    const [communicationPage, setCommunicationPage] = useState(1);
    const [communicationPageSize, setCommunicationPageSize] = useState(10);
    const [communicationSearch, setCommunicationSearch] = useState<string | undefined>();

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
        (): CommunicationListQueryVariables => ({
            ordering: communicationOrdering,
            page: communicationPage,
            pageSize: communicationPageSize,
            subject: communicationSearch,
            contact,
            country: defaultCountry?.id,
        }),
        [
            communicationOrdering,
            communicationPage,
            communicationPageSize,
            communicationSearch,
            contact,
            defaultCountry?.id,
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
                    notify({ children: 'Communication deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
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
                { sortable: true, cellAsHeader: true },
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
                    'country__name',
                    'Country',
                    (item) => item.country?.name,
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
            heading="Communication"
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={communicationSearch}
                        placeholder="Search"
                        onChange={setCommunicationSearch}
                    />
                    {commPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddCommunicationModal}
                        >
                            Add Communication
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={communicationPage}
                    itemsCount={totalCommunicationsCount}
                    maxItemsPerPage={communicationPageSize}
                    onActivePageChange={setCommunicationPage}
                    onItemsPerPageChange={setCommunicationPageSize}
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
