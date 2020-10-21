import React, { useCallback, useState, useMemo } from 'react';
import {
    FaPlus,
} from 'react-icons/fa';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
    _cs,
    caseInsensitiveSubmatch,
    compareStringSearch,
} from '@togglecorp/fujs';

import { Modal } from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import Header from '#components/Header';
import QuickActionButton from '#components/QuickActionButton';

import useBasicToggle from '#hooks/toggleBasicState';
import useModalState from '#hooks/useModalState';

import { transformToFormError } from '#utils/errorTransform';

import ContactForm from './ContactForm';
import ContactList from './ContactList';
import CommunicationForm from './CommunicationForm';

import {
    OrganizationEntity,
    ContactEntity,
    CommunicationEntity,
} from '#types';

import styles from './styles.css';

const GET_CONTACTS_LIST = gql`
query ContactList {
    contactList {
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
    }
  }
`;

const GET_COMMUNICATIONS_LIST = gql`
query CommunicationList {
    communicationList {
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
            communication {
                id
            }
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
export interface BasicEntity {
    id: string;
    name: string;
}

interface ContactsResponseFields {
    contactList: {
        results: ContactEntity[]
    }
}

interface CommunicationsResponseFields {
    communicationList: {
        results: CommunicationEntity[]
    }
}

interface DeleteCommunicationVariables {
    id: string | undefined,
}

interface DeleteCommunicationResponse {
    deleteCommunication:
    {
        ok: boolean,
        errors?: {
            field: string,
            message: string,
        }[],
        communication: {
            id: string,
        },
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

// TODO typefix for cache
const handleAddCommunicationCache = (
    cache, data: { data: {createCommunication: { communication: CommunicationEntity }}},
) => {
    const { data: { createCommunication: { communication } } } = data;

    const cacheCommunications = cache.readQuery({
        query: GET_COMMUNICATIONS_LIST,
    });
    const { communicationList: { results } } = cacheCommunications;

    const newResults = [...results, communication];
    cache.writeQuery({
        query: GET_COMMUNICATIONS_LIST,
        data: {
            communicationList: {
                __typename: 'CommunicationListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

// TODO typefix for cache
const handleUpdateCommunicationCache = (
    cache, data: { data: {updateCommunication: { communication: CommunicationEntity }}},
) => {
    const { data: { updateCommunication: { communication } } } = data;

    const cacheCommunications = cache.readQuery({
        query: GET_COMMUNICATIONS_LIST,
    });
    const { communicationList: { results } } = cacheCommunications;

    const updatedResults = [...results].map((res) => {
        if (res.id === communication.id) {
            return communication;
        }
        return res;
    });
    cache.writeQuery({
        query: GET_COMMUNICATIONS_LIST,
        data: {
            communicationList: {
                results: updatedResults,
            },
        },
    });
};

// TODO typefix for cache
const handleDeleteCommunicationCache = (
    cache, data: { data: {deleteCommunication: { communication: { id: CommunicationEntity['id']} }}},
) => {
    const { data: { deleteCommunication: { communication: { id } } } } = data;

    const cacheCommunications = cache.readQuery({
        query: GET_COMMUNICATIONS_LIST,
    });
    const { communicationList: { results } } = cacheCommunications;

    const newResults = [...results].filter((res: { id: string; }) => res.id !== id);
    cache.writeQuery({
        query: GET_COMMUNICATIONS_LIST,
        data: {
            communicationList: {
                __typename: 'CommunicationListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

// TODO typefix for cache
const handleAddContactCache = (
    cache, data: { data: {createContact: { contact: ContactEntity }}},
) => {
    const { data: { createContact: { contact } } } = data;

    const cacheContacts = cache.readQuery({
        query: GET_CONTACTS_LIST,
    });
    const { contactList: { results } } = cacheContacts;

    const newResults = [...results, contact];
    cache.writeQuery({
        query: GET_CONTACTS_LIST,
        data: {
            contactList: {
                __typename: 'ContactListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

// TODO typefix for cache
const handleUpdateContactCache = (
    cache, data: { data: {updateContact: { contact: ContactEntity }}},
) => {
    const { data: { updateContact: { contact } } } = data;

    const cacheContacts = cache.readQuery({
        query: GET_CONTACTS_LIST,
    });
    const { contactList: { results } } = cacheContacts;

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
                results: updatedResults,
            },
        },
    });
};

// TODO typefix for cache
const handleDeleteContactCache = (
    cache, data: { data: {deleteContact: { contact: { id: ContactEntity['id']} }}},
) => {
    const { data: { deleteContact: { contact: { id } } } } = data;

    const cacheContacts = cache.readQuery({
        query: GET_CONTACTS_LIST,
    });
    const { contactList: { results } } = cacheContacts;

    const newResults = [...results].filter((res: { id: string; }) => res.id !== id);
    cache.writeQuery({
        query: GET_CONTACTS_LIST,
        data: {
            contactList: {
                __typename: 'ContactListType', // TODO figure out way for this
                results: newResults,
            },
        },
    });
};

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
    } = props;

    const HeaderComponent = () => (
        <p className={styles.header}>
            Communication and Partners
        </p>
    );

    const [contactIdOnEdit, setContactIdOnEdit] = useState<ContactEntity['id']>('');
    const [communicationIdOnEdit, setCommunicationIdOnEdit] = useState<CommunicationEntity['id']>('');
    const [contactIdForCommunication, setContactIdForCommunication] = useState('');

    const resetContactOnEdit = useCallback(
        () => {
            setContactIdOnEdit('');
        }, [],
    );

    const {
        data: contacts,
        refetch: refetchContacts,
        loading: contactsLoading,
    } = useQuery<ContactsResponseFields>(GET_CONTACTS_LIST);

    const {
        data: communications,
        refetch: refetchCommunications,
        loading: communicationsLoading,
    } = useQuery<CommunicationsResponseFields>(GET_COMMUNICATIONS_LIST);

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

    const onShowAddCommunicationModal = useCallback((contactId) => {
        setContactIdForCommunication(contactId);
        showAddCommunicationModal();
    }, [showAddCommunicationModal, setContactIdForCommunication]);

    const handleHideAddCommunicationModal = useCallback(() => {
        setContactIdForCommunication('');
        setCommunicationIdOnEdit('');
        hideAddCommunicationModal();
    }, [hideAddCommunicationModal, setContactIdForCommunication, setCommunicationIdOnEdit]);

    const handleContactCreate = useCallback(
        (newContactId: BasicEntity['id']) => {
            refetchContacts();
            console.log(newContactId);
            // onValueChange(newContactId, 'contact' as const);
            hideAddContactModal();
        },
        [refetchContacts, hideAddContactModal],
    );
    const contactsList = contacts?.contactList?.results ?? [];
    const communicationsList = communications?.communicationList?.results ?? [];

    const [deleteCommunication,
        {
            loading: deleteCommunicationLoading,
        },
    ] = useMutation<DeleteCommunicationResponse, DeleteCommunicationVariables>(
        DELETE_COMMUNICATION,
        {
            // TODO fix type update & handleDeleteCommunicationCache
            update: handleDeleteCommunicationCache,
            onCompleted: (response: DeleteCommunicationResponse) => {
                if (!response.deleteCommunication.errors) {
                    // refetchCommunications();
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

    const onSetCommunicationIdOnEdit = useCallback(
        (communicationId) => {
            setCommunicationIdOnEdit(communicationId);
            showAddCommunicationModal();
        }, [setCommunicationIdOnEdit, showAddCommunicationModal],
    );

    const communicationOnEdit = useMemo(
        () => {
            if (!communicationIdOnEdit) {
                return undefined;
            }
            return communicationsList.find((com) => com.id === communicationIdOnEdit);
        }, [communicationIdOnEdit, communicationsList],
    );

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

    const loading = contactsLoading || communicationsLoading
        || deleteCommunicationLoading || deleteContactLoading;

    return (
        <Container className={_cs(className, styles.container)}>
            <Header
                heading={<HeaderComponent />}
                actions={(
                    <>
                        <QuickActionButton
                            name="add"
                            onClick={showAddContactModal}
                            className={styles.addContactButton}
                            label="hello"
                        >
                            <FaPlus
                                className={styles.addIcon}
                            />
                            Add New Contact
                        </QuickActionButton>
                    </>
                )}
            />
            <ContactList
                contactsList={contactsList}
                onShowAddCommunicationModal={onShowAddCommunicationModal}
                communicationsList={communicationsList}
                onDeleteCommunication={handleCommunicationDelete}
                onSetCommunicationIdOnEdit={onSetCommunicationIdOnEdit}
                onDeleteContact={onDeleteContact}
            />
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={handleHideAddCommunicationModal}
                    heading="Add Communication"
                >
                    <CommunicationForm
                        contact={contactIdForCommunication}
                        communicationOnEdit={communicationOnEdit}
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
                        heading="Add New Contact"
                    >
                        <ContactForm
                            onContactCreate={handleContactCreate}
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
