import React, {
    useContext,
    useMemo,
    useCallback,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    Table,
    Modal,
    Button,
    Pager,
    SortContext,
    createYesNoColumn,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import { getOperationName } from 'apollo-link';

import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createActionColumn,
    createDateColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import useModalState from '#hooks/useModalState';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import ClientRecordForm from '#components/forms/ClientRecordForm';
import useFilterState from '#hooks/useFilterState';
import { PurgeNull } from '#types';
import { hasNoData } from '#utils/common';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NotificationContext from '#components/NotificationContext';

import {
    ClientListQuery,
    ClientListQueryVariables,
    ExportClientsMutation,
    ExportClientsMutationVariables,
} from '#generated/types';
import ClientRecordsFilter from './ClientRecordsFilters';

import styles from './styles.module.css';

const CLIENT_LIST = gql`
    query ClientList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ClientFilterDataInputType,
    ) {
        clientList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            filters: $filters,
        ) {
            page
            pageSize
            totalCount
            results {
                id
                acronym
                code
                contactEmail
                contactName
                contactWebsite
                isActive
                name
                shareSource
                useCases
                useCasesDisplay
                optedOutOfEmails
                type
                typeDisplay
                createdAt
                createdBy {
                    id
                    fullName
                }
            }
        }
    }
`;

const CLIENTS_DOWNLOAD = gql`
    mutation ExportClients(
        $filters: ClientFilterDataInputType!,
    ) {
        exportClients(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type ClientFields = NonNullable<NonNullable<ClientListQuery['clientList']>['results']>[number];

const keySelector = (item: ClientFields) => item.id;

interface ClientRecordProps {
    className?: string;
    tableClassName?: string;
    title?: string;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;
}

function ClientRecordsTable(props: ClientRecordProps) {
    const {
        className,
        tableClassName,
        title,
        pagerDisabled,
        pagerPageControlDisabled,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        rawFilter,
        initialFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<PurgeNull<NonNullable<ClientListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'name',
            direction: 'asc',
        },
    });

    const { user } = useContext(DomainContext);
    const recordEditPermission = user?.permissions?.event;

    const [
        shouldShowClientAddModal,
        editableClientRecord,
        showAddClientModal,
        hideAddClientModal,
    ] = useModalState<string | undefined>();

    const clientVariables = useMemo(
        (): ClientListQueryVariables => ({
            ordering,
            page,
            pageSize,
            filters: filter,
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        previousData,
        data: clientListData = previousData,
        loading: loadingClientData,
        refetch,
        error: clientError,
    } = useQuery<ClientListQuery, ClientListQueryVariables>(CLIENT_LIST, {
        variables: clientVariables,
    });

    const [
        exportClients,
        { loading: exportingClients },
    ] = useMutation<ExportClientsMutation, ExportClientsMutationVariables>(
        CLIENTS_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportClients: exportClientsResponse } = response;
                if (!exportClientsResponse) {
                    return;
                }
                const { errors, ok } = exportClientsResponse;
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
            exportClients({
                variables: {
                    filters: clientVariables.filters ?? {},
                },
            });
        },
        [exportClients, clientVariables?.filters],
    );

    const totalClientCount = clientListData?.clientList?.totalCount ?? 0;
    const clientRecords = clientListData?.clientList?.results;

    const columns = useMemo(
        () => ([
            createDateColumn<ClientFields, string>(
                'date_created',
                'Date Created',
                (item) => item.createdAt,
            ),
            createTextColumn<ClientFields, string>(
                'created_by',
                'Created By',
                (item) => item.createdBy?.fullName,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'id',
                'Code',
                (item) => item.code,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'acronym',
                'Acronym',
                (item) => item.acronym,
            ),
            createTextColumn<ClientFields, string>(
                'name',
                'Name',
                (item) => item.name,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'type',
                'Type',
                (item) => item.typeDisplay,
            ),
            createTextColumn<ClientFields, string>(
                'contactName',
                'Contact Name',
                (item) => item.contactName,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'contactEmail',
                'Contact Email',
                (item) => item.contactEmail,
            ),
            createTextColumn<ClientFields, string>(
                'contactWebsite',
                'Website',
                (item) => item.contactWebsite,
            ),
            createTextColumn<ClientFields, string>(
                'useCasesDisplay',
                'Use Cases',
                (item) => item?.useCasesDisplay?.map((useCase) => useCase).join(', '),
            ),
            createYesNoColumn<ClientFields, string>(
                'is_active',
                'Active',
                (item) => item.isActive,
                { sortable: true },
            ),
            createYesNoColumn<ClientFields, string>(
                'shareSource',
                'Share source',
                (item) => item.shareSource,
                { sortable: true },
            ),
            createActionColumn<ClientFields, string>(
                'action',
                '',
                (item) => ({
                    id: item.id,
                    onEdit: recordEditPermission?.add
                        ? showAddClientModal
                        : undefined,
                    onDelete: undefined,
                }),
                undefined,
                1,
            ),
        ]),
        [
            showAddClientModal,
            recordEditPermission?.add,
        ],
    );

    return (
        <Container
            compactContent
            className={_cs(className, styles.clientRecordsTable)}
            contentClassName={styles.content}
            heading={title || 'Clients'}
            headerActions={recordEditPermission?.add && (
                <>
                    <Button
                        name={undefined}
                        onClick={showAddClientModal}
                    >
                        Add Client
                    </Button>
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingClients}
                    >
                        Export
                    </ConfirmButton>
                </>
            )}
            footerContent={!pagerDisabled && (
                <Pager
                    activePage={rawPage}
                    itemsCount={totalClientCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                    itemsPerPageControlHidden={pagerPageControlDisabled}
                />
            )}
            description={(
                <ClientRecordsFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
        >
            {loadingClientData && <Loading absolute />}
            <SortContext.Provider value={sortState}>
                {totalClientCount > 0 && (
                    <Table
                        className={_cs(styles.table, tableClassName)}
                        data={clientRecords}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
            </SortContext.Provider>
            {!loadingClientData && (
                <TableMessage
                    errored={!!clientError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalClientCount}
                    emptyMessage="No clients found"
                    emptyMessageWithFilters="No clients found with applied filters"
                    errorMessage="Could not fetch clients"
                />
            )}
            {shouldShowClientAddModal && (
                <Modal
                    onClose={hideAddClientModal}
                    heading={editableClientRecord ? 'Edit Client' : 'Add Client'}
                    size="large"
                    freeHeight
                >
                    <ClientRecordForm
                        id={editableClientRecord}
                        refetchClientLists={refetch}
                        onCancel={hideAddClientModal}
                    />
                </Modal>
            )}
        </Container>
    );
}
export default ClientRecordsTable;
