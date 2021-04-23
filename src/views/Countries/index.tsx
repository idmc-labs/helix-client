import React, { useMemo, useState, useContext, useCallback } from 'react';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    Button,
    Table,
    useSortState,
    Pager,
    SortContext,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';
import { PurgeNull } from '#types';
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

type CountryFields = NonNullable<NonNullable<CountriesQuery['countryList']>['results']>[number];

const COUNTRY_LIST = gql`
    query Countries($ordering: String, $page: Int, $pageSize: Int, $countryName: String, $geoGroupsByIds: [String!], $regionByIds: [String!]) {
        countryList(ordering: $ordering, page: $page, pageSize: $pageSize, countryName: $countryName, geoGroupByIds: $geoGroupsByIds, regionByIds: $regionByIds) {
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
                events {
                    totalCount
                }
                crises {
                    totalCount
                }
            }
        }
    }
`;

const COUNTRY_DOWNLOAD = gql`
    mutation ExportCountries($countryName: String, $regionByIds: [String!], $geoGroupByIds: [String!]){
        exportCountries(countryName: $countryName, regionByIds: $regionByIds, geoGroupByIds: $geoGroupByIds) {
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
    const { notify } = useContext(NotificationContext);

    const ordering = validSorting.direction === 'asc'
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [
        countriesQueryFilters,
        setCountriesQueryFilters,
    ] = useState<PurgeNull<CountriesQueryVariables>>();

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
            onCompleted: (response) => {
                const { exportCountries: exportCountriesResponse } = response;
                if (!exportCountriesResponse) {
                    return;
                }
                const { errors, ok } = exportCountriesResponse;
                if (errors) {
                    notify({ children: 'Sorry, could not start download !' });
                }
                if (ok) {
                    notify({ children: 'Download started successfully!' });
                }
            },
            onError: (error) => {
                notify({ children: error.message });
            },
        },
    );

    const handleDownloadTableData = useCallback(
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
                }),
                route.country,
                { cellAsHeader: true, sortable: true },
            ),
            createTextColumn<CountryFields, string>(
                'iso3',
                'ISO3',
                (item) => item.iso3,
                { sortable: true },
            ),
            createTextColumn<CountryFields, string>(
                'region__name',
                'Region',
                (item) => item.region?.name,
            ),
            createTextColumn<CountryFields, string>(
                'geographicalGroup',
                'Geographical Group',
                (item) => item.geographicalGroup?.name,
            ),
            createNumberColumn<CountryFields, string>(
                'crises',
                'Crises',
                (item) => item.crises?.totalCount,
            ),
            createNumberColumn<CountryFields, string>(
                'events',
                'Events',
                (item) => item.events?.totalCount,
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
            <CountriesFilter
                className={styles.filterContainer}
                setCountriesQueryFilters={setCountriesQueryFilters}
            />
            <Container
                heading="Countries"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <Button
                        name={undefined}
                        variant="primary"
                        onClick={handleDownloadTableData}
                        disabled={exportingCountries}
                    >
                        Download
                    </Button>
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
            >
                {totalCountriesCount > 0 && (
                    <SortContext.Provider value={sortState}>
                        <Table
                            className={styles.table}
                            data={countriesData?.countryList?.results}
                            keySelector={keySelector}
                            columns={columns}
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
