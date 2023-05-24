import React, {
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
    Pager,
    useSortState,
    SortContext,
    createYesNoColumn,
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
import { PurgeNull } from '#types';

import {
    ClientTrackInformationListQuery,
    ClientTrackInformationListQueryVariables,
} from '#generated/types';

import ApiRecordsFilter from './ApiRecordsFilters';
import styles from './styles.css';

const CLIENT_TRACK_INFORMATION_LIST = gql`
    query ClientTrackInformationList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $apiType: [String!],
        $clientCodes: [String!],
    ) {
        clientTrackInformationList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            apiType: $apiType,
            clientCodes: $clientCodes,
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
                    isActive
                }
                apiTypeDisplay
            }
        }
    }
`;

type ApiFields = NonNullable<NonNullable<ClientTrackInformationListQuery['clientTrackInformationList']>['results']>[number];

const keySelector = (item: ApiFields) => item.id;

const defaultSorting = {
    name: 'requestsPerDay',
    direction: 'dsc',
};

interface ApiRecordProps {
    className?: string;
    tableClassName?: string;
    title?: string;
    page?: number;
    pageSize?: number;
    pagerDisabled?: boolean;
    pagerPageControlDisabled?: boolean;
}

function ApiRecordsTable(props: ApiRecordProps) {
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
            setPageSize(1);
        },
        [],
    );

    const apiVariables = useMemo(
        () => ({
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

    const totalApiCount = ApiData?.clientTrackInformationList?.totalCount ?? 0;
    const apiRecords = ApiData?.clientTrackInformationList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<ApiFields, string>(
                'id',
                'API ID',
                (item) => item.id,
                { sortable: true },
                'very-small',
            ),
            createTextColumn<ApiFields, string>(
                'api_type',
                'API Type',
                (item) => item.apiTypeDisplay,
                { sortable: true },
                'very-small',
            ),
            createTextColumn<ApiFields, string>(
                'client_code',
                'Client Code',
                (item) => item.client?.code,
                { sortable: true },
                'very-small',
            ),
            createYesNoColumn<ApiFields, string>(
                'is_active',
                'Active',
                (item) => item.client?.isActive,
                { sortable: true },
            ),
            createNumberColumn<ApiFields, string>(
                'requests_per_day',
                'Requests/Day',
                (item) => item.requestsPerDay,
                { sortable: true },
                'medium',
            ),
            createDateColumn<ApiFields, string>(
                'api_track_date',
                'Tracked Date',
                (item) => item.trackedDate,
                { sortable: false },
                'medium',
            ),
        ].filter(isDefined)),
        [],
    );

    return (
        <Container
            compactContent
            className={_cs(className, styles.apiRecordsTable)}
            contentClassName={styles.content}
            heading={title || 'Records'}
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
                        className={tableClassName}
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
                    message="No API data found."
                />
            )}
        </Container>
    );
}
export default ApiRecordsTable;
