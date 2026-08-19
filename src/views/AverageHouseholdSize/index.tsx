import React, { useMemo, useCallback, useContext } from 'react';
import { getOperationName } from 'apollo-link';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import {
    ConfirmButton,
    Pager,
    SortContext,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import Loading from '#components/Loading';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NotificationContext from '#components/NotificationContext';
import PageHeader from '#components/PageHeader';
import TableMessage from '#components/TableMessage';
import {
    createTextColumn,
    createDateColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import useFilterState from '#hooks/useFilterState';
import { PurgeNull } from '#types';
import { hasNoData } from '#utils/common';
import {
    ExportHouseholdSizeMutation,
    ExportHouseholdSizeMutationVariables,
    HouseholdSizeListQuery,
    HouseholdSizeListQueryVariables,
} from '#generated/types';
import HouseholdSizeRecordsFilter from './HouseholdSizeRecordsFilter';
import styles from './styles.module.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

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
                gapFillingMethod
                gapFillingMethodDisplay
                referenceDate
                country {
                    id
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
        reset,
        orderingChanged,
        pageChanged,

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

    const totalHouseholdSizeCount = householdSizeListData?.householdSizeList?.totalCount ?? 0;
    const householdSizeRecords = householdSizeListData?.householdSizeList?.results;

    const columns = useMemo(
        () => ([
            createTextColumn<HouseholdSizeFields, string>(
                'country',
                'Country',
                (item) => item.country.name,
                { sortable: true },
                'small',
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'year',
                'Year',
                (item) => String(item.year),
                { sortable: true },
                'very-small',
            ),
            createDateColumn<HouseholdSizeFields, string>(
                'referenceDate',
                'Reference Date',
                (item) => item.referenceDate,
                { sortable: true },
            ),
            createNumberColumn<HouseholdSizeFields, string>(
                'size',
                'AHHS',
                (item) => item.size,
                { sortable: true },
                'small',
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'source',
                'Source',
                (item) => item.source,
            ),
            createTextColumn<HouseholdSizeFields, string>(
                'gapFillingMethod',
                'Gap Filling Method',
                (item) => item.gapFillingMethodDisplay,
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
    const [
        exportHouseholdSizes,
        { loading: householdSizesExportPending },
    ] = useMutation<ExportHouseholdSizeMutation, ExportHouseholdSizeMutationVariables>(
        EXPORT_HOUSEHOLD_SIZE,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
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
                        <ConfirmButton
                            confirmationHeader="Confirm Export"
                            confirmationMessage="Are you sure you want to export this table data?"
                            name={undefined}
                            onConfirm={handleExportTableData}
                            disabled={householdSizesExportPending}
                        >
                            Export
                        </ConfirmButton>
                    )}
                    description={(
                        <HouseholdSizeRecordsFilter
                            currentFilter={rawFilter}
                            initialFilter={initialFilter}
                            onFilterChange={setFilter}
                            onFilterReset={reset}
                            orderingOrPageChanged={orderingChanged || pageChanged}
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
                            emptyMessage="No AHHS data found"
                            emptyMessageWithFilters="No AHHS data found with applied filters"
                            errorMessage="Could not fetch AHHS data"
                        />
                    )}
                </Container>
            </div>
        </div>
    );
}
export default AverageHouseholdSize;
