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

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
    } = props;

    const HeaderComponent = () => (
        <p className={styles.Header}>
            Communication and Partners
        </p>
    );

    const [contactIdOnEdit, setContactIdOnEdit] = useState('');
    const [communicationIdOnEdit, setCommunicationIdOnEdit] = useState<CommunicationEntity['id']>('');

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
        setCommunicationIdOnEdit('');
        hideAddCommunicationModal();
    }, [hideAddCommunicationModal, setContactIdForCommunication, setCommunicationIdOnEdit]);

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

    const handleDeleteCommunicationCache = useCallback(
        (cache, { data: { deleteCommunication: { communication: id } } }) => {
            const cacheCommunications = cache.readQuery({
                query: GET_COMMUNICATIONS_LIST,
            });

            const { communicationList: { results } } = cacheCommunications;
            const newResults = [...results].filter((res: { id: string; }) => res.id !== id.id);
            cache.writeQuery({
                query: GET_COMMUNICATIONS_LIST,
                data: {
                    communicationList: {
                        __typename: 'CommunicationListType', // TODO figure out way for this
                        results: newResults,
                    },
                },
            });
        }, [],
    );

    const [deleteCommunication,
        {
            loading: deleteCommunicationLoading,
        },
    ] = useMutation<DeleteCommunicationResponse, DeleteCommunicationVariables>(
        DELETE_COMMUNICATION,
        {
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
            onCompleted: (response: DeleteContactResponse) => {
                if (!response.deleteContact.errors) {
                    refetchContacts();
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

    const handleUpdateCommunicationCache = useCallback((cache, { data }) => {
        console.log('handleUpdateCommunicationCache---', data);
        const existingCommunications = cache.readQuery({
            query: GET_COMMUNICATIONS_LIST,
        });

        console.log('data----', data);
        // Add the new communciation to the cache
        // const newCommunication = data.updateCommunication;
        // console.log('newCommuniation----', newCommunication);
        // cache.writeQuery({
        //     query: GET_COMMUNICATIONS_LIST,
        //     data: {
        //         communicationsList: {
        //             results: [
        //                 newCommunication,
        //                 ...existingCommunications.communicationsList.results,
        //             ],
        //         },
        //     },
        // });
    }, []);

    return (
        <Container className={_cs(className, styles.container)}>
            <Header
                heading={<HeaderComponent />}
                actions={(
                    <>
                        <QuickActionButton
                            name="add"
                            onClick={handleContactFormOpen}
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
                    onClose={onHideAddCommunicationModal}
                    heading="Add Communication"
                >
                    <CommunicationForm
                        onCommunicationCreate={handleCommunicationCreate}
                        contact={contactIdForCommunication}
                        communicationOnEdit={communicationOnEdit}
                        onUpdateCommunicationCache={handleUpdateCommunicationCache}
                        onHideAddCommunicationModal={onHideAddCommunicationModal}
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
                            onContactCreate={handleContactCreate}
                        />
                    </Modal>
                )
            }
        </Container>
    );
}

export default CommunicationAndPartners;
