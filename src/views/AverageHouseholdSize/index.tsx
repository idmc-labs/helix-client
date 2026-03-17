import React, { useMemo, useContext, useCallback } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
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
    LatestAhhsTriggeredYearQuery,
    HouseholdSizeListQuery,
    HouseholdSizeListQueryVariables,
    ExportHouseholdSizeMutation,
    ExportHouseholdSizeMutationVariables,
    CarryOverAhhsMutation,
    CarryOverAhhsMutationVariables,
} from '#generated/types';
import HouseholdSizeRecordsFilter from './HouseholdSizeRecordsFilter';
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

const LATEST_AHHS_TRIGGERED_YEAR = gql`
    query LatestAhhsTriggeredYear {
        latestUpdateHouseholdSize {
            year
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

const CARRY_OVER_AHHS = gql`
    mutation CarryOverAhhs {
        carryOverHouseholdSize {
            errors
            ok
        }
    }
`;

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
            name: 'country',
            direction: 'asc',
        },
    });

    const { user } = useContext(DomainContext);
    const ahhsTriggerPermission = user?.permissions?.householdsize?.carry_over;

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
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const {
        previousData,
        data: householdSizeListData = previousData,
        loading: householdSizeDataLoading,
        error: householdSizeFetchError,
    } = useQuery<HouseholdSizeListQuery, HouseholdSizeListQueryVariables>(HOUSEHOLD_SIZE_LIST, {
        variables: householdSizeListVariables,
    });

    const {
        data: latestAhhsTriggeredYearResponse,
        refetch: retriggerLatestAhhs,
    } = useQuery<LatestAhhsTriggeredYearQuery>(LATEST_AHHS_TRIGGERED_YEAR);

    const latestAhhsTriggeredYear = latestAhhsTriggeredYearResponse
        ?.latestUpdateHouseholdSize?.year;
    const currentYear = new Date().getFullYear();
    const ahhsTriggerDisabled = latestAhhsTriggeredYear === currentYear;

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

    const [
        carryOverAhhs,
        { loading: carryOverAhhsPending },
    ] = useMutation<CarryOverAhhsMutation, CarryOverAhhsMutationVariables>(
        CARRY_OVER_AHHS,
        {
            onCompleted: (response) => {
                const { carryOverHouseholdSize: carryOverAhhsResponse } = response;
                if (!carryOverAhhsResponse) {
                    return;
                }
                const { errors, ok } = carryOverAhhsResponse;
                if (errors) {
                    notifyGQLError(errors);
                }
                if (ok) {
                    retriggerLatestAhhs();
                    notify({
                        children: 'AHHS carried over successfully.',
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
                                    ? 'Carrying over AHHS has already been triggered for this year. For any updates to AHHS, contact Maria Teresa.'
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
    );
}
export default AverageHouseholdSize;
