import React, {
    useMemo,
    useCallback,
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
    SortContext,
    ConfirmButton,
} from '@togglecorp/toggle-ui';

import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createExternalLinkColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import Loading from '#components/Loading';
import Container from '#components/Container';
import NotificationContext from '#components/NotificationContext';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import useFilterState from '#hooks/useFilterState';
import { PurgeNull } from '#types';
import {
    ClientTrackInformationListQuery,
    ClientTrackInformationListQueryVariables,
    ExportTrackingDataMutation,
    ExportTrackingDataMutationVariables,
} from '#generated/types';
import { hasNoData } from '#utils/common';

import ApiRecordsFilter from './ApiRecordsFilters';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

const CLIENT_TRACK_INFORMATION_LIST = gql`
    query ClientTrackInformationList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: ClientTrackInfoFilterDataInputType,
    ) {
        clientTrackInformationList(
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
                requestsPerDay
                trackedDate
                client {
                    id
                    name
                    code
                }
                apiTypeDisplay
                description
                exampleRequest
                responseType
                usage
            }
        }
    }
`;

const API_LIST_EXPORT = gql`
    mutation ExportTrackingData(
        $filters: ClientTrackInfoFilterDataInputType!,
    ) {
        exportTrackingData(
            filters: $filters,
        ) {
            errors
            ok
        }
    }
`;

type ApiFields = NonNullable<NonNullable<ClientTrackInformationListQuery['clientTrackInformationList']>['results']>[number];

const keySelector = (item: ApiFields) => item.id;

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

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

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
    } = useFilterState<PurgeNull<NonNullable<ClientTrackInformationListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'tracked_date',
            direction: 'dsc',
        },
    });

    const apiVariables = useMemo(
        (): ClientTrackInformationListQueryVariables => ({
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
        data: apiData = previousData,
        loading: loadingApiData,
        error: apiError,
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
                variables: {
                    filters: apiVariables?.filters ?? {},
                },
            });
        },
        [
            exportApiRecords,
            apiVariables,
        ],
    );

    const totalApiCount = apiData?.clientTrackInformationList?.totalCount ?? 0;
    const apiRecords = apiData?.clientTrackInformationList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<ApiFields, string>(
                'api_type_display',
                'API Name',
                (item) => item.apiTypeDisplay,
            ),
            createExternalLinkColumn<ApiFields, string>(
                'example_request',
                'API URL',
                (item) => ({
                    title: item.exampleRequest,
                    link: item.exampleRequest,
                }),
            ),
            createTextColumn<ApiFields, string>(
                'response_type',
                'API Response',
                (item) => item.responseType,
            ),
            createTextColumn<ApiFields, string>(
                'usage',
                'API Usage',
                (item) => item.usage,
            ),
            createTextColumn<ApiFields, string>(
                'description',
                'API Description',
                (item) => item.description,
            ),
            createTextColumn<ApiFields, string>(
                'client__name',
                'Client Name',
                (item) => item.client?.name,
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
                    activePage={rawPage}
                    itemsCount={totalApiCount}
                    maxItemsPerPage={rawPageSize}
                    onActivePageChange={setPage}
                    onItemsPerPageChange={setPageSize}
                    itemsPerPageControlHidden={pagerPageControlDisabled}
                />
            )}
            description={(
                <ApiRecordsFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={setFilter}
                />
            )}
        >
            {loadingApiData && <Loading absolute />}
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
            {!loadingApiData && (
                <TableMessage
                    errored={!!apiError}
                    filtered={!hasNoData(filter)}
                    totalItems={totalApiCount}
                    emptyMessage="No logs found"
                    emptyMessageWithFilters="No logs found with applied filters"
                    errorMessage="Could not fetch logs"
                />
            )}
        </Container>
    );
}
export default ApiRecordsTable;
