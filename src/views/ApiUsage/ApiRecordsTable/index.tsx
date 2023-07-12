import React, {
    useMemo,
    useCallback,
    useState,
    useContext,
} from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    Table,
    Pager,
    useSortState,
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import Message from '#components/Message';
import Loading from '#components/Loading';
import useDebouncedValue from '#hooks/useDebouncedValue';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';

import { PurgeNull } from '#types';

import {
    ClientTrackInformationListQuery,
    ClientTrackInformationListQueryVariables,
    ExportTrackingDataMutation,
    ExportTrackingDataMutationVariables,
} from '#generated/types';

import ApiRecordsFilter from './ApiRecordsFilters';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const CLIENT_TRACK_INFORMATION_LIST = gql`
    query ClientTrackInformationList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $apiType: [String!],
        $clientCodes: [String!],
        $endTrackDate: Date,
        $startTrackDate: Date,
    ) {
        clientTrackInformationList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            apiType: $apiType,
            clientCodes: $clientCodes,
            endTrackDate: $endTrackDate,
            startTrackDate: $startTrackDate,
        ) {
            page
            pageSize
            totalCount
            results {
                id
                requestsPerDay
                trackedDate
                client {
                    id
                    name
                    code
                }
                apiTypeDisplay
            }
        }
    }
`;

const API_LIST_EXPORT = gql`
    mutation ExportTrackingData(
        $clientCodes: [String!],
        $apiType: [String!],
        $startTrackDate: Date,
        $endTrackDate: Date,
    ) {
        exportTrackingData(
            clientCodes: $clientCodes,
            apiType: $apiType,
            startTrackDate: $startTrackDate,
            endTrackDate: $endTrackDate,
        ) {
            errors
            ok
        }
    }
`;

type ApiFields = NonNullable<NonNullable<ClientTrackInformationListQuery['clientTrackInformationList']>['results']>[number];

const keySelector = (item: ApiFields) => item.id;

const defaultSorting = {
    name: 'trackedDate',
    direction: 'dsc',
};

interface ApiRecordProps {
    className?: string;
    tableClassName?: string;
    title?: string;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;
}

function ApiRecordsTable(props: ApiRecordProps) {
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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        apiQueryFilters,
        setApiQueryFilters,
    ] = useState<PurgeNull<ClientTrackInformationListQueryVariables>>();

    const handlePageSizeChange = useCallback(
        (value: number) => {
            setPageSize(value);
            setPage(1);
        },
        [],
    );

    const onFilterChange = useCallback(
        (value: PurgeNull<ClientTrackInformationListQueryVariables>) => {
            setApiQueryFilters(value);
            setPageSize(10);
        },
        [],
    );

    const apiVariables = useMemo(
        (): ClientTrackInformationListQueryVariables => ({
            ordering,
            page: debouncedPage,
            pageSize,
            ...apiQueryFilters,
        }),
        [
            ordering,
            debouncedPage,
            pageSize,
            apiQueryFilters,
        ],
    );

    const {
        previousData,
        data: ApiData = previousData,
        loading: loadingApiData,
    } = useQuery<ClientTrackInformationListQuery,
        ClientTrackInformationListQueryVariables>(CLIENT_TRACK_INFORMATION_LIST, {
            variables: apiVariables,
        });

    const [
        exportApiRecords,
        { loading: exportingApiRecords },
    ] = useMutation<ExportTrackingDataMutation, ExportTrackingDataMutationVariables>(
        API_LIST_EXPORT,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportTrackingData: exportTrackingDataResponse } = response;
                if (!exportTrackingDataResponse) {
                    return;
                }
                const { errors, ok } = exportTrackingDataResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    notify({
                        children: 'Export started successfully!',
                    });
                }
            },
            onError: (err) => {
                notify({
                    children: err.message,
                    variant: 'error',
                });
            },
        },
    );

    const handleExportTableData = useCallback(
        () => {
            exportApiRecords({
                variables: apiQueryFilters,
            });
        },
        [
            exportApiRecords,
            apiQueryFilters,
        ],
    );

    const totalApiCount = ApiData?.clientTrackInformationList?.totalCount ?? 0;
    const apiRecords = ApiData?.clientTrackInformationList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<ApiFields, string>(
                'api_name',
                'API',
                (item) => item.apiTypeDisplay,
                { sortable: true },
            ),
            createTextColumn<ApiFields, string>(
                'client__code',
                'Client Code',
                (item) => item.client?.code,
                { sortable: true },
            ),
            createDateColumn<ApiFields, string>(
                'tracked_date',
                'Date',
                (item) => item.trackedDate,
                { sortable: true },
            ),
            createNumberColumn<ApiFields, string>(
                'requests_per_day',
                'Requests',
                (item) => item.requestsPerDay,
                { sortable: true },
            ),
        ]),
        [],
    );

    return (
        <Container
            compactContent
            className={_cs(className, styles.apiRecordsTable)}
            contentClassName={styles.content}
            heading={title || 'Logs'}
            headerActions={(
                <ConfirmButton
                    confirmationHeader="Confirm Export"
                    confirmationMessage="Are you sure you want to export this table data?"
                    name={undefined}
                    onConfirm={handleExportTableData}
                    disabled={exportingApiRecords}
                >
                    Export
                </ConfirmButton>
            )}
            footerContent={!pagerDisabled && (
                <Pager
                    activePage={page}
                    itemsCount={totalApiCount}
                    maxItemsPerPage={pageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={handlePageSizeChange}
                    itemsPerPageControlHidden={pagerPageControlDisabled}
                />
            )}
            description={(
                <ApiRecordsFilter
                    onFilterChange={onFilterChange}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                {totalApiCount > 0 && (
                    <Table
                        className={_cs(styles.table, tableClassName)}
                        data={apiRecords}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                    />
                )}
            </SortContext.Provider>
            {loadingApiData && <Loading absolute />}
            {!loadingApiData && totalApiCount <= 0 && (
                <Message
                    message="No logs found."
                />
            )}
        </Container>
    );
}
export default ApiRecordsTable;
