import React, { useMemo } from 'react';
import {
    SortContext,
} from '@togglecorp/toggle-ui';

import CountriesFilter, { CountriesFilterFields } from '#components/rawTables/useCountryTable/CountriesFilter';
import useCountryTable from '#components/rawTables/useCountryTable';
import Container from '#components/Container';
import {
    CountriesQueryVariables,
} from '#generated/types';
import useFilterState from '#hooks/useFilterState';
import { expandObject } from '#utils/common';

import styles from './styles.css';

interface CountriesProps {
    className?: string;
    title?: string;
}

function CountriesTable(props: CountriesProps) {
    const {
        className,
        title,
    } = props;

    const {
        page,
        rawPage,
        setPage,

        ordering,
        sortState,

        // rawFilter,
        filter,
        setFilter,

        pageSize,
        rawPageSize,
        setPageSize,
    } = useFilterState<CountriesFilterFields>({
        filter: {},
        ordering: {
            name: 'idmc_short_name',
            direction: 'asc',
        },
    });

    const countriesVariables = useMemo(
        () => {
            const queryFilters = {
                ...filter,
                aggregateFigures: {
                    year: filter.year,
                },
            };
            delete queryFilters.year;

            return ({
                ordering,
                page,
                pageSize,
                filters: expandObject<NonNullable<CountriesQueryVariables['filters']>>(
                    queryFilters,
                    {},
                ),
            });
        },
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        table: countriesTable,
        exportButton: countriesExportButton,
        pager: countriesPager,
    } = useCountryTable({
        className: styles.table,
        filters: countriesVariables,
        page: rawPage,
        pageSize: rawPageSize,
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
    });

    return (
        <Container
            compactContent
            className={className}
            contentClassName={styles.content}
            heading={title || 'Countries'}
            headerActions={(
                <>
                    {countriesExportButton}
                </>
            )}
            footerContent={countriesPager}
            description={(
                <CountriesFilter
                    onFilterChange={setFilter}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                {countriesTable}
            </SortContext.Provider>
        </Container>
    );
}

export default CountriesTable;
