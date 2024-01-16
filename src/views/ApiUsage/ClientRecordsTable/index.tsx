import React, {
    useContext,
    useMemo,
    useCallback,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Table,
    Modal,
    Button,
    Pager,
    SortContext,
    createYesNoColumn,
} from '@togglecorp/toggle-ui';

import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createActionColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import useModalState from '#hooks/useModalState';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import ClientRecordForm from '#components/forms/ClientRecordForm';
import useFilterState from '#hooks/useFilterState';
import { PurgeNull } from '#types';
import { hasNoData } from '#utils/common';

import ClientRecordsFilter from './ClientRecordsFilters';

import {
    ClientListQuery,
    ClientListQueryVariables,
} from '#generated/types';

import styles from './styles.css';

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
                name
                isActive
                code
                createdBy {
                    id
                    fullName
                }
            }
        }
    }
`;

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
        previousData,
        data: clientListData = previousData,
        loading: loadingClientData,
        refetch: refetchClientRecords,
        error: clientError,
    } = useQuery<ClientListQuery, ClientListQueryVariables>(CLIENT_LIST, {
        variables: clientVariables,
    });

    const handleClientCreate = useCallback(() => {
        refetchClientRecords(clientVariables);
        hideAddClientModal();
    }, [
        refetchClientRecords,
        clientVariables,
        hideAddClientModal,
    ]);

    const totalClientCount = clientListData?.clientList?.totalCount ?? 0;
    const clientRecords = clientListData?.clientList?.results;

    const columns = useMemo(
        () => ([
            /*
            TODO: Add column after field added to server
            createDateTimeColumn<ClientFields, string>(
                'date_created',
                'Date Created',
                (item) => item.createdAt,
            ),
            */
            createTextColumn<ClientFields, string>(
                'id',
                'Code',
                (item) => item.code,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'name',
                'Name',
                (item) => item.name,
                { sortable: true },
            ),
            createYesNoColumn<ClientFields, string>(
                'is_active',
                'Active',
                (item) => item.isActive,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'created_by',
                'Created By',
                (item) => item.createdBy?.fullName,
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
                <Button
                    name={undefined}
                    onClick={showAddClientModal}
                >
                    Add Client
                </Button>
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
                        onClientCreate={handleClientCreate}
                        onClientCreateCancel={hideAddClientModal}
                    />
                </Modal>
            )}
        </Container>
    );
}
export default ClientRecordsTable;
