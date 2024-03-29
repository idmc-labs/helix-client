import React, { useCallback } from 'react';
import { mapToList, _cs } from '@togglecorp/fujs';

import { Button } from '@togglecorp/toggle-ui';
import { IoClose, IoFilterOutline } from 'react-icons/io5';

import PageHeader from '#components/PageHeader';
import CrisesTable from '#components/tables/CrisesTable';
import useSidebarLayout from '#hooks/useSidebarLayout';
import { hasNoData } from '#utils/common';
import Container from '#components/Container';
import FloatingButton from '#components/FloatingButton';
import useFilterState from '#hooks/useFilterState';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
import { ExtractionEntryListFiltersQueryVariables } from '#generated/types';
import { PurgeNull } from '#types';

import styles from './styles.css';

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

    const figuresFilterState = useFilterState<PurgeNull<NonNullable<ExtractionEntryListFiltersQueryVariables['filters']>>>({
        filter: {},
        ordering: {
            name: 'created_at',
            direction: 'dsc',
        },
    });

    const {
        filter: figuresFilter,
        rawFilter: rawFiguresFilter,
        initialFilter: initialFiguresFilter,
        setFilter: setFiguresFilter,
    } = figuresFilterState;

    const floatingButtonVisibility = useCallback(
        (scroll: number) => scroll >= 80 && !showSidebar,
        [showSidebar],
    );

    const appliedFiltersCount = mapToList(
        figuresFilter,
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
                        filterState={figuresFilterState.rawFilter}
                    />
                    <CrisesTable
                        className={styles.container}
                        figuresFilter={figuresFilter}
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
                        currentFilter={rawFiguresFilter}
                        initialFilter={initialFiguresFilter}
                        onFilterChange={setFiguresFilter}
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
