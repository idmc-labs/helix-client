import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Table,
    TableColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    createDateColumn,
    createExpandColumn,
    ConfirmButton,
    useTableRowExpansion,
} from '@togglecorp/toggle-ui';
import { PurgeNull } from '#types';
import { createTextColumn, createNumberColumn } from '#components/tableHelpers';

import Message from '#components/Message';
import Container from '#components/Container';
import { CountryOption } from '#components/selections/CountryMultiSelectInput';
import Loading from '#components/Loading';
import DomainContext from '#components/DomainContext';
import NotificationContext from '#components/NotificationContext';

import useModalState from '#hooks/useModalState';

import {
    ContactListQuery,
    ContactListQueryVariables,
    DeleteContactMutation,
    DeleteContactMutationVariables,
    ExportContactsMutation,
    ExportContactsMutationVariables,
} from '#generated/types';
import { DOWNLOADS_COUNT } from '#components/Downloads';

import ContactForm from './ContactForm';
import ContactsFilter from './ContactsFilter/index';
import CommunicationTable from './CommunicationTable';
import ActionCell, { ActionProps } from './ContactActions';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_CONTACTS_LIST = gql`
    query ContactList($ordering: String, $page: Int, $pageSize: Int, $name: String, $countriesOfOperation: [String!]) {
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
                    idmcShortName
                }
                countriesOfOperation {
                    id
                    idmcShortName
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

const CONTACTS_DOWNLOAD = gql`
    mutation ExportContacts(
        $countriesOfOperation: [String!],
        $nameContains: String,
        $country: ID,
        $firstNameContains: String,
        $lastNameContains: String,
        $id: String
        ){
        exportContacts(
            countriesOfOperation: $countriesOfOperation,
            nameContains: $nameContains,
            country: $country,
            firstNameContains: $firstNameContains,
            lastNameContains: $lastNameContains,
            id: $id
            ) {
            errors
            ok
        }
    }
`;

const contactDefaultSorting = {
    name: 'created_at',
    direction: 'dsc',
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

    const contactOrdering = validContactSorting.direction === 'asc'
        ? validContactSorting.name
        : `-${validContactSorting.name}`;

    const [contactPage, setContactPage] = useState(1);
    const [contactPageSize, setContactPageSize] = useState(10);
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [expandedRow, setExpandedRow] = useState<string | undefined>();

    const [
        contactsQueryFilters,
        setContactsQueryFilters,
    ] = useState<PurgeNull<ContactListQueryVariables>>();

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

    const handleRowExpand = React.useCallback(
        (rowId: string) => {
            setExpandedRow((previousExpandedId) => (
                previousExpandedId === rowId ? undefined : rowId
            ));
        }, [],
    );

    const rowModifier = useTableRowExpansion<ContactFields, string>(
        expandedRow,
        ({ datum }) => (
            <CommunicationTable
                contact={datum.id}
                defaultCountry={defaultCountryOption}
            />
        ),
    );

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ContactListQueryVariables>) => {
            setContactsQueryFilters(value);
            setContactPage(1);
        }, [],
    );

    const contactsVariables = useMemo(
        (): ContactListQueryVariables => ({
            ordering: contactOrdering,
            page: contactPage,
            pageSize: contactPageSize,
            countriesOfOperation: defaultCountryOption ? [defaultCountryOption.id] : undefined,
            ...contactsQueryFilters,
        }),
        [
            contactOrdering,
            contactPage,
            contactPageSize,
            defaultCountryOption,
            contactsQueryFilters,
        ],
    );

    const contactsExportVariables = useMemo(
        (): ExportContactsMutationVariables => ({
            countriesOfOperation: defaultCountryOption ? [defaultCountryOption.id] : undefined,
            ...contactsQueryFilters,
        }),
        [contactsQueryFilters, defaultCountryOption],
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
                    notifyGQLError(errors);
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

    const [
        exportContacts,
        { loading: exportingContacts },
    ] = useMutation<ExportContactsMutation, ExportContactsMutationVariables>(
        CONTACTS_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportContacts: exportContactsResponse } = response;
                if (!exportContactsResponse) {
                    return;
                }
                const { errors, ok } = exportContactsResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({ children: 'Export started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            exportContacts({
                variables: contactsExportVariables,
            });
        },
        [exportContacts, contactsExportVariables],
    );

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
                createExpandColumn<ContactFields, string>(
                    'expand-button',
                    '',
                    handleRowExpand,
                    expandedRow,
                ),
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
                        (item) => item.countriesOfOperation?.map((c) => c.idmcShortName).join(', '),
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
            expandedRow,
            handleRowExpand,
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
                    {contactPermissions?.add && (
                        <>
                            <ConfirmButton
                                confirmationHeader="Confirm Export"
                                confirmationMessage="Are you sure you want to export this table data ?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={exportingContacts}
                            >
                                Export
                            </ConfirmButton>
                            <Button
                                name={undefined}
                                onClick={showAddContactModal}
                            >
                                Add Contact
                            </Button>
                        </>
                    )}
                </>
            )}
            description={(
                <ContactsFilter
                    onFilterChange={onFilterChange}
                />
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
                        rowModifier={rowModifier}
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
