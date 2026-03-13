import React, { useMemo } from 'react';
import { _cs } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Pager,
    SortContext,
    Table,
} from '@togglecorp/toggle-ui';

import Container from '#components/Container';
import Loading from '#components/Loading';
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
    HouseholdSizeListQuery,
    HouseholdSizeListQueryVariables,
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
                    id
                    iso3
                    name
                    countryCode
                }
            }
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
            name: 'year',
            direction: 'dsc',
        },
    });

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
                'AHHS',
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
