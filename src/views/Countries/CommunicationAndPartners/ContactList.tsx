import React, { useMemo } from 'react';

import {
    IoMdAddCircle, IoMdCreate, IoMdRemove,
} from 'react-icons/io';

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

import { isNotDefined } from '@togglecorp/fujs';

import {
    CommunicationEntity,
    ContactEntity,
} from '#types';

import QuickActionButton from '#components/QuickActionButton';

const getColumns = () => {
    const stringColumn = (colName: string) => ({
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            name: colName,
            sortable: false,
        },
        cellAsHeader: true,
        cellRenderer: TableCell,
        cellRendererParams: (_: number, datum: ContactEntity) => ({
            value: datum[colName],
        }),
        valueSelector: (v: ContactEntity) => v[colName],
        valueType: 'string',
    });

    const numberColumn = (colName: number) => ({
        headerCellRenderer: TableHeaderCell,
        headerCellRendererParams: {
            name: colName,
            sortable: false,
        },
        cellAsHeader: true,
        cellRenderer: Numeral,
        cellRendererParams: (_: number, datum: ContactEntity) => ({
            value: datum[colName],
        }),
        valueSelector: (v: ContactEntity) => v[colName],
        valueType: 'number',
    });

    return [
        createColumn(numberColumn, 'id', 'Id'),
        createColumn(stringColumn, 'name', 'Name'),
        createColumn(stringColumn, 'jobTitle', 'Job Title'),
    ];
};

const columns = getColumns();

interface ContactListProps {
    contactsList: ContactEntity[];
    onShowAddCommunicationModal: (id: ContactEntity['id']) => void;
    communicationsList: CommunicationEntity[];
    onDeleteCommunication: (id: CommunicationEntity['id']) => void;
    onSetCommunicationIdOnEdit: (id: CommunicationEntity['id']) => void;
    onDeleteContact: (id: ContactEntity['id']) => void;
}

const keySelector = (item: ContactEntity) => item.id;

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
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                            alignItems: 'flex-start',
                        }}
                    >
                        <h3>{contact.firstName}</h3>
                        <ConfirmButton
                            name="delete-contact"
                            onConfirm={() => onDeleteContact(contact.id)}
                            confirmationHeader="Confirm Delete"
                            confirmationMessage="Are you sure you want to delete?"
                        >
                            <IoMdRemove />
                        </ConfirmButton>
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
                    {contact.communications.slice(0, 3).map((com) => (
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
