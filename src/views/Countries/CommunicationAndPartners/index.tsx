import React, { useCallback, useState, useMemo } from 'react';
import { gql, useQuery, useMutation, MutationUpdaterFn } from '@apollo/client';
import {
    _cs,
} from '@togglecorp/fujs';

import {
    IoIosChatboxes,
    IoIosPersonAdd,
    IoIosSearch,
    IoMdPersonAdd,
} from 'react-icons/io';

import {
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    TableCell,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import QuickActionButton from '#components/QuickActionButton';

import useModalState from '#hooks/useModalState';

import ContactForm from './ContactForm';
import CommunicationForm from './CommunicationForm';
import CommunicationTable from './CommunicationTable';

import {
    CommunicationEntity,
    ContactEntity,
    ExtractKeys,
} from '#types';

import DateCell from '#components/tableHelpers/Date';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';

import ActionCell, { ActionProps } from '#components/tableHelpers/Action';

import styles from './styles.css';

const GET_CONTACTS_LIST = gql`
query ContactList($ordering: String, $page: Int, $pageSize: Int, $firstName: String) {
    contactList(ordering: $ordering, page: $page, pageSize: $pageSize, firstName_Icontains: $firstName,) {
      results {
        id
        lastName
        phone
        organization {
          id
          title
        }
        jobTitle
        gender
        firstName
        email
        designation
        createdAt
        country {
          id
          name
        }
        countriesOfOperation {
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

const GET_COMMUNICATIONS_LIST = gql`
query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $subject: String, $contact: ID,) {
    communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, subject_Icontains: $subject, contact: $contact) {
      results {
        id
        content
        dateTime
        medium
        subject
        title
        contact {
          id
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
            contact {
                id
            }
        }
    }
`;

interface ContactsResponseFields {
    contactList: {
        results: ContactEntity[];
        totalCount: number;
        page: number;
        pageSize: number;
    }
}

interface CommunicationsResponseFields {
    communicationList: {
        results: CommunicationEntity[];
        totalCount: number;
        page: number;
        pageSize: number;
    }
}

interface DeleteContactVariables {
    id: string | undefined,
}

interface DeleteContactResponse {
    deleteContact:
    {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        contact: {
            id: string,
        },
    }
}

interface CommunicationAndPartnersProps {
    className? : string;
}

type CacheCommunications = CommunicationsResponseFields | null | undefined;
type CacheContacts = ContactsResponseFields | null | undefined;

const contactDefaultSortState = {
    name: 'first_name',
    direction: TableSortDirection.asc,
};

const keySelector = (item: ContactEntity) => item.id;

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || contactDefaultSortState;

    const contactOrdering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(25);

    const [contactIdOnEdit, setContactIdOnEdit] = useState<ContactEntity['id']>('');
    const [communicationIdOnEdit, setCommunicationIdOnEdit] = useState<CommunicationEntity['id']>('');
    const [contactIdForCommunication, setContactIdForCommunication] = useState('');

    const contactsVariables = useMemo(
        () => ({
            ordering: contactOrdering,
            page,
            pageSize,
            firstName: search, // TODO: Search with firstName or lastName
        }),
        [contactOrdering, page, pageSize, search],
    );

    const {
        data: contacts,
        error: errorContacts, // TODO: handle error
        loading: contactsLoading,
    } = useQuery<ContactsResponseFields>(GET_CONTACTS_LIST, {
        variables: contactsVariables,
    });

    const contactsList = contacts?.contactList?.results;

    const [
        shouldShowAddContactModal,
        showAddContactModal,
        hideAddContactModal,
    ] = useModalState();

    const handleHideAddContactModal = useCallback(() => {
        setContactIdOnEdit('');
        hideAddContactModal();
    }, [hideAddContactModal, setContactIdOnEdit]);

    const [
        shouldShowAddCommunicationModal,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();

    const [
        shouldShowCommunicationListModal,
        showCommunicationListModal,
        hideCommunicationListModal,
    ] = useModalState();

    const handleSetContactIdOnEdit = useCallback(
        (contactId) => {
            setContactIdOnEdit(contactId);
            showAddContactModal();
        }, [setContactIdOnEdit, showAddContactModal],
    );

    const handleUpdateContactCache: MutationUpdaterFn<{
        updateContact: { contact: ContactEntity }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const contact = data.data?.updateContact.contact;
        if (!contact) {
            return;
        }

        const cacheContacts: CacheContacts = cache.readQuery({
            query: GET_CONTACTS_LIST,
            variables: contactsVariables,
        });

        if (!cacheContacts) {
            return;
        }

        const results = cacheContacts?.contactList.results ?? [];
        const updatedResults = [...results].map((res) => {
            if (res.id === contact.id) {
                return contact;
            }
            return res;
        });

        cache.writeQuery({
            query: GET_CONTACTS_LIST,
            data: {
                contactList: {
                    __typename: 'ContactListType',
                    results: updatedResults,
                },
            },
        });
    }, [contactsVariables]);

    const handleAddContactCache: MutationUpdaterFn<{
        createContact: { contact: ContactEntity }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const contact = data.data?.createContact.contact;
        const cacheContacts: CacheContacts = cache.readQuery({
            query: GET_CONTACTS_LIST,
            variables: contactsVariables,
        });
        const results = cacheContacts?.contactList.results ?? [];
        const newResults = [...results, contact];
        cache.writeQuery({
            query: GET_CONTACTS_LIST,
            data: {
                contactList: {
                    __typename: 'ContactListType',
                    results: newResults,
                },
            },
        });
    }, [contactsVariables]);

    const handleDeleteContactCache: MutationUpdaterFn<{
        deleteContact: { contact: { id: ContactEntity['id'] } }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const id = data.data?.deleteContact.contact.id;
        if (!id) {
            return;
        }
        const cacheContacts: CacheContacts = cache.readQuery({
            query: GET_CONTACTS_LIST,
            variables: contactsVariables,
        });
        if (!cacheContacts) {
            return;
        }
        const results = cacheContacts?.contactList.results ?? [];
        const newResults = [...results].filter((res: { id: string; }) => res.id !== id);
        cache.writeQuery({
            query: GET_CONTACTS_LIST,
            data: {
                contactList: {
                    __typename: 'ContactListType',
                    results: newResults,
                },
            },
        });
    }, [contactsVariables]);

    const [deleteContact,
        {
            loading: deleteContactLoading,
        },
    ] = useMutation<DeleteContactResponse, DeleteContactVariables>(
        DELETE_CONTACT,
        {
            update: handleDeleteContactCache,
            onCompleted: (response: DeleteContactResponse) => {
                if (!response.deleteContact.errors) {
                    // refetchContacts();
                    // TODO: handle what to do if not okay?
                }
            },
            // TODO: handle onError
        },
    );

    const onDeleteContact = useCallback((id) => {
        deleteContact({
            variables: { id },
        });
    }, [deleteContact]);

    const communicationsVariables = useMemo(
        () => ({
            ordering: 'subject',
            page,
            pageSize,
            subject: search,
            contact: contactIdForCommunication,
        }),
        [page, pageSize, search, contactIdForCommunication],
    );

    const handleAddCommunicationCache: MutationUpdaterFn<{
        createCommunication: { communication: CommunicationEntity }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const communication = data.data?.createCommunication.communication;
        if (!communication) {
            return;
        }
        const cacheCommunications: CacheCommunications = cache.readQuery({
            query: GET_COMMUNICATIONS_LIST,
            variables: communicationsVariables,
        });
        if (!cacheCommunications) {
            return;
        }
        const results = cacheCommunications?.communicationList.results ?? [];

        const newResults = [...results, communication];
        cache.writeQuery({
            query: GET_COMMUNICATIONS_LIST,
            data: {
                communicationList: {
                    __typename: 'CommunicationListType',
                    results: newResults,
                },
            },
        });
    }, [communicationsVariables]);

    const handleUpdateCommunicationCache: MutationUpdaterFn<{
        updateCommunication: { communication: CommunicationEntity }
    }> = useCallback((cache, data) => {
        if (!data) {
            return;
        }
        const communication = data.data?.updateCommunication.communication;
        if (!communication) {
            return;
        }
        const cacheCommunications: CacheCommunications = cache.readQuery({
            query: GET_COMMUNICATIONS_LIST,
            variables: communicationsVariables,
        });
        const results = cacheCommunications?.communicationList.results;
        if (!results) {
            return;
        }
        const communicationIndex = results.findIndex(
            (com) => com.id === communication.id,
        );
        if (communicationIndex < 0) {
            return;
        }
        const updatedResults = [...results];
        updatedResults.splice(communicationIndex, 1, communication);
        cache.writeQuery({
            query: GET_COMMUNICATIONS_LIST,
            data: {
                communicationList: {
                    __typename: 'CommunicationListType',
                    results: updatedResults,
                },
            },
        });
    }, [communicationsVariables]);

    const onShowAddCommunicationModal = useCallback((contactId) => {
        setContactIdForCommunication(contactId);
        showAddCommunicationModal();
    }, [showAddCommunicationModal, setContactIdForCommunication]);

    const onShowCommunicationListModal = useCallback((contactId) => {
        setContactIdForCommunication(contactId);
        showCommunicationListModal();
    }, [setContactIdForCommunication, showCommunicationListModal]);

    const handleHideAddCommunicationModal = useCallback(() => {
        setCommunicationIdOnEdit('');
        hideAddCommunicationModal();
    }, [hideAddCommunicationModal, setCommunicationIdOnEdit]);

    // TODO handle loading
    const loading = contactsLoading || deleteContactLoading;

    const contactColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ContactEntity, string>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: ContactEntity) => ({
                    value: datum[colName],
                }),
            });
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: ContactEntity) => ({
                    value: datum[colName],
                }),
            });

            const organizationColumn = (colName: string) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellAsHeader: true,
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: ContactEntity) => ({
                    value: datum.organization.title,
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<ContactEntity, string, LinkProps, TableHeaderCellProps> = {
                id: 'first_name',
                title: 'Contact Person',
                cellAsHeader: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'first_name'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: `${datum.firstName} ${datum.lastName}`,
                    link: '#',
                }),
            };

            // eslint-disable-next-line max-len
            const actionColumn: TableColumn<ContactEntity, string, ActionProps, TableHeaderCellProps> = {
                id: 'action',
                title: '',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: ActionCell,
                cellRendererParams: (_, datum) => ({
                    id: datum.id,
                    onDelete: onDeleteContact,
                    onEdit: handleSetContactIdOnEdit,
                    children: (
                        <>
                            <QuickActionButton
                                name="view"
                                onClick={() => onShowCommunicationListModal(datum.id)}
                            >
                                <IoIosChatboxes />
                            </QuickActionButton>
                            <QuickActionButton
                                name="add-communication"
                                onClick={() => onShowAddCommunicationModal(datum.id)}
                            >
                                <IoIosPersonAdd />
                            </QuickActionButton>
                        </>
                    ),
                }),
            };

            return [
                createColumn(stringColumn, 'id', 'ID'),
                nameColumn,
                createColumn(organizationColumn, 'organization', 'Organization'),
                createColumn(dateColumn, 'createdAt', 'Created At'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validSortState,
            onDeleteContact,
            handleSetContactIdOnEdit,
            onShowAddCommunicationModal,
            onShowCommunicationListModal,
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
                        value={search}
                        placeholder="Search"
                        onChange={setSearch}
                    />
                    <QuickActionButton
                        name="add"
                        onClick={showAddContactModal}
                        className={styles.addButton}
                        label="hello"
                        transparent
                    >
                        <IoMdPersonAdd
                            className={styles.addIcon}
                        />
                        Add New Contact
                    </QuickActionButton>
                </>
            )}
            footerContent={(
                <Pager
                    activePage={page}
                    itemsCount={contacts?.contactList?.totalCount ?? 0}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                />
            )}
        >
            <Table
                className={styles.table}
                data={contactsList}
                keySelector={keySelector}
                columns={contactColumns}
            />
            {shouldShowCommunicationListModal && (
                <Modal
                    onClose={hideCommunicationListModal}
                    heading="Communication List"
                >
                    <CommunicationTable
                        onShowAddCommunicationModal={showAddCommunicationModal}
                        contactIdForCommunication={contactIdForCommunication}
                        onSetCommunicationIdOnEdit={setCommunicationIdOnEdit}
                    />
                </Modal>
            )}
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={handleHideAddCommunicationModal}
                    heading={communicationIdOnEdit ? 'Edit Communication' : 'Add Communication'}
                >
                    <CommunicationForm
                        contact={contactIdForCommunication}
                        id={communicationIdOnEdit}
                        onUpdateCommunicationCache={handleUpdateCommunicationCache}
                        onHideAddCommunicationModal={handleHideAddCommunicationModal}
                        onAddCommunicationCache={handleAddCommunicationCache}
                    />
                </Modal>
            )}
            {
                shouldShowAddContactModal && (
                    <Modal
                        onClose={hideAddContactModal}
                        heading={contactIdOnEdit ? 'Edit Contact' : 'Add New Contact'}
                    >
                        <ContactForm
                            id={contactIdOnEdit}
                            onAddContactCache={handleAddContactCache}
                            onUpdateContactCache={handleUpdateContactCache}
                            onHideAddContactModal={handleHideAddContactModal}
                        />
                    </Modal>
                )
            }
        </Container>
    );
}

export default CommunicationAndPartners;
