import React, { useCallback, useState, useMemo } from 'react';
import { gql, useQuery, useMutation, MutationUpdaterFn } from '@apollo/client';
import produce from 'immer';
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
    TableCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

import {
    ContactListQuery,
    UpdateContactMutation,
    DeleteContactMutation,
    DeleteContactMutationVariables,
} from '#generated/types';
import DateCell from '#components/tableHelpers/Date';

import Loading from '#components/Loading';

import ContactForm from './ContactForm';
import CommunicationTable from './CommunicationTable';
import ActionCell, { ActionProps } from './ContactActions';
import styles from './styles.css';

const GET_CONTACTS_LIST = gql`
query ContactList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
    contactList(ordering: $ordering, page: $page, pageSize: $pageSize, nameContains: $name ) {
        results {
            id
            fullName
            organization {
                id
                name
            }
            firstName
            createdAt
            country {
                id
                name
            }
        }
        totalCount
        pageSize
        page
        }
    }
`;

const DELETE_CONTACT = gql`
    mutation DeleteContact($id: ID!) {
        deleteContact(id: $id) {
            errors {
                field
                messages
            }
            ok
            result {
                id
            }
        }
    }
`;

interface CommunicationAndPartnersProps {
    className? : string;
}

const contactDefaultSortState = {
    name: 'createdAt',
    direction: TableSortDirection.dsc,
};

type ContactFields = NonNullable<NonNullable<ContactListQuery['contactList']>['results']>[number];

interface Entity {
    id: string;
    name: string | undefined;
}

const keySelector = (item: ContactFields) => item.id;

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validContactSortState = sortState || contactDefaultSortState;

    const contactOrdering = validContactSortState.direction === TableSortDirection.asc
        ? validContactSortState.name
        : `-${validContactSortState.name}`;

    const [contactPage, setContactPage] = useState(1);
    const [contactSearch, setContactSearch] = useState<string | undefined>();
    const [contactPageSize, setContactPageSize] = useState(25);

    const [contactIdOnEdit, setContactIdOnEdit] = useState<ContactFields['id'] | undefined>();
    const [
        shouldShowAddContactModal,
        showAddContactModal,
        hideAddContactModal,
    ] = useModalState();

    const [
        contactIdForCommunication,
        setContactIdForCommunication,
    ] = useState<ContactFields['id'] | undefined>();
    const [
        shouldShowCommunicationListModal,
        showCommunicationListModal,
        hideCommunicationListModal,
    ] = useModalState();

    const contactsVariables = useMemo(
        () => ({
            ordering: contactOrdering,
            page: contactPage,
            pageSize: contactPageSize,
            name: contactSearch,
        }),
        [contactOrdering, contactPage, contactPageSize, contactSearch],
    );

    const {
        data: contacts,
        loading: contactsLoading,
        refetch: refetchContact,
        // TODO: handle error
    } = useQuery<ContactListQuery>(GET_CONTACTS_LIST, {
        variables: contactsVariables,
    });

    const handleUpdateContactCache: MutationUpdaterFn<UpdateContactMutation> = useCallback(
        (cache, data) => {
            const contact = data?.data?.updateContact?.result;
            if (!contact) {
                return;
            }

            const cacheData = cache.readQuery<ContactListQuery>({
                query: GET_CONTACTS_LIST,
                variables: contactsVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.contactList?.results) {
                    return;
                }
                const { results } = safeCacheData.contactList;
                const contactIndex = results.findIndex((res) => res.id === contact.id);
                if (contactIndex !== -1) {
                    results.splice(contactIndex, 1, contact);
                }
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: GET_CONTACTS_LIST,
                data: updatedValue,
            });
        },
        [contactsVariables],
    );

    const handleRefetch = useCallback(
        () => {
            refetchContact(contactsVariables);
        },
        [refetchContact, contactsVariables],
    );

    const [
        deleteContact,
        { loading: deleteContactLoading },
    ] = useMutation<DeleteContactMutation, DeleteContactMutationVariables>(
        DELETE_CONTACT,
        {
            update: handleRefetch,
            onCompleted: (response) => {
                const { deleteContact: deleteContactRes } = response;
                if (!deleteContactRes) {
                    return;
                }
                const { errors } = deleteContactRes;
                console.error(errors);
                // TODO: handle what to do if not okay?
            },
            // TODO: handle onError
        },
    );

    const handleHideAddContactModal = useCallback(
        () => {
            setContactIdOnEdit(undefined);
            hideAddContactModal();
        },
        [hideAddContactModal, setContactIdOnEdit],
    );

    const handleSetContactIdOnEdit = useCallback(
        (contactId) => {
            setContactIdOnEdit(contactId);
            showAddContactModal();
        },
        [setContactIdOnEdit, showAddContactModal],
    );

    const handleContactDelete = useCallback((id) => {
        deleteContact({
            variables: { id },
        });
    }, [deleteContact]);

    const handleCommunicationListModalShow = useCallback(
        (contactId) => {
            setContactIdForCommunication(contactId);
            showCommunicationListModal();
        },
        [setContactIdForCommunication, showCommunicationListModal],
    );

    const loadingContacts = contactsLoading || deleteContactLoading;

    const contactColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ContactFields, string>;
            type entityKeys = ExtractKeys<ContactFields, Entity>;
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validContactSortState.name
                        ? validContactSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum[colName],
                }),
            });

            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validContactSortState.name
                        ? validContactSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum[colName]?.name,
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<ContactFields, string, TableCellProps<string>, TableHeaderCellProps> = {
                id: 'firstName',
                title: 'Contact Person',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_, datum) => ({
                    // FIXME: this is problematic
                    value: datum.fullName,
                }),
            };

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ContactFields, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: handleContactDelete,
                    onEdit: handleSetContactIdOnEdit,
                    onViewCommunication: handleCommunicationListModalShow,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                nameColumn,
                createColumn(entityColumn, 'organization', 'Organization'),
                createColumn(entityColumn, 'country', 'Country'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validContactSortState,
            handleContactDelete,
            handleSetContactIdOnEdit,
            handleCommunicationListModalShow,
        ],
    );

    return (
        <Container
            heading="Communication and Partners"
            className={_cs(className, styles.container)}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={contactSearch}
                        placeholder="Search"
                        onChange={setContactSearch}
                    />
                    <Button
                        name={undefined}
                        onClick={showAddContactModal}
                        label="Add New Contact"
                    >
                        Add New Contact
                    </Button>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={contactPage}
                    itemsCount={contacts?.contactList?.totalCount ?? 0}
                    maxItemsPerPage={contactPageSize}
                    onActivePageChange={setContactPage}
                    onItemsPerPageChange={setContactPageSize}
                />
            )}
        >
            {loadingContacts && <Loading />}
            <Table
                className={styles.table}
                data={contacts?.contactList?.results}
                keySelector={keySelector}
                columns={contactColumns}
            />
            {shouldShowCommunicationListModal && contactIdForCommunication && (
                <Modal
                    onClose={hideCommunicationListModal}
                    heading="Communication List"
                >
                    <CommunicationTable
                        contact={contactIdForCommunication}
                    />
                </Modal>
            )}
            {shouldShowAddContactModal && (
                <Modal
                    onClose={hideAddContactModal}
                    heading={contactIdOnEdit ? 'Edit Contact' : 'Add New Contact'}
                >
                    <ContactForm
                        id={contactIdOnEdit}
                        onAddContactCache={handleRefetch}
                        onUpdateContactCache={handleUpdateContactCache}
                        onHideAddContactModal={handleHideAddContactModal}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default CommunicationAndPartners;
