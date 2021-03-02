import React, { useMemo, useState } from 'react';
import {
    gql,
    useQuery,
} from '@apollo/client';
import { _cs } from '@togglecorp/fujs';
import {
    IoIosSearch,
} from 'react-icons/io';
import {
    TextInput,
    Table,
    useSortState,
    TableSortDirection,
    Pager,
    SortContext,
    createNumberColumn,
} from '@togglecorp/toggle-ui';
import {
    createTextColumn,
    createLinkColumn,
} from '#components/tableHelpers';

import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';

import {
    CountriesQuery,
    CountriesQueryVariables,
} from '#generated/types';

import route from '#config/routes';
import styles from './styles.css';

type CountryFields = NonNullable<NonNullable<CountriesQuery['countryList']>['results']>[number];

const COUNTRY_LIST = gql`
    query Countries($ordering: String, $page: Int, $pageSize: Int, $name: String) {
        countryList(ordering: $ordering, page: $page, pageSize: $pageSize, countryName: $name) {
            totalCount
            pageSize
            page
            results {
                id
                iso3
                name
                region {
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

const defaultSorting = {
    name: 'name',
    direction: TableSortDirection.asc,
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

    const ordering = validSorting.direction === TableSortDirection.asc
        ? validSorting.name
        : `-${validSorting.name}`;

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState<string | undefined>();
    const [pageSize, setPageSize] = useState(10);

    const countriesVariables = useMemo(
        (): CountriesQueryVariables => ({
            ordering,
            page,
            pageSize,
            name: search,
        }),
        [ordering, page, pageSize, search],
    );

    const {
        previousData,
        data: countriesData = previousData,
        loading: loadingCountries,
    } = useQuery<CountriesQuery, CountriesQueryVariables>(COUNTRY_LIST, {
        variables: countriesVariables,
    });

    const columns = useMemo(
        () => ([
            createLinkColumn<CountryFields, string>(
                'name',
                'Name',
                (item) => ({
                    title: item.name,
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
            /*
            createTextColumn<CountryFields, string>(
                'sub_region',
                'Sub Region',
                (item) => item.subRegion,
                { sortable: true },
            ),
            */
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
            <Container
                heading="Countries"
                className={styles.container}
                contentClassName={styles.content}
                headerActions={(
                    <>
                        <TextInput
                            icons={<IoIosSearch />}
                            name="search"
                            value={search}
                            placeholder="Search"
                            onChange={setSearch}
                        />
                    </>
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
