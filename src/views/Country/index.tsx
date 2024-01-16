import React, { useMemo, useCallback } from 'react';
import produce from 'immer';
import { useParams, useHistory } from 'react-router-dom';
import { _cs, isDefined, mapToList } from '@togglecorp/fujs';
import { Button } from '@togglecorp/toggle-ui';
import { IoFilterOutline, IoClose } from 'react-icons/io5';
import {
    gql,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';

import {
    CountryQuery,
    CountryQueryVariables,
    CountryAggregationsQuery,
    CountryAggregationsQueryVariables,
    CreateSummaryMutation,
    CreateContextualAnalysisMutation,
    ExtractionEntryListFiltersQueryVariables,
} from '#generated/types';
import { PurgeNull } from '#types';
import useFilterState from '#hooks/useFilterState';
import useBasicToggle from '#hooks/useBasicToggle';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/lists/MyResources';
import CountrySelectInput from '#components/selections/CountrySelectInput';
import useOptions from '#hooks/useOptions';
import AdvancedFiguresFilter from '#components/rawTables/useFigureTable/AdvancedFiguresFilter';
import FiguresFilterOutput from '#components/rawTables/useFigureTable/FiguresFilterOutput';
import { expandObject, hasNoData } from '#utils/common';
import useSidebarLayout from '#hooks/useSidebarLayout';
import NdChart from '#components/NdChart';
import IdpChart from '#components/IdpChart';
import FloatingButton from '#components/FloatingButton';
import CountriesMap, { Bounds } from '#components/CountriesMap';

import CrisesEventsEntriesFiguresTable from './CrisesEventsEntriesFiguresTable';
import ContextualAnalysis from './ContextualAnalysis';
import CountrySummary from './CountrySummary';
import styles from './styles.css';

const COUNTRY = gql`
    query Country($id: ID!) {
        country(id: $id) {
            lastContextualAnalysis {
                id
                update
                createdAt
                publishDate
                crisisType
                crisisTypeDisplay
            }
            id
            idmcShortName
            lastSummary {
                id
                summary
            }
            boundingBox
            geojsonUrl
            iso2
        }
    }
`;

const COUNTRY_AGGREGATIONS = gql`
    query CountryAggregations($filters: FigureExtractionFilterDataInputType!) {
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

interface CountryProps {
    className?: string;
}

function Country(props: CountryProps) {
    const { className } = props;

    const { countryId } = useParams<{ countryId: string }>();
    const [, setCountryOptions] = useOptions('country');

    const { replace: historyReplace } = useHistory();

    const [
        contextualFormOpened,
        handleContextualFormOpen,
        handleContextualFormClose,
    ] = useBasicToggle();

    const [
        summaryFormOpened,
        handleSummaryFormOpen,
        handleSummaryFormClose,
    ] = useBasicToggle();

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

    const countryVariables = useMemo(
        (): CountryQueryVariables | undefined => ({ id: countryId }),
        [countryId],
    );

    const countryAggregationsVariables = useMemo(
        (): CountryAggregationsQueryVariables | undefined => ({
            filters: expandObject(
                figuresFilter,
                {
                    filterFigureCountries: [countryId],
                },
            ),
        }),
        [countryId, figuresFilter],
    );

    const {
        data: countryData,
        loading: countryDataLoading,
        error: countryDataLoadingError,
    } = useQuery<CountryQuery>(COUNTRY, {
        variables: countryVariables,
        skip: !countryVariables,
        onCompleted: (response) => {
            if (response.country) {
                const {
                    id,
                    idmcShortName,
                    boundingBox,
                    geojsonUrl,
                    iso2,
                } = response.country;
                // NOTE: we are setting this options so that we can use country
                // option when adding crisis/event on the country page
                setCountryOptions([{ id, idmcShortName, iso2, boundingBox, geojsonUrl }]);
            }
        },
    });

    const {
        data: countryAggregations,
        loading: countryAggregationsLoading,
        error: countryAggregationsError,
    } = useQuery<CountryAggregationsQuery>(COUNTRY_AGGREGATIONS, {
        variables: countryAggregationsVariables,
        skip: !countryAggregationsVariables,
    });

    const loading = countryDataLoading || countryAggregationsLoading;
    const errored = !!countryDataLoadingError || !!countryAggregationsError;
    const disabled = loading || errored;

    const handleCountryChange = useCallback(
        (value?: string) => {
            if (isDefined(value)) {
                const countryRoute = reverseRoute(route.country.path, { countryId: value });
                historyReplace(countryRoute);
            } else {
                const countriesRoute = reverseRoute(route.countries.path);
                historyReplace(countriesRoute);
            }
        },
        [historyReplace],
    );

    const handleAddNewSummary: MutationUpdaterFn<
        CreateSummaryMutation
    > = useCallback(
        (cache, data) => {
            const summary = data?.data?.createSummary?.result;
            if (!summary) {
                return;
            }

            const cacheData = cache.readQuery<CountryQuery>({
                query: COUNTRY,
                variables: countryVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.country) {
                    return;
                }
                // eslint-disable-next-line no-param-reassign
                safeCacheData.country.lastSummary = summary;
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: COUNTRY,
                data: updatedValue,
                variables: countryVariables,
            });
        },
        [countryVariables],
    );

    const handleAddNewContextualAnalysis: MutationUpdaterFn<
        CreateContextualAnalysisMutation
    > = useCallback(
        (cache, data) => {
            const contextualAnalysis = data?.data?.createContextualAnalysis?.result;
            if (!contextualAnalysis) {
                return;
            }

            const cacheData = cache.readQuery<CountryQuery>({
                query: COUNTRY,
                variables: countryVariables,
            });

            const updatedValue = produce(cacheData, (safeCacheData) => {
                if (!safeCacheData?.country) {
                    return;
                }
                // eslint-disable-next-line no-param-reassign
                safeCacheData.country.lastContextualAnalysis = contextualAnalysis;
            });

            if (updatedValue === cacheData) {
                return;
            }

            cache.writeQuery({
                query: COUNTRY,
                data: updatedValue,
                variables: countryVariables,
            });
        },
        [countryVariables],
    );

    const figureHiddenColumns = ['country' as const];

    const bounds = countryData?.country?.boundingBox ?? undefined;
    const countries = useMemo(
        () => [countryData?.country].filter(isDefined),
        [countryData],
    );

    const {
        showSidebar,
        containerClassName,
        sidebarClassName,
        sidebarSpaceReserverElement,
        setShowSidebarTrue,
        setShowSidebarFalse,
    } = useSidebarLayout();

    const floatingButtonVisibility = useCallback(
        (scroll: number) => scroll >= 80 && !showSidebar,
        [showSidebar],
    );

    const appliedFiltersCount = mapToList(
        figuresFilter,
        (item) => !hasNoData(item),
    ).filter(Boolean).length;

    return (
        <div className={_cs(styles.countries, containerClassName, className)}>
            {sidebarSpaceReserverElement}
            <div className={styles.pageContent}>
                <PageHeader
                    title={(
                        <CountrySelectInput
                            name="country"
                            value={countryId}
                            onChange={handleCountryChange}
                            placeholder="Select a country"
                            nonClearable
                        />
                    )}
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
                    <Container
                        className={styles.mapSection}
                        compact
                    >
                        <CountriesMap
                            className={styles.mapContainer}
                            bounds={bounds as Bounds | undefined}
                            countries={countries}
                        />
                    </Container>
                    <div className={styles.charts}>
                        <NdChart
                            conflictData={
                                countryAggregations
                                    ?.figureAggregations
                                    ?.ndsConflictFigures
                            }
                            disasterData={
                                countryAggregations
                                    ?.figureAggregations
                                    ?.ndsDisasterFigures
                            }
                        />
                        <IdpChart
                            conflictData={
                                countryAggregations
                                    ?.figureAggregations
                                    ?.idpsConflictFigures
                            }
                            disasterData={
                                countryAggregations
                                    ?.figureAggregations
                                    ?.idpsDisasterFigures
                            }
                        />
                    </div>
                    <CrisesEventsEntriesFiguresTable
                        className={styles.eventsEntriesFiguresTable}
                        countryId={countryId}
                        figuresFilterState={figuresFilterState}
                    />
                    <Container
                        className={styles.overview}
                    >
                        <CountrySummary
                            summary={countryData?.country?.lastSummary}
                            disabled={disabled}
                            countryId={countryId}
                            onAddNewSummaryInCache={handleAddNewSummary}
                            summaryFormOpened={summaryFormOpened}
                            onSummaryFormOpen={handleSummaryFormOpen}
                            onSummaryFormClose={handleSummaryFormClose}
                        />
                        <ContextualAnalysis
                            contextualAnalysis={countryData?.country?.lastContextualAnalysis}
                            disabled={disabled}
                            contextualFormOpened={contextualFormOpened}
                            handleContextualFormOpen={handleContextualFormOpen}
                            handleContextualFormClose={handleContextualFormClose}
                            countryId={countryId}
                            onAddNewContextualAnalysisInCache={handleAddNewContextualAnalysis}
                        />
                    </Container>
                    <MyResources
                        className={styles.resources}
                        country={countryId}
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
                        countries={[countryId]}
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

export default Country;
