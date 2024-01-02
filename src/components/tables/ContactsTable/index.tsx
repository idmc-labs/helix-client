import React, { useCallback, useState, useMemo, useContext } from 'react';
import { gql, useQuery, useMutation } from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    Table,
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

import { expandObject } from '#utils/common';
import Message from '#components/Message';
import Container from '#components/Container';
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

import useFilterState from '#hooks/useFilterState';
import ContactForm from '#components/forms/ContactForm';
import CommunicationTable from '#components/tables/CommunicationTable';
import ContactsFilter from './ContactsFilter/index';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const GET_CONTACTS_LIST = gql`
    query ContactList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ContactFilterDataInputType,
    ) {
        contactList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
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

type ContactFields = NonNullable<NonNullable<ContactListQuery['contactList']>['results']>[number];

const keySelector = (item: ContactFields) => item.id;

interface ContactsTableProps {
    className?: string;
}

function ContactsTable(props: ContactsTableProps) {
    const {
        className,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        // rawFilter,
        filter,
        setFilter,

        rawPageSize,
        pageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<ContactListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [expandedRow, setExpandedRow] = useState<string | undefined>();

    const [
        shouldShowAddContactModal,
        editableContactId,
        showAddContactModal,
        hideAddContactModal,
    ] = useModalState();

    const handleRowExpand = useCallback(
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
            />
        ),
    );

    const contactsVariables = useMemo(
        (): ContactListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<ContactListQueryVariables['filters']>>(
                filter,
                {},
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
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
                variables: contactsVariables,
            });
        },
        [exportContacts, contactsVariables],
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
                // TODO: should pass this using context
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
            createTextColumn<ContactFields, string>(
                'countries_of_operation__idmc_short_name',
                'Countries of Operation',
                (item) => item.countriesOfOperation?.map((c) => c.idmcShortName).join(', '),
                { sortable: true },
                'large',
            ),
            createNumberColumn<ContactFields, string>(
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
                undefined,
                2,
            ),
        ].filter(isDefined)),
        [
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
            compactContent
            heading="Communication and Partners"
            className={_cs(className, styles.container)}
            contentClassName={styles.content}
            headerActions={(
                <>
                    {contactPermissions?.add && (
                        <Button
                            name={undefined}
                            onClick={showAddContactModal}
                        >
                            Add Contact
                        </Button>
                    )}
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingContacts}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            description={(
                <ContactsFilter
                    onFilterChange={setFilter}
                />
            )}
            footerContent={(
                <Pager
                    activePage={rawPage}
                    itemsCount={totalContactsCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
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
                    />
                </Modal>
            )}
        </Container>
    );
}

export default ContactsTable;
