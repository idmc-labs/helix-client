import React, { useMemo, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { _cs, isDefined, mapToList } from '@togglecorp/fujs';
import { Button, Modal } from '@togglecorp/toggle-ui';
import { IoFilterOutline, IoClose } from 'react-icons/io5';
import {
    gql,
    useQuery,
} from '@apollo/client';

import {
    CrisisQuery,
    CrisisQueryVariables,
    CrisisAggregationsQuery,
    CrisisAggregationsQueryVariables,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
import { PurgeNull } from '#types';
import useFilterState from '#hooks/useFilterState';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import useOptions from '#hooks/useOptions';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import { expandObject, mergeBbox, hasNoData, getNow } from '#utils/common';
import useSidebarLayout from '#hooks/useSidebarLayout';
import NdChart from '#components/NdChart';
import IdpChart from '#components/IdpChart';
import FloatingButton from '#components/FloatingButton';
import CountriesMap, { Bounds } from '#components/CountriesMap';
import { MarkdownPreview } from '#components/MarkdownEditor';
import DomainContext from '#components/DomainContext';
import TextBlock from '#components/TextBlock';
import SmartLink from '#components/SmartLink';
import CrisisForm from '#components/forms/CrisisForm';
import useModalState from '#hooks/useModalState';
import Message from '#components/Message';
import route from '#config/routes';
import useCombinedChartData from '#hooks/useCombinedChartData';

import CountriesEventsEntriesFiguresTable from './CountriesEventsEntriesFiguresTable';
import styles from './styles.css';

const CRISIS = gql`
    query Crisis($id: ID!) {
        crisis(id: $id) {
            countries {
                id
                idmcShortName
                boundingBox
                geojsonUrl
            }
            crisisNarrative
            crisisType
            crisisTypeDisplay
            endDate
            id
            name
            startDate
        }
    }
`;

const CRISIS_AGGREGATIONS = gql`
    query CrisisAggregations($filters: FigureExtractionFilterDataInputType!) {
        figureAggregations(filters: $filters) {
            idpsConflictFigures {
                date
                value
            }
            idpsDisasterFigures {
                date
                value
            }
            ndsConflictFigures {
                date
                value
            }
            ndsDisasterFigures {
                date
                value
            }
        }
    }
`;

const now = getNow();

interface CrisisProps {
    className?: string;
}

function Crisis(props: CrisisProps) {
    const { className } = props;

    const { crisisId } = useParams<{ crisisId: string }>();
    const { user } = useContext(DomainContext);
    const [, setCrisisOptions] = useOptions('crisis');

    const [
        shouldShowAddCrisisModal,
        editableCrisisId,
        showAddCrisisModal,
        hideAddCrisisModal,
    ] = useModalState();

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

    const crisisVariables = useMemo(
        (): CrisisQueryVariables => ({ id: crisisId }),
        [crisisId],
    );

    const crisisAggregationsVariables = useMemo(
        (): CrisisAggregationsQueryVariables | undefined => ({
            filters: expandObject(
                figuresFilter,
                {
                    filterFigureCrises: [crisisId],
                },
            ),
        }),
        [crisisId, figuresFilter],
    );

    const {
        data: crisisData,
        loading: crisisDataLoading,
        // error: crisisDataLoadingError,
    } = useQuery<CrisisQuery, CrisisQueryVariables>(CRISIS, {
        variables: crisisVariables,
        onCompleted: (response) => {
            const { crisis: crisisRes } = response;
            if (!crisisRes) {
                return;
            }
            // NOTE: we are setting this options so that we can use crisis
            // option when adding event on the crisis page
            const { id, name } = crisisRes;
            setCrisisOptions([{ id, name }]);
        },
    });

    const {
        data: crisisAggregations,
        loading: crisisAggregationsLoading,
        // error: crisisAggregationsError,
    } = useQuery<CrisisAggregationsQuery>(CRISIS_AGGREGATIONS, {
        variables: crisisAggregationsVariables,
        skip: !crisisAggregationsVariables,
    });

    const loading = crisisDataLoading || crisisAggregationsLoading;
    // const errored = !!crisisDataLoadingError || !!crisisAggregationsError;
    // const disabled = loading || errored;

    const figureHiddenColumns = ['crisis' as const];

    const crisisPermissions = user?.permissions?.crisis;

    const crisisYear = new Date(
        crisisData?.crisis?.endDate ?? crisisData?.crisis?.startDate ?? now,
    ).getFullYear();

    const bounds = mergeBbox(
        crisisData?.crisis?.countries
            ?.map((country) => country.boundingBox as (GeoJSON.BBox | null | undefined))
            .filter(isDefined),
    );
    const countries = crisisData?.crisis?.countries;

    const {
        showSidebar,
        containerClassName,
        sidebarClassName,
        sidebarSpaceReserverElement,
        setShowSidebarTrue,
        setShowSidebarFalse,
    } = useSidebarLayout();

    const {
        getAxisTicksX,
        chartDomainX,
        combinedNdsData,
        combinedIdpsData,
        temporalResolution,
        setTemporalResolution,
        chartTemporalDomain,
        numAxisPointsX,
    } = useCombinedChartData({
        ndsConflictData: crisisAggregations?.figureAggregations?.ndsConflictFigures,
        ndsDisasterData: crisisAggregations?.figureAggregations?.ndsDisasterFigures,
        idpsConflictData: crisisAggregations?.figureAggregations?.idpsConflictFigures,
        idpsDisasterData: crisisAggregations?.figureAggregations?.idpsDisasterFigures,
    });

    const floatingButtonVisibility = useCallback(
        (scroll: number) => scroll >= 80 && !showSidebar,
        [showSidebar],
    );

    const appliedFiltersCount = mapToList(
        figuresFilter,
        (item) => !hasNoData(item),
    ).filter(Boolean).length;

    const narrative = crisisData?.crisis?.crisisNarrative;

    return (
        <div className={_cs(styles.crisis, containerClassName, className)}>
            {sidebarSpaceReserverElement}
            <div className={styles.pageContent}>
                <PageHeader
                    title={crisisData?.crisis?.name ?? 'Crisis'}
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
                    actions={crisisPermissions?.change && (
                        <Button
                            name={crisisId}
                            onClick={showAddCrisisModal}
                            disabled={loading}
                        >
                            Edit Crisis
                        </Button>
                    )}
                />
                <div className={styles.stats}>
                    <TextBlock
                        label="Cause"
                        value={crisisData?.crisis?.crisisTypeDisplay}
                    />
                    <TextBlock
                        label="Start Date"
                        value={crisisData?.crisis?.startDate}
                    />
                    <TextBlock
                        label="End Date"
                        value={crisisData?.crisis?.endDate}
                    />
                    <TextBlock
                        label="Countries"
                        value={countries?.map((country) => (
                            <SmartLink
                                key={country.id}
                                route={route.country}
                                attrs={{ countryId: country.id }}
                            >
                                {country.idmcShortName}
                            </SmartLink>
                        ))}
                    />
                </div>
                <div className={styles.mainContent}>
                    <FiguresFilterOutput
                        className={styles.filterOutputs}
                        filterState={figuresFilterState.rawFilter}
                    />
                    <Container
                        className={styles.mapSection}
                        compact
                    >
                        <CountriesMap
                            className={styles.mapContainer}
                            bounds={bounds as Bounds | undefined}
                            countries={crisisData?.crisis?.countries}
                        />
                    </Container>
                    <div className={styles.charts}>
                        <NdChart
                            combinedNdsData={combinedNdsData}
                            numAxisPointsX={numAxisPointsX}
                            chartTemporalDomain={chartTemporalDomain}
                            chartDomainX={chartDomainX}
                            getAxisTicksX={getAxisTicksX}
                            temporalResolution={temporalResolution}
                            setTemporalResolution={setTemporalResolution}
                        />
                        <IdpChart
                            combinedIdpsData={combinedIdpsData}
                            numAxisPointsX={numAxisPointsX}
                            chartTemporalDomain={chartTemporalDomain}
                            chartDomainX={chartDomainX}
                            getAxisTicksX={getAxisTicksX}
                            temporalResolution={temporalResolution}
                            setTemporalResolution={setTemporalResolution}
                        />
                    </div>
                    <CountriesEventsEntriesFiguresTable
                        className={styles.countriesEventsEntriesFiguresTable}
                        crisisId={crisisId}
                        crisisYear={crisisYear}
                        figuresFilterState={figuresFilterState}
                    />
                    <Container
                        className={styles.overview}
                    >
                        <Container
                            heading="Narrative"
                            borderless
                        >
                            {narrative ? (
                                <MarkdownPreview
                                    markdown={narrative}
                                />
                            ) : (
                                <Message
                                    message="No narrative found."
                                />
                            )}
                        </Container>
                    </Container>
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
                        crises={[crisisId]}
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
            {shouldShowAddCrisisModal && (
                <Modal
                    onClose={hideAddCrisisModal}
                    heading={editableCrisisId ? 'Edit Crisis' : 'Add Crisis'}
                    size="large"
                    freeHeight
                >
                    <CrisisForm
                        id={editableCrisisId}
                        onCrisisCreate={hideAddCrisisModal}
                        onCrisisFormCancel={hideAddCrisisModal}
                    />
                </Modal>
            )}
        </div>
    );
}

export default Crisis;
