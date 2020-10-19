import React, { useCallback, useState, useMemo } from 'react';
import {
    IoMdAddCircle,
    IoMdSearch,
    IoMdClose,
} from 'react-icons/io';
import { gql, useQuery, useMutation } from '@apollo/client';
import {
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

const GET_COUNTRIES_LIST = gql`
query CountryList {
    countryList {
      results {
        id
        name
      }
    }
  }
`;

const GET_ORGANIZATIONS_LIST = gql`
query OrganizationList {
    organizationList {
      results {
        id
        title
      }
    }
  }
`;

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

interface CountriesResponseFields {
    countryList: {
        results: BasicEntity[]
    }
}

interface OrganizationsResponseFields {
    organizationList: {
        results: OrganizationEntity[]
    }
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

function CommunicationAndPartners() {
    const HeaderComponent = () => (
        <p className={styles.Header}>
            Communication and Partners
        </p>
    );

    const [contactIdOnEdit, setContactIdOnEdit] = useState('');

    const resetContactOnEdit = useCallback(
        () => {
            setContactIdOnEdit('');
        }, [],
    );

    const {
        data: countries,
        refetch: refetchCountries,
        loading: countriesLoading,
    } = useQuery<CountriesResponseFields>(GET_COUNTRIES_LIST);

    const countriesList = countries?.countryList?.results ?? [];

    const {
        data: organizations,
        refetch: refetchOrganizations,
        loading: organizationsLoading,
    } = useQuery<OrganizationsResponseFields>(GET_ORGANIZATIONS_LIST);

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

    const organizationsList = organizations?.organizationList?.results.map(
        (ol) => ({
            id: ol.id,
            name: ol.title,
        }),
    ) ?? [];

    const [
        contactFormOpened,
        handleContactFormOpen,
        handleContactFormClose,
    ] = useBasicToggle(resetContactOnEdit);

    const [
        shouldShowAddCommunicationModal,
        showAddCommunicationModal,
        hideAddCommunicationModal,
    ] = useModalState();
    const [contactIdForCommunication, setContactIdForCommunication] = useState('');

    const onShowAddCommunicationModal = useCallback((contactId) => {
        setContactIdForCommunication(contactId);
        showAddCommunicationModal();
    }, [showAddCommunicationModal, setContactIdForCommunication]);

    const onHideAddCommunicationModal = useCallback(() => {
        setContactIdForCommunication('');
        hideAddCommunicationModal();
    }, [hideAddCommunicationModal, setContactIdForCommunication]);

    const handleContactCreate = useCallback(
        (newContactId: BasicEntity['id']) => {
            refetchContacts();
            console.log(newContactId);
            // onValueChange(newContactId, 'contact' as const);
            handleContactFormClose();
        },
        [refetchContacts, handleContactFormClose],
    );

    const handleCommunicationCreate = useCallback(
        (newCommunicationId: BasicEntity['id']) => {
            refetchCommunications();
            console.log(newCommunicationId);
            // onValueChange(newCommunicationId, 'contact' as const);
            onHideAddCommunicationModal();
        },
        [refetchCommunications, onHideAddCommunicationModal],
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
            onCompleted: (data: DeleteCommunicationResponse) => {
                if (data.deleteCommunication.errors) {
                    const deleteCommunicationError = transformToFormError(
                        data.deleteCommunication.errors,
                    );
                    console.log('deleteCommunicationError--', deleteCommunicationError);
                    // onErrorSet(deleteCommunicationError);
                } else {
                    refetchCommunications();
                }
            },
        },
    );

    const onDeleteCommunication = useCallback((communicationId) => {
        deleteCommunication({
            variables: {
                id: communicationId,
            },
        });
    }, [deleteCommunication]);

    const [communicationIdOnEdit, setCommunicationIdOnEdit] = useState<CommunicationEntity['id']>('');

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
            onCompleted: (data: DeleteContactResponse) => {
                if (data.deleteContact.errors) {
                    const deleteContactError = transformToFormError(
                        data.deleteContact.errors,
                    );
                    console.log('deleteContactError--', deleteContactError);
                    // onErrorSet(deleteCommunicationError);
                } else {
                    refetchContacts();
                }
            },
        },
    );

    const onDeleteContact = useCallback((contactId) => {
        deleteContact({
            variables: {
                id: contactId,
            },
        });
    }, [deleteContact]);

    const updateContactCache = (cache, { data }) => {
        // If this is for the public feed, do nothing
        // if (isPublic) {
        //     return null;
        // }
        // Fetch the todos from the cache
        console.log('cache---', cache);
        const existingContacts = cache.readQuery({
            query: GET_CONTACTS_LIST,
        });
        // Add the new todo to the cache
        const newContact = data.createContact.contact;
        console.log('newContact---', newContact);
        console.log('existing contacts---', existingContacts);
        cache.writeQuery({
            query: GET_CONTACTS_LIST,
            data: {
                contactList: {
                    results: [newContact, ...existingContacts.contactList.results],
                },
            },
        });
    };

    return (
        <Container className={styles.container}>
            <Header
                heading={<HeaderComponent />}
                actions={(
                    <>
                        <QuickActionButton
                            name="add"
                            onClick={handleContactFormOpen}
                        >
                            <IoMdAddCircle />
                            Add New Contact
                        </QuickActionButton>
                    </>
                )}
            />
            <ContactList
                contactsList={contactsList}
                onShowAddCommunicationModal={onShowAddCommunicationModal}
                communicationsList={communicationsList}
                onDeleteCommunication={onDeleteCommunication}
                onSetCommunicationIdOnEdit={onSetCommunicationIdOnEdit}
                onDeleteContact={onDeleteContact}
            />
            {shouldShowAddCommunicationModal && (
                <Modal
                    onClose={onHideAddCommunicationModal}
                    heading="Add Communication"
                >
                    <CommunicationForm
                        onCommunicationCreate={handleCommunicationCreate}
                        contact={contactIdForCommunication}
                        communicationOnEdit={communicationOnEdit}
                    />
                </Modal>
            )}
            {
                contactFormOpened && (
                    <Modal
                        onClose={handleContactFormClose}
                        heading="Add New Contact"
                    >
                        <ContactForm
                            countriesList={countriesList}
                            organizationsList={organizationsList}
                            onContactCreate={handleContactCreate}
                            onUpdateContactCache={updateContactCache}
                        />
                    </Modal>
                )
            }
        </Container>
    );
}

export default CommunicationAndPartners;
