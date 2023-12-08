import React, { useMemo, useCallback, useContext } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    Table,
    ConfirmButton,
    Pager,
} from '@togglecorp/toggle-ui';
import {
    createLinkColumn,
    createTextColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import Message from '#components/Message';
import Loading from '#components/Loading';
import NotificationContext from '#components/NotificationContext';
import {
    CountriesQuery,
    CountriesQueryVariables,
    ExportCountriesMutation,
    ExportCountriesMutationVariables,
} from '#generated/types';
import route from '#config/routes';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type CountryFields = NonNullable<NonNullable<CountriesQuery['countryList']>['results']>[number];

export const COUNTRY_LIST = gql`
    query Countries(
        $ordering: String,
        $page: Int,
        $pageSize: Int,
        $countryName: String,
        $geoGroupsByIds: [String!],
        $regionByIds: [String!],
        $report: String,
        $year: Float,
    ) {
        countryList(
            ordering: $ordering,
            page: $page,
            pageSize: $pageSize,
            countryName: $countryName,
            geoGroupByIds: $geoGroupsByIds,
            regionByIds: $regionByIds,
            reportId: $report,
            year: $year,
        ) {
            totalCount
            pageSize
            page
            results {
                id
                iso3
                idmcShortName
                region {
                    id
                    name
                }
                geographicalGroup {
                    id
                    name
                }
                totalStockConflict
                totalStockDisaster
                totalFlowConflict
                totalFlowDisaster
            }
        }
    }
`;

const COUNTRY_DOWNLOAD = gql`
    mutation ExportCountries(
        $countryName: String,
        $geoGroupsByIds: [String!],
        $regionByIds: [String!],
        $report: String,
        $year: Float,
    ) {
        exportCountries(
            countryName: $countryName,
            geoGroupByIds: $geoGroupsByIds,
            regionByIds: $regionByIds,
            reportId: $report,
            year: $year,
        ) {
            errors
            ok
        }
    }
`;

const keySelector = (item: CountryFields) => item.id;

interface Props {
    className?: string;
    filters?: CountriesQueryVariables;

    page: number;
    pageSize: number;
    onPageChange: (value: number) => void;
    onPageSizeChange: (value: number) => void;
    pagerPageControlDisabled?: boolean;
}

function useCountryTable(props: Props) {
    const {
        className,
        filters,

        page,
        pageSize,
        onPageChange,
        onPageSizeChange,
        pagerPageControlDisabled,
    } = props;

    const {
        previousData,
        data: countriesData = previousData,
        loading: loadingCountries,
    } = useQuery<CountriesQuery, CountriesQueryVariables>(COUNTRY_LIST, {
        variables: filters,
    });

    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const [
        exportCountries,
        { loading: exportingTableData },
    ] = useMutation<ExportCountriesMutation, ExportCountriesMutationVariables>(
        COUNTRY_DOWNLOAD,
        {
            refetchQueries: downloadsCountQueryName ? [downloadsCountQueryName] : undefined,
            onCompleted: (response) => {
                const { exportCountries: exportCountriesResponse } = response;
                if (!exportCountriesResponse) {
                    return;
                }
                const { errors, ok } = exportCountriesResponse;
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
            exportCountries({
                variables: filters,
            });
        },
        [exportCountries, filters],
    );

    const columns = useMemo(
        () => ([
            createLinkColumn<CountryFields, string>(
                'idmc_short_name',
                'Name',
                (item) => ({
                    title: item.idmcShortName,
                    attrs: { countryId: item.id },
                    ext: item.iso3
                        ? `/countries/profiles/${item.iso3}`
                        : undefined,
                }),
                route.country,
                {
                    sortable: true,
                },
            ),
            createTextColumn<CountryFields, string>(
                'region__name',
                'Region',
                (item) => item.region?.name,
                {
                    sortable: true,
                },
            ),
            createTextColumn<CountryFields, string>(
                'geographical_group__name',
                'Geographical Group',
                (item) => item.geographicalGroup?.name,
                {
                    sortable: true,
                },
            ),
            createNumberColumn<CountryFields, string>(
                'total_flow_conflict',
                'Internal Displacements (Conflict)',
                (item) => item.totalFlowConflict,
                { sortable: true },
                'large',
            ),
            createNumberColumn<CountryFields, string>(
                'total_stock_conflict',
                'No. of IDPs (Conflict)',
                (item) => item.totalStockConflict,
                {
                    sortable: true,
                },
                'large',
            ),
            createNumberColumn<CountryFields, string>(
                'total_flow_disaster',
                'Internal Displacements (Disaster)',
                (item) => item.totalFlowDisaster,
                { sortable: true },
                'large',
            ),
            createNumberColumn<CountryFields, string>(
                'total_stock_disaster',
                'No. of IDPs (Disaster)',
                (item) => item.totalStockDisaster,
                { sortable: true },
                'large',
            ),
        ]),
        [],
    );

    const queryBasedCountryList = countriesData?.countryList?.results;
    const totalCountriesCount = countriesData?.countryList?.totalCount ?? 0;

    return {
        exportButton: (
            <ConfirmButton
                confirmationHeader="Confirm Export"
                confirmationMessage="Are you sure you want to export this table data?"
                name={undefined}
                onConfirm={handleExportTableData}
                disabled={exportingTableData}
            >
                Export
            </ConfirmButton>
        ),
        pager: (
            <Pager
                activePage={page}
                itemsCount={totalCountriesCount}
                maxItemsPerPage={pageSize}
                onActivePageChange={onPageChange}
                onItemsPerPageChange={onPageSizeChange}
                itemsPerPageControlHidden={pagerPageControlDisabled}
            />
        ),
        table: (
            <>
                {totalCountriesCount > 0 && (
                    <Table
                        className={className}
                        data={queryBasedCountryList}
                        keySelector={keySelector}
                        columns={columns}
                        resizableColumn
                        fixedColumnWidth
                    />
                )}
                {loadingCountries && <Loading absolute />}
                {!loadingCountries && totalCountriesCount <= 0 && (
                    <Message
                        message="No countries found."
                    />
                )}
            </>
        ),
    };
}
export default useCountryTable;
