import React, { useMemo, useContext, useCallback, useEffect, useState } from 'react';
import { getOperationName } from 'apollo-link';
import { _cs, isDefined, isNotDefined } from '@togglecorp/fujs';
import {
    gql,
    useLazyQuery,
    useMutation,
    useQuery,
} from '@apollo/client';
import {
    ConfirmButton,
    Pager,
    SortContext,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import DomainContext from '#components/DomainContext';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import useFilterState from '#hooks/useFilterState';
import { PurgeNull } from '#types';
import { hasNoData } from '#utils/common';
import {
    AhhsCarryOverStatusQuery,
    AhhsCarryOverStatusQueryVariables,
    CarryOverAhhsMutation,
    CarryOverAhhsMutationVariables,
    ExportHouseholdSizeMutation,
    ExportHouseholdSizeMutationVariables,
    HouseholdSizeListQuery,
    HouseholdSizeListQueryVariables,
    LatestAhhsTriggeredYearQuery,
    LatestAhhsTriggeredYearQueryVariables,
} from '#generated/types';
import HouseholdSizeRecordsFilter from './HouseholdSizeRecordsFilter';
import ActivityLogs, { AHHS_ACTIVITY_LOG } from './ActivityLogs';
import styles from './styles.module.css';

const HOUSEHOLD_SIZE_LIST = gql`
    query HouseholdSizeList(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $filters: HouseholdSizeFilterDataTypeInputType!,
    ){
        householdSizeList(
            filters: $filters,
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize
        ) {
            page
            pageSize
            totalCount
            results {
                id
                size
                year
                source
                sourceLink
                notes
                country {
                    iso3
                    name
                    countryCode
                }
            }
        }
    }
`;

const EXPORT_HOUSEHOLD_SIZE = gql`
    mutation ExportHouseholdSize(
        $filters: HouseholdSizeFilterDataTypeInputType!,
    ){
        exportHouseholdSize(filters: $filters){
            errors
            ok
          }
    }
`;

const LATEST_AHHS_TRIGGERED_YEAR = gql`
    query LatestAhhsTriggeredYear {
        householdSizeList(ordering: "-year") {
            results {
                id
                year
            }
        }
    }
`;

const CARRY_OVER_AHHS = gql`
    mutation CarryOverAhhs {
        carryOverHouseholdSize {
            errors
            ok
            result {
                id
            }
        }
    }
`;

const AHHS_CARRY_OVER_STATUS = gql`
    query AhhsCarryOverStatus(
        $id: ID!,
    ) {
        householdSizeBulkOperation(
            id: $id,
        ) {
            id
            status
            statusDisplay
        }
    }
`;

const CONTACT_PERSON = import.meta.env.REACT_APP_HELIX_CONTACT_PERSON;

const activityLogsQueryName = getOperationName(AHHS_ACTIVITY_LOG);

type HouseholdSizeFields = NonNullable<NonNullable<HouseholdSizeListQuery['householdSizeList']>['results']>[number];

const keySelector = (item: HouseholdSizeFields) => item.id;

interface AverageHouseholdSizeProps{
    className?: string;
}

function AverageHouseholdSize(props: AverageHouseholdSizeProps) {
    const { className } = props;

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
    } = useFilterState<PurgeNull<NonNullable<HouseholdSizeListQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'year',
            direction: 'dsc',
        },
    });

    const [ahhsCarryOverId, setAhhsCarryOverId] = useState<string | undefined>();

    const { user } = useContext(DomainContext);
    const ahhsTriggerPermission = user?.permissions?.householdsize?.carry_over;

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const householdSizeListVariables = useMemo(
        (): HouseholdSizeListQueryVariables => ({
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
        data: householdSizeListData = previousData,
        loading: householdSizeDataLoading,
        error: householdSizeFetchError,
    } = useQuery<HouseholdSizeListQuery, HouseholdSizeListQueryVariables>(HOUSEHOLD_SIZE_LIST, {
        variables: householdSizeListVariables,
    });

    const {
        data: latestAhhsYearResponse,
        loading: latestAhhsYearPending,
    } = useQuery<
        LatestAhhsTriggeredYearQuery, LatestAhhsTriggeredYearQueryVariables
    >(LATEST_AHHS_TRIGGERED_YEAR);

    const latestAhhsYearData = latestAhhsYearResponse
        ?.householdSizeList?.results?.[0];
    const latestAhhsTriggeredYear = latestAhhsYearData?.year;
    const currentYear = new Date().getFullYear();

    const [
        exportHouseholdSizes,
        { loading: householdSizesExportPending },
    ] = useMutation<ExportHouseholdSizeMutation, ExportHouseholdSizeMutationVariables>(
        EXPORT_HOUSEHOLD_SIZE,
        {
            onCompleted: (response) => {
                const { exportHouseholdSize: exportHouseholdSizesResponse } = response;
                if (!exportHouseholdSizesResponse) {
                    return;
                }
                const { errors, ok } = exportHouseholdSizesResponse;
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
            exportHouseholdSizes({
                variables: {
                    filters: householdSizeListVariables.filters ?? {},
                },
            });
        },
        [
            exportHouseholdSizes,
            householdSizeListVariables?.filters,
        ],
    );

    const carryOverStatusVariables = useMemo(
        (): AhhsCarryOverStatusQueryVariables | undefined => {
            if (isNotDefined(ahhsCarryOverId)) {
                return undefined;
            }
            return {
                id: ahhsCarryOverId,
            };
        },
        [ahhsCarryOverId],
    );
    const [
        startPolling,
        {
            data: ahhsCarryOverStatusResponse,
            loading: ahhsCarryOverStatusPending,
            stopPolling,
        },
    ] = useLazyQuery<AhhsCarryOverStatusQuery, AhhsCarryOverStatusQueryVariables>(
        AHHS_CARRY_OVER_STATUS,
        {
            variables: carryOverStatusVariables,
            pollInterval: 5_000,
            // NOTE: onCompleted is only called once if the following option is not set
            // https://github.com/apollographql/apollo-client/issues/5531
            notifyOnNetworkStatusChange: true,
            fetchPolicy: 'network-only',
        },
    );

    const ahhsCarryOverStatus = ahhsCarryOverStatusResponse?.householdSizeBulkOperation?.status;
    const carryOverCompleted = isDefined(ahhsCarryOverStatus) && (ahhsCarryOverStatus === 'COMPLETED'
            || ahhsCarryOverStatus === 'FAILED'
            || ahhsCarryOverStatus === 'KILLED');

    useEffect(
        () => {
            if (carryOverCompleted) {
                stopPolling();
            }
        },
        [stopPolling, carryOverCompleted],
    );

    const ahhsTriggerDisabled = latestAhhsTriggeredYear === currentYear
        || latestAhhsYearPending
        || ahhsCarryOverStatusPending
        || ahhsCarryOverStatus === 'IN_PROGRESS'
        || ahhsCarryOverStatus === 'COMPLETED'
        || ahhsCarryOverStatus === 'PENDING';

    const [
        carryOverAhhs,
        { loading: carryOverAhhsPending },
    ] = useMutation<CarryOverAhhsMutation, CarryOverAhhsMutationVariables>(
        CARRY_OVER_AHHS,
        {
            refetchQueries: [activityLogsQueryName].filter(isDefined),
            onCompleted: (response) => {
                const { carryOverHouseholdSize: carryOverAhhsResponse } = response;
                if (!carryOverAhhsResponse) {
                    return;
                }
                const { errors, ok, result } = carryOverAhhsResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    setAhhsCarryOverId(result?.id);
                    startPolling();
                    notify({
                        children: 'AHHS carry over initiated successfully.',
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

    const totalHouseholdSizeCount = householdSizeListData?.householdSizeList?.totalCount ?? 0;
    const householdSizeRecords = householdSizeListData?.householdSizeList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<HouseholdSizeFields, string>(
                'country',
                'Country',
                (item) => item.country.name,
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'year',
                'Year',
                (item) => String(item.year),
                { sortable: true },
                'very-small',
            ),
            createNumberColumn<HouseholdSizeFields, string>(
                'size',
                'Average Household Size (AHHS)',
                (item) => item.size,
                { sortable: true },
                'medium-large',
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'source',
                'Source',
                (item) => item.source,
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'notes',
                'Notes',
                (item) => item.notes,
                undefined,
                'large',
            ),
        ]),
        [],
    );

    return (
        <div className={_cs(styles.householdSize, className)}>
            <div className={styles.mainContent}>
                <PageHeader
                    title="AHHS"
                />
                <Container
                    compactContent
                    contentClassName={styles.content}
                    heading="AHHS"
                    headerActions={(
                        <>
                            <ConfirmButton
                                confirmationHeader="Confirm Export"
                                confirmationMessage="Are you sure you want to export this table data?"
                                name={undefined}
                                onConfirm={handleExportTableData}
                                disabled={householdSizesExportPending}
                            >
                                Export
                            </ConfirmButton>
                            {ahhsTriggerPermission && (
                                <ConfirmButton
                                    confirmationHeader="Confirmation"
                                    confirmationMessage="Are you sure you want to carry over Household size data?"
                                    name={undefined}
                                    onConfirm={carryOverAhhs}
                                    disabled={ahhsTriggerDisabled || carryOverAhhsPending}
                                    title={ahhsTriggerDisabled
                                        ? `Carrying over AHHS has already been triggered for this year. For any updates to AHHS, contact ${CONTACT_PERSON ?? 'admin'}.`
                                        : 'Carry over AHHS data'}
                                >
                                    Carry over AHHS
                                </ConfirmButton>
                            )}
                        </>
                    )}
                    description={(
                        <HouseholdSizeRecordsFilter
                            currentFilter={rawFilter}
                            initialFilter={initialFilter}
                            onFilterChange={setFilter}
                        />
                    )}
                    footerContent={(
                        <Pager
                            activePage={rawPage}
                            itemsCount={totalHouseholdSizeCount}
                            maxItemsPerPage={rawPageSize}
                            onActivePageChange={setPage}
                            onItemsPerPageChange={setPageSize}
                        />
                    )}
                >
                    {householdSizeDataLoading && <Loading absolute />}
                    <SortContext.Provider value={sortState}>
                        {totalHouseholdSizeCount > 0 && (
                            <Table
                                className={styles.table}
                                data={householdSizeRecords}
                                keySelector={keySelector}
                                columns={columns}
                                resizableColumn
                                fixedColumnWidth
                            />
                        )}
                    </SortContext.Provider>
                    {!householdSizeDataLoading && (
                        <TableMessage
                            errored={!!householdSizeFetchError}
                            filtered={!hasNoData(filter)}
                            totalItems={totalHouseholdSizeCount}
                            emptyMessage="No household size data found"
                            emptyMessageWithFilters="No household size data found with applied filters"
                            errorMessage="Could not fetch household size data"
                        />
                    )}
                </Container>
            </div>
            <div className={styles.sideContent}>
                <div className={styles.stickyContainer}>
                    <ActivityLogs />
                </div>
            </div>
        </div>
    );
}
export default AverageHouseholdSize;
