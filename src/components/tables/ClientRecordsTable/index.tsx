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
    useMutation,
} from '@apollo/client';
import {
    Table,
    // Modal,
    Button,
    Pager,
    useSortState,
    SortContext,
    createYesNoColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
} from '#components/tableHelpers';
// import NotificationContext from '#components/NotificationContext';
import Message from '#components/Message';
import Loading from '#components/Loading';
import useModalState from '#hooks/useModalState';
import useDebouncedValue from '#hooks/useDebouncedValue';
import Container from '#components/Container';
import DomainContext from '#components/DomainContext';

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
    ) {
        clientList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
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
    name: 'created_at',
    direction: 'dsc',
};

interface ClientRecordProps {
    className?: string;
    tableClassName?: string;
    title?: string;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;
}

function ClientRecordsTable(props: ClientRecordProps) {
    const {
        className,
        tableClassName,
        title,
        page: pageFromProps,
        pageSize: pageSizeFromProps,
        pagerDisabled,
        pagerPageControlDisabled,
    } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;
    const [page, setPage] = useState(pageFromProps ?? 1);
    const [pageSize, setPageSize] = useState(pageSizeFromProps ?? 10);
    const debouncedPage = useDebouncedValue(page);

    const { user } = useContext(DomainContext);
    const recordEditPermission = user?.permissions?.event;

    // const {
    //     notify,
    //     notifyGQLError,
    // } = useContext(NotificationContext);

    const [
        shouldShowClientAddModal, ,
        showAddClientModal,
        hideAddClientModal,
    ] = useModalState<undefined>();

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const clientVariables = useMemo(
        () => ({
            ordering,
            page: debouncedPage,
            pageSize,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
        ],
    );

    const {
        previousData,
        data: clientListData = previousData,
        loading: loadingClientData,
        // refetch: refetchClientRecords,
    } = useQuery<ClientListQuery, ClientListQueryVariables>(CLIENT_LIST, {
        variables: clientVariables,
    });

    const totalClientCount = clientListData?.clientList?.totalCount ?? 0;
    const clientRecords = clientListData?.clientList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<ClientFields, string>(
                'id',
                'Client ID',
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
                (item) => item.createdBy?.id,
                { sortable: true },
            ),
        ].filter(isDefined)),
        [],
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
        </Container>
    );
}
export default ClientRecordsTable;
