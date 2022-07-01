import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Table,
    useSortState,
    Pager,
    Modal,
    Button,
    SortContext,
    createExpandColumn,
    ConfirmButton,
    useTableRowExpansion,
} from '@togglecorp/toggle-ui';
import { PurgeNull } from '#types';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';

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
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import ContactForm from '#components/forms/ContactForm';
import ContactsFilter from './ContactsFilter/index';
import CommunicationTable from './CommunicationTable';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_CONTACTS_LIST = gql`
    query ContactList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $name: String,
        $countriesOfOperation: [String!],
    ) {
        contactList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            nameContains: $name,
            countriesOfOperation: $countriesOfOperation,
        ) {
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
        $name: String,
        $countriesOfOperation: [String!],
    ) {
        exportContacts(
            nameContains: $name,
            countriesOfOperation: $countriesOfOperation,
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

interface ContactsTableProps {
    className?: string;
    defaultCountryOption?: CountryOption | undefined | null;
}

function ContactsTable(props: ContactsTableProps) {
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
                // compact
            />
        ),
    );

    const onFilterChange = React.useCallback(
        (value: PurgeNull<ContactListQueryVariables>) => {
            setContactsQueryFilters(value);
            setContactPage(1);
        }, [],
    );

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setContactPageSize(value);
            setContactPage(1);
        },
        [],
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
                    notify({
                        children: 'Contact deleted successfully!',
                        variant: 'success',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
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
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (error) => {
                notify({
                    children: error.message,
                    variant: 'error',
                });
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
        () => ([
            createExpandColumn<ContactFields, string>(
                'expand-button',
                '',
                handleRowExpand,
                // FIXME: should pass this using context
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
                { sortable: true },
                'large',
            ),
            createTextColumn<ContactFields, string>(
                'organization__name',
                'Organization',
                (item) => item.organization?.name,
                { sortable: true },
                'large',
            ),
            defaultCountryOption
                ? undefined
                : createTextColumn<ContactFields, string>(
                    'countries_of_operation__idmc_short_name',
                    'Countries of Operation',
                    (item) => item.countriesOfOperation?.map((c) => c.idmcShortName).join(', '),
                    { sortable: true },
                    'large',
                ),
            defaultCountryOption
                ? undefined
                : createNumberColumn<ContactFields, string>(
                    'communications',
                    'Communications',
                    (item) => item.communications?.totalCount,
                ),
            createActionColumn<ContactFields, string>(
                'action',
                '',
                (datum) => ({
                    id: datum.id,
                    onDelete: contactPermissions?.delete ? handleContactDelete : undefined,
                    onEdit: contactPermissions?.change ? showAddContactModal : undefined,
                }),
            ),
        ].filter(isDefined)),
        [
            defaultCountryOption,
            handleContactDelete,
            showAddContactModal,
            expandedRow,
            handleRowExpand,
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
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingContacts}
                    >
                        Export
                    </ConfirmButton>
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
                    onItemsPerPageChange={handlePageSizeChange}
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
                        resizableColumn
                        fixedColumnWidth
                    />
                </SortContext.Provider>
            )}
            {loadingContacts && <Loading absolute />}
            {!loadingContacts && totalContactsCount <= 0 && (
                <Message
                    message="No contacts found."
                />
            )}
            {shouldShowAddContactModal && (
                <Modal
                    onClose={hideAddContactModal}
                    heading={editableContactId ? 'Edit Contact' : 'Add Contact'}
                    size="large"
                    freeHeight
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

export default ContactsTable;
