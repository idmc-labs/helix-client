import React, { useCallback } from 'react';
import { mapToList, _cs } from '@togglecorp/fujs';

import { Button } from '@togglecorp/toggle-ui';
import { IoClose, IoFilterOutline } from 'react-icons/io5';

import PageHeader from '#components/PageHeader';
import CrisesTable, { CrisesListFilterFields } from '#components/tables/CrisesTable';
import useSidebarLayout from '#hooks/useSidebarLayout';
import { hasNoData } from '#utils/common';
import Container from '#components/Container';
import FloatingButton from '#components/FloatingButton';
import useFilterState from '#hooks/useFilterState';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
import { ExtractionEntryListFiltersQueryVariables } from '#generated/types';
import { PurgeNull } from '#types';

import styles from './styles.module.css';

type FiguresFilterFields = PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>;

// NOTE: Stable empty reference for the figures slice before it is ever set, so
// the sidepane form's sync effect does not thrash.
const emptyFiguresFilter: FiguresFilterFields = {};

interface CrisesProps {
    className?: string;
}

function Crises(props: CrisesProps) {
    const { className } = props;
    const {
        showSidebar,
        containerClassName,
        sidebarClassName,
        sidebarSpaceReserverElement,
        setShowSidebarTrue,
        setShowSidebarFalse,
    } = useSidebarLayout();

    const filterState = useFilterState<CrisesListFilterFields>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
        persistenceKey: 'filter_crisisPage',
    });

    const {
        rawFilter,
        initialFilter,
        setFilter,
    } = filterState;

    const figuresRawFilter = rawFilter.filterFigures ?? emptyFiguresFilter;
    const figuresInitialFilter = initialFilter.filterFigures ?? emptyFiguresFilter;

    const handleFiguresFilterChange = useCallback(
        (value: FiguresFilterFields) => {
            setFilter((old) => ({
                ...old,
                filterFigures: value,
            }));
        },
        [setFilter],
    );

    const floatingButtonVisibility = useCallback(
        (scroll: number) => scroll >= 80 && !showSidebar,
        [showSidebar],
    );

    const appliedFiltersCount = mapToList(
        figuresRawFilter,
        (item) => !hasNoData(item),
    ).filter(Boolean).length;

    const figureHiddenColumns = ['crisis' as const];

    return (
        <div className={_cs(styles.crises, containerClassName, className)}>
            {sidebarSpaceReserverElement}
            <div className={styles.pageContent}>
                <PageHeader
                    title="Crises"
                    description={!showSidebar && (
                        <Button
                            name={undefined}
                            onClick={setShowSidebarTrue}
                            disabled={showSidebar}
                            icons={<IoFilterOutline />}
                        >
                            {appliedFiltersCount > 0 ? `Filters (${appliedFiltersCount})` : 'Filters'}
                        </Button>
                    )}
                />
                <div className={styles.mainContent}>
                    <FiguresFilterOutput
                        className={styles.filterOutputs}
                        filterState={figuresRawFilter}
                    />
                    <CrisesTable
                        className={styles.container}
                        filterState={filterState}
                    />
                </div>
                <Container
                    className={_cs(styles.filters, sidebarClassName)}
                    heading="Filters"
                    contentClassName={styles.filtersContent}
                    headerActions={(
                        <Button
                            name={undefined}
                            onClick={setShowSidebarFalse}
                            transparent
                            title="Close"
                        >
                            <IoClose />
                        </Button>
                    )}
                >
                    <AdvancedFiguresFilter
                        currentFilter={figuresRawFilter}
                        initialFilter={figuresInitialFilter}
                        onFilterChange={handleFiguresFilterChange}
                        hiddenFields={figureHiddenColumns}
                    />
                </Container>
            </div>
            <FloatingButton
                name={undefined}
                onClick={setShowSidebarTrue}
                icons={<IoFilterOutline />}
                variant="primary"
                visibleOn={floatingButtonVisibility}
            >
                {appliedFiltersCount > 0 ? `Filters (${appliedFiltersCount})` : 'Filters'}
            </FloatingButton>
        </div>
    );
}

export default Crises;
