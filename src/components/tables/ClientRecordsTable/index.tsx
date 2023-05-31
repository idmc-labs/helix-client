import React, {
    useContext,
    useMemo,
    useCallback,
    useState,
} from 'react';
import { _cs, isDefined } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Table,
    Modal,
    Button,
    Pager,
    useSortState,
    SortContext,
    createYesNoColumn,
} from '@togglecorp/toggle-ui';

import {
    createTextColumn,
    createActionColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import Loading from '#components/Loading';
import useModalState from '#hooks/useModalState';
import useDebouncedValue from '#hooks/useDebouncedValue';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import ClientRecordForm from '#components/forms/ClientRecordForm';
import { PurgeNull } from '#types';

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
        $isActive: Boolean,
        $name: String,
    ) {
        clientList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            name: $name,
            isActive: $isActive,
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
                    isAdmin
                    dateJoined
                }
            }
        }
    }
`;

type ClientFields = NonNullable<NonNullable<ClientListQuery['clientList']>['results']>[number];

const keySelector = (item: ClientFields) => item.id;

const defaultSorting = {
    name: 'name',
    direction: 'dsc',
};

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

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const debouncedPage = useDebouncedValue(page);

    const { user } = useContext(DomainContext);
    const recordEditPermission = user?.permissions?.event;

    const [
        shouldShowClientAddModal,
        editableClientRecord,
        showAddClientModal,
        hideAddClientModal,
    ] = useModalState<string | undefined>();

    const [
        clientQueryFilters,
        setClientQueryFilters,
    ] = useState<PurgeNull<ClientListQueryVariables>>();

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const onFilterChange = useCallback(
        (value: PurgeNull<ClientListQueryVariables>) => {
            setClientQueryFilters(value);
            setPageSize(10);
        },
        [],
    );

    const clientVariables = useMemo(
        (): ClientListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            ...clientQueryFilters,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            clientQueryFilters,
        ],
    );

    const {
        previousData,
        data: clientListData = previousData,
        loading: loadingClientData,
        refetch: refetchClientRecords,
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
            createTextColumn<ClientFields, string>(
                'id',
                'Client Code',
                (item) => item.code,
                { sortable: true },
            ),
            createTextColumn<ClientFields, string>(
                'name',
                'Client Name',
                (item) => item.name,
                { sortable: true },
            ),
            createYesNoColumn<ClientFields, string>(
                'is_active',
                'Active',
                (item) => item.isActive,
                { sortable: true },
            ), createTextColumn<ClientFields, string>(
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
        ].filter(isDefined)),
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
            heading={title || 'Records'}
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
                    activePage={page}
                    itemsCount={totalClientCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                    itemsPerPageControlHidden={pagerPageControlDisabled}
                />
            )}
            description={(
                <ClientRecordsFilter
                    onFilterChange={onFilterChange}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                {totalClientCount > 0 && (
                    <Table
                        className={tableClassName}
                        data={clientRecords}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
            </SortContext.Provider>
            {loadingClientData && <Loading absolute />}
            {!loadingClientData && totalClientCount <= 0 && (
                <Message
                    message="No Client data found."
                />
            )}
            {shouldShowClientAddModal && (
                <Modal
                    onClose={hideAddClientModal}
                    heading={editableClientRecord ? 'Edit Client Record' : 'Add Client Record'}
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
