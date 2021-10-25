import React, { useMemo, useState, useContext, useCallback } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import { _cs } from '@togglecorp/fujs';
import {
    ConfirmButton,
    Table,
    useSortState,
    Pager,
    SortContext,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
    createNumberColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';

import { DOWNLOADS_COUNT } from '#components/Navbar/Downloads';
import NotificationContext from '#components/NotificationContext';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import {
    CountriesQuery,
    CountriesQueryVariables,
    ExportCountriesMutation,
    ExportCountriesMutationVariables,
} from '#generated/types';
import CountriesFilter from './CountriesFilter/index';

import route from '#config/routes';
import styles from './styles.css';

const downloadsCountQueryName = getOperationName(DOWNLOADS_COUNT);

type CountryFields = NonNullable<NonNullable<CountriesQuery['countryList']>['results']>[number];

const COUNTRY_LIST = gql`
    query Countries($ordering: String, $page: Int, $pageSize: Int, $countryName: String, $geoGroupsByIds: [String!], $regionByIds: [String!], $report: String, $year: Float) {
        countryList(ordering: $ordering, page: $page, pageSize: $pageSize, countryName: $countryName, geoGroupByIds: $geoGroupsByIds, regionByIds: $regionByIds, report: $report, year: $year) {
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
    mutation ExportCountries($countryName: String, $regionByIds: [String!], $geoGroupByIds: [String!], $year: Float){
        exportCountries(countryName: $countryName, regionByIds: $regionByIds, geoGroupByIds: $geoGroupByIds, year: $year) {
            errors
            ok
        }
    }
`;

const defaultSorting = {
    name: 'name',
    direction: 'asc',
};

const keySelector = (item: CountryFields) => item.id;

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    const sortState = useSortState();
    const { sorting } = sortState;
    const validSorting = sorting || defaultSorting;
    const {
        notify,
        notifyGQLError,
    } = useContext(NotificationContext);

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [
        countriesQueryFilters,
        setCountriesQueryFilters,
    ] = useState<PurgeNull<CountriesQueryVariables>>();

    const onFilterChange = React.useCallback(
        (value: PurgeNull<CountriesQueryVariables>) => {
            setCountriesQueryFilters(value);
            setPage(1);
        },
        [],
    );

    const countriesVariables = useMemo(
        (): CountriesQueryVariables => ({
            ordering,
            page,
            pageSize,
            ...countriesQueryFilters,
        }),
        [ordering, page, pageSize, countriesQueryFilters],
    );

    const {
        previousData,
        data: countriesData = previousData,
        loading: loadingCountries,
    } = useQuery<CountriesQuery, CountriesQueryVariables>(COUNTRY_LIST, {
        variables: countriesVariables,
    });

    const [
        exportCountries,
        { loading: exportingCountries },
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
                variables: countriesQueryFilters,
            });
        },
        [exportCountries, countriesQueryFilters],
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
                'New Displacements (Conflict)',
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
                'New Displacements (Disaster)',
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

    const totalCountriesCount = countriesData?.countryList?.totalCount ?? 0;

    return (
        <div className={_cs(styles.countries, className)}>
            <PageHeader
                title="Countries"
            />
            <Container
                heading="Countries"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <ConfirmButton
                        confirmationHeader="Confirm Export"
                        confirmationMessage="Are you sure you want to export this table data?"
                        name={undefined}
                        onConfirm={handleExportTableData}
                        disabled={exportingCountries}
                    >
                        Export
                    </ConfirmButton>
                )}
                footerContent={(
                    <Pager
                        activePage={page}
                        itemsCount={totalCountriesCount}
                        maxItemsPerPage={pageSize}
                        onActivePageChange={setPage}
                        onItemsPerPageChange={setPageSize}
                    />
                )}
                description={(
                    <CountriesFilter
                        onFilterChange={onFilterChange}
                    />
                )}
            >
                {totalCountriesCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={countriesData?.countryList?.results}
                            keySelector={keySelector}
                            columns={columns}
                            resizableColumn
                            fixedColumnWidth
                        />
                    </SortContext.Provider>
                )}
                {loadingCountries && <Loading absolute />}
                {!loadingCountries && totalCountriesCount <= 0 && (
                    <Message
                        message="No countries found."
                    />
                )}
            </Container>
        </div>
    );
}

export default Countries;
