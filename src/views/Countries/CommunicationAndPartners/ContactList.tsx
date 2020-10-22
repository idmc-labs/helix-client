import React, { useMemo } from 'react';

import {
    IoMdAddCircle, IoMdCreate, IoMdRemove,
} from 'react-icons/io';
import { FaEdit } from 'react-icons/fa';

import {
    Table,
    createColumn,
    TableHeaderCell,
    TableCell,
    useSortState,
    TableSortDirection,
    Numeral,
    ConfirmButton,
} from '@togglecorp/toggle-ui';

import {
    CommunicationEntity,
    ContactEntity,
} from '#types';

import QuickActionButton from '#components/QuickActionButton';
import styles from './styles.css';

interface ContactListProps {
    contactsList: ContactEntity[];
    onShowAddCommunicationModal: (id: ContactEntity['id']) => void;
    communicationsList: CommunicationEntity[];
    onDeleteCommunication: (id: CommunicationEntity['id']) => void;
    onSetCommunicationIdOnEdit: (id: CommunicationEntity['id']) => void;
    onDeleteContact: (id: ContactEntity['id']) => void;
    onSetContactIdOnEdit: (id: ContactEntity['id']) => void;
}

function groupList<T, K>(
    items: T[],
    groupKeySelector: (item: T) => K,
) {
    const mapping = new Map<K, T[]>();
    items.forEach((item) => {
        const key = groupKeySelector(item);
        const mappedValue = mapping.get(key);
        if (mappedValue) {
            mapping.set(
                key,
                [
                    ...mappedValue,
                    item,
                ],
            );
        } else {
            mapping.set(key, [item]);
        }
    });
    return [...mapping].map(([key, value]) => ({
        key,
        value,
    }));
}
const groupCommunicationByContact = (
    contacts: ContactEntity[],
    communications: CommunicationEntity[],
) => {
    const groupedCommunications = groupList(
        communications,
        (communication) => communication.contact.id,
    );
    const contactWithCommunication = contacts.map((contact) => ({
        ...contact,
        communications: groupedCommunications.find((com) => com.key === contact.id)?.value ?? [],
    }));
    return contactWithCommunication;
};

function ContactList(props:ContactListProps) {
    const {
        contactsList,
        onShowAddCommunicationModal,
        communicationsList,
        onDeleteCommunication,
        onSetCommunicationIdOnEdit,
        onDeleteContact,
        onSetContactIdOnEdit,
    } = props;

    const contactWithCommunications = useMemo(
        () => groupCommunicationByContact(contactsList, communicationsList),
        [contactsList, communicationsList],
    );

    if (contactsList.length < 0) {
        return null;
    }

    return (
        <>
            {contactWithCommunications.map((contact) => (
                <div
                    key={contact.id}
                >
                    <div
                        className={styles.contactRow}
                    >
                        <h3>
                            {`${contact.firstName} ${contact.lastName}`}
                        </h3>
                        <h3>
                            {contact.organization.title}
                        </h3>
                        <h3>
                            {contact.jobTitle}
                        </h3>
                        <ConfirmButton
                            name="delete-contact"
                            onConfirm={() => onDeleteContact(contact.id)}
                            confirmationHeader="Confirm Delete"
                            confirmationMessage="Are you sure you want to delete?"
                        >
                            <IoMdRemove />
                        </ConfirmButton>
                        <QuickActionButton
                            name="edit"
                            onClick={() => onSetContactIdOnEdit(contact.id)}
                        >
                            <FaEdit />
                        </QuickActionButton>
                        <QuickActionButton
                            name="add"
                            onClick={() => onShowAddCommunicationModal(contact.id)}
                        >
                            <IoMdAddCircle />
                            Add New Communication
                        </QuickActionButton>
                    </div>
                    {contact.communications.length > 0 && (
                        <b>
                            Communications:
                        </b>
                    )}
                    {contact.communications.map((com) => (
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: 10,
                                alignItems: 'flex-start',
                            }}
                            key={com.id}
                        >
                            {com.subject}
                            <>
                                <QuickActionButton
                                    name="add"
                                    onClick={() => onSetCommunicationIdOnEdit(com.id)}
                                >
                                    <IoMdCreate />
                                </QuickActionButton>
                                <ConfirmButton
                                    name="delete-communication"
                                    onConfirm={() => onDeleteCommunication(com.id)}
                                    confirmationHeader="Confirm Delete"
                                    confirmationMessage="Are you sure you want to delete?"
                                >
                                    <IoMdRemove />
                                </ConfirmButton>
                            </>
                        </div>
                    ))}
                </div>
            ))}
        </>
    );
}

export default ContactList;
