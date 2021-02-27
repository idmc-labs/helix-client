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
    TableColumn,
    createColumn,
    TableHeaderCell,
    TableHeaderCellProps,
    useSortState,
    TableSortDirection,
    Pager,
    Numeral,
} from '@togglecorp/toggle-ui';

import StringCell from '#components/tableHelpers/StringCell';
import Message from '#components/Message';
import Loading from '#components/Loading';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import LinkCell, { LinkProps } from '#components/tableHelpers/Link';

import { ExtractKeys } from '#types';

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
                subRegion
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

const defaultSortState = {
    name: 'name',
    direction: TableSortDirection.asc,
};

const keySelector = (item: CountryFields) => item.id;

interface Entity {
    id: string;
    name: string | undefined;
}
interface PaginatedResult {
    totalCount?: number | undefined | null;
}

interface CountriesProps {
    className?: string;
}

function Countries(props: CountriesProps) {
    const { className } = props;

    const { sortState, setSortState } = useSortState();
    const validSortState = sortState || defaultSortState;

    const ordering = validSortState.direction === TableSortDirection.asc
        ? validSortState.name
        : `-${validSortState.name}`;

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
        () => {
            type stringKeys = ExtractKeys<CountryFields, string>;
            type entityKeys = ExtractKeys<CountryFields, Entity>;
            type countKeys = ExtractKeys<CountryFields, PaginatedResult>;

            // Generic columns
            const stringColumn = (colName: stringKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: CountryFields) => ({
                    value: datum[colName],
                }),
            });

            const entityColumn = (colName: entityKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: StringCell,
                cellRendererParams: (_: string, datum: CountryFields) => ({
                    value: datum[colName]?.name,
                }),
            });
            const countColumn = (colName: countKeys) => ({
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: colName === validSortState.name
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: Numeral,
                cellRendererParams: (_: string, datum: CountryFields) => ({
                    value: datum[colName]?.totalCount,
                }),
            });

            // Specific columns
            // eslint-disable-next-line max-len
            const nameColumn: TableColumn<CountryFields, string, LinkProps, TableHeaderCellProps> = {
                id: 'name',
                title: 'Name',
                cellAsHeader: true,
                headerCellRenderer: TableHeaderCell,
                headerCellRendererParams: {
                    onSortChange: setSortState,
                    sortable: true,
                    sortDirection: validSortState.name === 'name'
                        ? validSortState.direction
                        : undefined,
                },
                cellRenderer: LinkCell,
                cellRendererParams: (_, datum) => ({
                    title: datum.name,
                    route: route.country,
                    attrs: { countryId: datum.id },
                }),
            };

            return [
                nameColumn,
                createColumn(stringColumn, 'iso3', 'ISO3'),
                createColumn(entityColumn, 'region', 'Region'),
                createColumn(stringColumn, 'subRegion', 'Sub Region'),
                createColumn(countColumn, 'crises', 'Crises'),
                createColumn(countColumn, 'events', 'Events'),
            ];
        },
        [
            setSortState,
            validSortState,
        ],
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
                    <Table
                        className={styles.table}
                        data={countriesData?.countryList?.results}
                        keySelector={keySelector}
                        columns={columns}
                    />
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
