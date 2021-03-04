import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs, isDefined } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import {
    TextInput,
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,

    SortContext,
    createDateColumn,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import { createTextColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import { CountryOption } from '#components/CountryMultiSelectInput';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    ContactListQuery,
    ContactListQueryVariables,
    DeleteContactMutation,
    DeleteContactMutationVariables,
} from '#generated/types';
import ContactForm from './ContactForm';
import CommunicationTable from './CommunicationTable';
import ActionCell, { ActionProps } from './ContactActions';
import styles from './styles.css';

const GET_CONTACTS_LIST = gql`
    query ContactList($ordering: String, $page: Int, $pageSize: Int, $name: String, $countriesOfOperation: [String]) {
        contactList(ordering: $ordering, page: $page, pageSize: $pageSize, nameContains: $name, countriesOfOperation: $countriesOfOperation) {
            results {
                id
                fullName
                organization {
                    id
                    name
                }
                createdAt
                country {
                    id
                    name
                }
                countriesOfOperation {
                    id
                    name
                }
                communications {
                    totalCount
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
            errors
            ok
            result {
                id
            }
        }
    }
`;

const contactDefaultSorting = {
    name: 'created_at',
    direction: TableSortDirection.dsc,
};

type ContactFields = NonNullable<NonNullable<ContactListQuery['contactList']>['results']>[number];

const keySelector = (item: ContactFields) => item.id;

interface CommunicationAndPartnersProps {
    className?: string;
    defaultCountryOption?: CountryOption | undefined | null;
}

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
        defaultCountryOption,
    } = props;
    const sortState = useSortState();
    const { sorting } = sortState;
    const validContactSorting = sorting || contactDefaultSorting;

    const contactOrdering = validContactSorting.direction === TableSortDirection.asc
        ? validContactSorting.name
        : `-${validContactSorting.name}`;

    const [contactPage, setContactPage] = useState(1);
    const [contactSearch, setContactSearch] = useState<string | undefined>();
    const [contactPageSize, setContactPageSize] = useState(10);
    const { notify } = useContext(NotificationContext);

    const [
        shouldShowAddContactModal,
        editableContactId,
        showAddContactModal,
        hideAddContactModal,
    ] = useModalState();

    const [
        shouldShowCommunicationListModal,
        contactIdForCommunication,
        showCommunicationListModal,
        hideCommunicationListModal,
    ] = useModalState();

    const contactsVariables = useMemo(
        (): ContactListQueryVariables => ({
            ordering: contactOrdering,
            page: contactPage,
            pageSize: contactPageSize,
            name: contactSearch,
            countriesOfOperation: defaultCountryOption ? [defaultCountryOption.id] : undefined,
        }),
        [contactOrdering, contactPage, contactPageSize, contactSearch, defaultCountryOption],
    );

    const {
        previousData,
        data: contacts = previousData,
        loading: contactsLoading,
        refetch: refetchContact,
    } = useQuery<ContactListQuery>(GET_CONTACTS_LIST, {
        variables: contactsVariables,
    });

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
                const { errors, result } = deleteContactRes;
                if (errors) {
                    notify({ children: 'Sorry, contact could not be deleted!' });
                }
                if (result) {
                    notify({ children: 'Contact deleted successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleContactDelete = useCallback((id) => {
        deleteContact({
            variables: { id },
        });
    }, [deleteContact]);

    const loadingContacts = contactsLoading || deleteContactLoading;

    const { user } = useContext(DomainContext);
    const contactPermissions = user?.permissions?.contact;

    const contactColumns = useMemo(
        () => {
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
                    onDelete: contactPermissions?.delete ? handleContactDelete : undefined,
                    onEdit: contactPermissions?.change ? showAddContactModal : undefined,
                    onViewCommunication: showCommunicationListModal,
                }),
            };

            return [
                createDateColumn<ContactFields, string>(
                    'created_at',
                    'Date Created',
                    (item) => item.createdAt,
                    { sortable: true },
                ),
                createTextColumn<ContactFields, string>(
                    'full_name',
                    'Contact Person',
                    (item) => item.fullName,
                    { cellAsHeader: true, sortable: true },
                ),
                createTextColumn<ContactFields, string>(
                    'organization__name',
                    'Organization',
                    (item) => item.organization?.name,
                    { sortable: true },
                ),
                defaultCountryOption
                    ? undefined
                    : createTextColumn<ContactFields, string>(
                        'countries_of_operation',
                        'Countries of Operation',
                        (item) => item.countriesOfOperation?.map((c) => c.name).join(', '),
                    ),
                defaultCountryOption
                    ? undefined
                    : createNumberColumn<ContactFields, string>(
                        'communications',
                        'Communications',
                        (item) => item.communications?.totalCount,
                    ),
                actionColumn,
            ].filter(isDefined);
        },
        [
            defaultCountryOption,
            handleContactDelete,
            showAddContactModal,
            showCommunicationListModal,
            contactPermissions?.delete,
            contactPermissions?.change,
        ],
    );

    const totalContactsCount = contacts?.contactList?.totalCount ?? 0;

    return (
        <Container
            heading="Communication and Partners"
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={(
                <>
                    <TextInput
                        icons={<IoIosSearch />}
                        name="search"
                        value={contactSearch}
                        placeholder="Search"
                        onChange={setContactSearch}
                    />
                    {contactPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddContactModal}
                        >
                            Add Contact
                        </Button>
                    )}
                </>
            )}
            footerContent={(
                <Pager
                    activePage={contactPage}
                    itemsCount={totalContactsCount}
                    maxItemsPerPage={contactPageSize}
                    onActivePageChange={setContactPage}
                    onItemsPerPageChange={setContactPageSize}
                />
            )}
        >
            {totalContactsCount > 0 && (
                <SortContext.Provider value={sortState}>
                    <Table
                        className={styles.table}
                        data={contacts?.contactList?.results}
                        keySelector={keySelector}
                        columns={contactColumns}
                    />
                </SortContext.Provider>
            )}
            {loadingContacts && <Loading absolute />}
            {!loadingContacts && totalContactsCount <= 0 && (
                <Message
                    message="No contacts found."
                />
            )}
            {shouldShowCommunicationListModal && contactIdForCommunication && (
                <Modal
                    onClose={hideCommunicationListModal}
                    heading="Communication List"
                >
                    <CommunicationTable
                        className={styles.communicationTable}
                        contact={contactIdForCommunication}
                        defaultCountry={defaultCountryOption}
                    />
                </Modal>
            )}
            {shouldShowAddContactModal && (
                <Modal
                    onClose={hideAddContactModal}
                    heading={editableContactId ? 'Edit Contact' : 'Add Contact'}
                >
                    <ContactForm
                        id={editableContactId}
                        onAddContactCache={handleRefetch}
                        onHideAddContactModal={hideAddContactModal}
                        defaultCountryOption={defaultCountryOption}
                    />
                </Modal>
            )}
        </Container>
    );
}

export default CommunicationAndPartners;
