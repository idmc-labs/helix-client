import React, { useMemo } from 'react';
import {
    SortContext,
} from '@togglecorp/toggle-ui';

import CrisesFilter from '#components/rawTables/useCrisisTable/CrisesFilter';
import useCrisisTable from '#components/rawTables/useCrisisTable';
import Container from '#components/Container';
import {
    CrisesQueryVariables,
    FigureExtractionFilterDataInputType,
} from '#generated/types';
import useFilterState from '#hooks/useFilterState';
import { expandObject } from '#utils/common';
import { PurgeNull } from '#types';

import styles from './styles.css';

interface CrisesProps {
    className?: string;
    title?: string;
    filterFigures?: FigureExtractionFilterDataInputType;
}

function CrisesTable(props: CrisesProps) {
    const {
        className,
        title,
        filterFigures,
    } = props;

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
    } = useFilterState<NonNullable<PurgeNull<CrisesQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const crisesVariables = useMemo(
        () => ({
            ordering,
            page,
            pageSize,
            filters: expandObject<NonNullable<CrisesQueryVariables['filters']>>(
                filter,
                {
                    filterFigures,
                },
            ),
        }),
        [
            ordering,
            page,
            pageSize,
            filter,
            filterFigures,
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
                    onFilterChange={setFilter}
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
