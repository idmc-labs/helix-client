import React, { useCallback, useMemo } from 'react';
import {
    SortContext,
} from '@togglecorp/toggle-ui';
import { PartialForm } from '@togglecorp/toggle-form';

import CrisesFilter from '#components/rawTables/useCrisisTable/CrisesFilter';
import useCrisisTable from '#components/rawTables/useCrisisTable';
import Container from '#components/Container';
import {
    CrisesQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import useFilterState, { FilterStateResponse } from '#hooks/useFilterState';
import { expandObject } from '#utils/common';
import { PurgeNull } from '#types';

import styles from './styles.module.css';

type CrisesFilterFields = NonNullable<PurgeNull<CrisesQueryVariables['filters']>>;
type FiguresFilterFields = NonNullable<PurgeNull<ExtractionEntryListFiltersQueryVariables['filters']>>;

// NOTE: The listing page drives a single filter state where the main (crisis)
// filter and the sidepane (figures) filter live together. The figures part is
// nested under `filterFigures` and typed as the entry filter so the sidepane's
// entry-level fields survive.
export type CrisesListFilterFields = Omit<CrisesFilterFields, 'filterFigures'> & {
    filterFigures?: FiguresFilterFields;
};

interface CrisesProps {
    className?: string;
    title?: string;
    filterState?: FilterStateResponse<CrisesListFilterFields>;
}

function CrisesTable(props: CrisesProps) {
    const {
        className,
        title,
        filterState: filterStateFromProps,
    } = props;

    const selfFilterState = useFilterState<CrisesListFilterFields>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

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
    } = filterStateFromProps ?? selfFilterState;

    // NOTE: The main filter only edits the crisis part; it receives the whole
    // filter but its writes preserve `filterFigures` so the sidepane's filter is
    // not clobbered.
    const handleMainFilterChange = useCallback(
        (value: PartialForm<CrisesFilterFields>) => {
            setFilter((old) => ({
                ...old,
                ...value,
                filterFigures: old.filterFigures,
            }));
        },
        [setFilter],
    );

    const crisesVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<CrisesQueryVariables['filters']>>(
                filter,
                {
                    filterFigures: filter.filterFigures,
                    aggregateFigures: {
                        filterFigures: filter.filterFigures,
                    },
                },
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
        ],
    );

    const {
        table: crisesTable,
        addButton: crisesAddButton,
        exportButton: crisesExportButton,
        pager: crisesPager,
    } = useCrisisTable({
        className: styles.table,
        filters: crisesVariables,
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
            heading={title || 'Crises'}
            headerActions={(
                <>
                    {crisesAddButton}
                    {crisesExportButton}
                </>
            )}
            footerContent={crisesPager}
            description={(
                <CrisesFilter
                    currentFilter={rawFilter}
                    initialFilter={initialFilter}
                    onFilterChange={handleMainFilterChange}
                />
            )}
        >
            <SortContext.Provider value={sortState}>
                {crisesTable}
            </SortContext.Provider>
        </Container>
    );
}

export default CrisesTable;
