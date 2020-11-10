import React, { useCallback, useState, useMemo } from 'react';
import { gql, useQuery, useMutation, MutationUpdaterFn } from '@apollo/client';
import {
    _cs,
} from '@togglecorp/fujs';

import {
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
    Button,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';

import useModalState from '#hooks/useModalState';

import ContactForm from './ContactForm';
import CommunicationForm from './CommunicationForm';
import CommunicationTable from './CommunicationTable';

import {
    ExtractKeys,
} from '#types';

import {
    ContactListQuery,
    CreateContactMutation,
    UpdateContactMutation,
    DeleteContactMutation,
    DeleteContactMutationVariables,
    CommunicationListQuery,
    CreateCommunicationMutation,
    UpdateCommunicationMutation,
    DeleteCommunicationMutation,
    DeleteCommunicationMutationVariables,
} from '#generated/types';
import DateCell from '#components/tableHelpers/Date';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';

import Loading from '#components/Loading';

import ActionCell, { ActionProps } from './ContactActions';
import styles from './styles.css';

const GET_CONTACTS_LIST = gql`
query ContactList($ordering: String, $page: Int, $pageSize: Int, $name: String) {
    contactList(ordering: $ordering, page: $page, pageSize: $pageSize, nameContains: $name ) {
        results {
            id
            lastName
            phone
            organization {
                id
                name
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
query CommunicationList($ordering: String, $page: Int, $pageSize: Int, $contact: ID, $subject: String) {
    communicationList(ordering: $ordering, page: $page, pageSize: $pageSize, contact: $contact, subjectContains: $subject) {
        results {
            id
            content
            dateTime
            subject
            title
            contact {
                id
            }
            medium {
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

const DELETE_COMMUNICATION = gql`
    mutation DeleteCommunication($id: ID!) {
        deleteCommunication(id: $id) {
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
    name: '-createdAt',
    direction: TableSortDirection.asc,
};

const communicationDefaultSortState = {
    name: 'subject',
    direction: TableSortDirection.asc,
};

type ContactFields = NonNullable<NonNullable<ContactListQuery['contactList']>['results']>[number];
type CommunicationFields = NonNullable<NonNullable<CommunicationListQuery['communicationList']>['results']>[number];
const keySelector = (item: ContactFields) => item.id;

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
    } = props;

    const { sortState, setSortState } = useSortState();
    const validContactSortState = sortState || contactDefaultSortState;
    const validCommunicationSortState = sortState || communicationDefaultSortState;

    const contactOrdering = validContactSortState.direction === TableSortDirection.asc
        ? validContactSortState.name
        : `-${validContactSortState.name}`;

    const communicationOrdering = validCommunicationSortState.direction === TableSortDirection.asc
        ? validCommunicationSortState.name
        : `-${validCommunicationSortState.name}`;

    const [contactPage, setContactPage] = useState(1);
    const [contactSearch, setContactSearch] = useState<string | undefined>();
    const [contactPageSize, setContactPageSize] = useState(25);

    const [communicationPage, setCommunicationPage] = useState(1);
    const [communicationPageSize, setCommunicationPageSize] = useState(25);
    const [communicationSearch, setCommunicationSearch] = useState<string | undefined>();
    const [contactIdOnEdit, setContactIdOnEdit] = useState<ContactFields['id']>('');
    const [communicationIdOnEdit, setCommunicationIdOnEdit] = useState<CommunicationFields['id']>('');
    const [contactIdForCommunication, setContactIdForCommunication] = useState('');

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
        // error: errorContacts, // TODO: handle error
        loading: contactsLoading,
    } = useQuery<ContactListQuery>(GET_CONTACTS_LIST, {
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

    const handleUpdateContactCache: MutationUpdaterFn<UpdateContactMutation> = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const contact = data.data?.updateContact?.result;
            if (!contact) {
                return;
            }

            const cacheContacts = cache.readQuery<ContactListQuery>({
                query: GET_CONTACTS_LIST,
                variables: contactsVariables,
            });

            if (!cacheContacts) {
                return;
            }
            const results = cacheContacts?.contactList?.results;
            if (!results) {
                return;
            }
            const contactIndex = results.findIndex((res) => res.id === contact.id);
            if (contactIndex < 0) {
                return;
            }
            const updatedResults = [...results];
            updatedResults.splice(contactIndex, 1, contact);
            cache.writeQuery({
                query: GET_CONTACTS_LIST,
                data: {
                    contactList: {
                        __typename: 'ContactListType',
                        results: updatedResults,
                    },
                },
            });
        }, [contactsVariables],
    );

    const handleAddContactCache: MutationUpdaterFn<CreateContactMutation> = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const contact = data.data?.createContact?.result;
            if (!contact) {
                return;
            }
            const cacheContacts = cache.readQuery<ContactListQuery>({
                query: GET_CONTACTS_LIST,
                variables: contactsVariables,
            });

            const results = cacheContacts?.contactList?.results ?? [];
            const newResults = [contact, ...results];
            cache.writeQuery({
                query: GET_CONTACTS_LIST,
                data: {
                    contactList: {
                        __typename: 'ContactListType',
                        results: newResults,
                    },
                },
            });
        }, [contactsVariables],
    );

    const handleDeleteContactCache: MutationUpdaterFn<DeleteContactMutation> = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const id = data.data?.deleteContact?.result?.id;
            if (!id) {
                return;
            }
            const cacheContacts = cache.readQuery<ContactListQuery>({
                query: GET_CONTACTS_LIST,
                variables: contactsVariables,
            });
            if (!cacheContacts) {
                return;
            }
            const results = cacheContacts?.contactList?.results;
            if (!results) {
                return;
            }
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
        }, [contactsVariables],
    );

    const [
        deleteContact,
        { loading: deleteContactLoading },
    ] = useMutation<DeleteContactMutation, DeleteContactMutationVariables>(
        DELETE_CONTACT,
        {
            update: handleDeleteContactCache,
            onCompleted: (response) => {
                const { deleteContact: deleteContactRes } = response;
                if (!deleteContactRes) {
                    return;
                }
                const { errors } = deleteContactRes;
                if (errors) {
                    // TODO: handle what to do if errors?
                }
                // TODO: handle what to do if not okay?
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
            ordering: communicationOrdering,
            page: communicationPage,
            pageSize: communicationPageSize,
            subject: communicationSearch,
            contact: contactIdForCommunication,
        }),
        [
            communicationOrdering,
            communicationPage,
            communicationPageSize,
            communicationSearch,
            contactIdForCommunication,
        ],
    );

    const {
        data: communications,
        // error: errorCommunications,
        loading: communicationsLoading,
    } = useQuery<CommunicationListQuery>(GET_COMMUNICATIONS_LIST, {
        variables: communicationsVariables,
    });
    const communicationsList = communications?.communicationList?.results;
    const communicationTotalCount = communications?.communicationList?.totalCount;

    const handleAddCommunicationCache: MutationUpdaterFn<CreateCommunicationMutation> = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const communication = data.data?.createCommunication?.result;
            if (!communication) {
                return;
            }
            const cacheCommunications = cache.readQuery<CommunicationListQuery>({
                query: GET_COMMUNICATIONS_LIST,
                variables: communicationsVariables,
            });
            const results = cacheCommunications?.communicationList?.results ?? [];
            const newResults = [communication, ...results];
            cache.writeQuery({
                query: GET_COMMUNICATIONS_LIST,
                data: {
                    communicationList: {
                        __typename: 'CommunicationListType',
                        results: newResults,
                    },
                },
            });
        }, [communicationsVariables],
    );

    const handleUpdateCommunicationCache: MutationUpdaterFn<
    UpdateCommunicationMutation
    > = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const communication = data.data?.updateCommunication?.result;
            if (!communication) {
                return;
            }
            const cacheCommunications = cache.readQuery<CommunicationListQuery>({
                query: GET_COMMUNICATIONS_LIST,
                variables: communicationsVariables,
            });
            if (!cacheCommunications) {
                return;
            }
            const results = cacheCommunications?.communicationList?.results;
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
        }, [communicationsVariables],
    );

    const handleDeleteCommunicationCache: MutationUpdaterFn<
    DeleteCommunicationMutation
    > = useCallback(
        (cache, data) => {
            if (!data) {
                return;
            }
            const id = data.data?.deleteCommunication?.result?.id;
            if (!id) {
                return;
            }
            const cacheCommunications = cache.readQuery<CommunicationListQuery>({
                query: GET_COMMUNICATIONS_LIST,
                variables: communicationsVariables,
            });
            if (!cacheCommunications) {
                return;
            }
            const results = cacheCommunications?.communicationList?.results;
            if (!results) {
                return;
            }
            const newResults = [...results].filter((res: { id: string; }) => res.id !== id);
            cache.writeQuery({
                query: GET_COMMUNICATIONS_LIST,
                data: {
                    communicationList: {
                        __typename: 'CommunicationListType',
                        results: newResults,
                    },
                },
            });
        }, [communicationsVariables],
    );

    const [
        deleteCommunication,
        { loading: deleteCommunicationLoading },
    ] = useMutation<DeleteCommunicationMutation, DeleteCommunicationMutationVariables>(
        DELETE_COMMUNICATION,
        {
            update: handleDeleteCommunicationCache,
            onCompleted: (response) => {
                const { deleteCommunication: deleteCommunicationRes } = response;
                if (!deleteCommunicationRes) {
                    return;
                }
                const { errors } = deleteCommunicationRes;
                if (errors) {
                    // TODO: handle what to do if not okay?
                }
            },
            // TODO: handle onError
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

    const loadingContacts = contactsLoading || deleteContactLoading;
    const loadingCommunications = deleteCommunicationLoading || communicationsLoading;

    const contactColumns = useMemo(
        () => {
            type stringKeys = ExtractKeys<ContactFields, string>;
            const dateColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validContactSortState.name
                        ? validContactSortState.direction
                        : undefined,
                },
                cellRenderer: DateCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum[colName],
                }),
            });

            const organizationColumn = (colName: string) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: false,
                    sortDirection: colName === validContactSortState.name
                        ? validContactSortState.direction
                        : undefined,
                },
                cellRenderer: TableCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum.organization.name,
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<ContactFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'first_name',
                title: 'Contact Person',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validContactSortState.name === 'first_name'
                        ? validContactSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: `${datum.firstName} ${datum.lastName}`,
                    link: '#',
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
                    onDelete: onDeleteContact,
                    onEdit: handleSetContactIdOnEdit,
                    onViewCommunication: onShowCommunicationListModal,
                    onAddCommunication: onShowAddCommunicationModal,
                }),
            };

            return [
                nameColumn,
                createColumn(organizationColumn, 'organization', 'Organization'),
                createColumn(dateColumn, 'createdAt', 'Created At'),
                actionColumn,
            ];
        },
        [
            setSortState,
            validContactSortState,
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
                        value={contactSearch}
                        placeholder="Search"
                        onChange={setContactSearch}
                    />
                    <Button
                        name={undefined}
                        onClick={showAddContactModal}
                        className={styles.addButton}
                        transparent
                        icons={<IoMdPersonAdd className={styles.addIcon} />}
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
                        onSetCommunicationIdOnEdit={setCommunicationIdOnEdit}
                        onCommunicationDelete={handleCommunicationDelete}
                        communicationsList={communicationsList}
                        page={communicationPage}
                        pageSize={communicationPageSize}
                        onSetPage={setCommunicationPage}
                        onSetPageSize={setCommunicationPageSize}
                        search={communicationSearch}
                        onSetCommunicationSearch={setCommunicationSearch}
                        totalCount={communicationTotalCount}
                        validSortState={validCommunicationSortState}
                        onSetSortState={setSortState}
                        loading={loadingCommunications}
                    />
                </Modal>
            )}
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={handleHideAddCommunicationModal}
                    heading={communicationIdOnEdit ? 'Edit Communication' : 'Add New Communication'}
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
            {shouldShowAddContactModal && (
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
            )}
        </Container>
    );
}

export default CommunicationAndPartners;
