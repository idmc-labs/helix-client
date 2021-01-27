import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import { IoIosSearch } from 'react-icons/io';
import {
    NumeralProps,
    Numeral,
    TextInput,
    Table,
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Modal,
    Button,
} from '@togglecorp/toggle-ui';

import StringCell, { StringCellProps } from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Container from '#components/Container';
import { CountryOption } from '#components/CountryMultiSelectInput';
import DateCell from '#components/tableHelpers/Date';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';
import { ExtractKeys } from '#types';

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

interface CommunicationAndPartnersProps {
    className?: string;
    defaultCountryOption?: CountryOption | undefined | null;
}

function CommunicationAndPartners(props: CommunicationAndPartnersProps) {
    const {
        className,
        defaultCountryOption,
    } = props;
    const { sortState, setSortState } = useSortState();
    const validContactSortState = sortState || contactDefaultSortState;

    const contactOrdering = validContactSortState.direction === TableSortDirection.asc
        ? validContactSortState.name
        : `-${validContactSortState.name}`;

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
        data: contacts,
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
            type stringKeys = ExtractKeys<ContactFields, string>;
            type entitiesKeys = ExtractKeys<ContactFields, Array<Entity | null | undefined>>;
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
            const entitiesColumn = (colName: entitiesKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum[colName]?.map((item) => item.name).join(', '),
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
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: ContactFields) => ({
                    value: datum[colName]?.name,
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<ContactFields, string, StringCellProps, TableHeaderCellProps> = {
                id: 'fullName',
                title: 'Contact Person',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_, datum) => ({
                    // FIXME: No need to set default string value
                    value: datum.fullName ?? '',
                }),
            };

            // eslint-disable-next-line max-len
            const communicationCount: TableColumn<ContactFields, string, NumeralProps, TableHeaderCellProps> = {
                id: 'communicationCount',
                title: 'Communications',
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    sortable: false,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_, datum) => ({
                    value: datum.communications?.totalCount,
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
                    onDelete: contactPermissions?.delete ? handleContactDelete : undefined,
                    onEdit: contactPermissions?.change ? showAddContactModal : undefined,
                    onViewCommunication: showCommunicationListModal,
                }),
            };

            return [
                createColumn(dateColumn, 'createdAt', 'Date Created'),
                nameColumn,
                createColumn(entityColumn, 'organization', 'Organization'),
                createColumn(entitiesColumn, 'countriesOfOperation', 'Countries of Operation'),
                communicationCount,
                actionColumn,
            ];
        },
        [
            setSortState,
            validContactSortState,
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
                <Table
                    className={styles.table}
                    data={contacts?.contactList?.results}
                    keySelector={keySelector}
                    columns={contactColumns}
                />
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
