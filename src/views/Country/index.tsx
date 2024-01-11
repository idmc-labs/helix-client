import React, { useMemo, useCallback, useEffect, useState } from 'react';
import produce from 'immer';
import { useParams, useHistory } from 'react-router-dom';
import {
    _cs,
    isDefined,
} from '@togglecorp/fujs';
import Map, {
    MapContainer,
    MapBounds,
    MapSource,
    MapLayer,
} from '@togglecorp/re-map';
import { Button, Portal } from '@togglecorp/toggle-ui';
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
    ExtractionFormOptionsQuery,
} from '#generated/types';

import { EnumEntity, PurgeNull } from '#types';
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
import { expandObject } from '#utils/common';

import CrisesEventsEntriesFiguresTable from './CrisesEventsEntriesFiguresTable';
import ContextualAnalysis from './ContextualAnalysis';
import CountrySummary from './CountrySummary';
import styles from './styles.css';
import useSidebarLayout from '#hooks/useSidebarLayout';
import NdChart from './NdChart';
import IdpChart from './IdpChart';
import FilterOutput from '#components/FilterOutput';

type Bounds = [number, number, number, number];

const FORM_OPTIONS = gql`
    query ExtractionFormOptions {
        figureCategoryList: __type(name: "FIGURE_CATEGORY_TYPES") {
            name
            enumValues {
                name
                description
            }
        }
        figureTermList: __type(name: "FIGURE_TERMS") {
            name
            enumValues {
                name
                description
            }
        }
        figureRoleList: __type(name: "ROLE") {
            name
            enumValues {
                name
                description
            }
        }
        crisisType: __type(name: "CRISIS_TYPE") {
            name
            enumValues {
                name
                description
            }
        }
        figureReviewStatus: __type(name: "FIGURE_REVIEW_STATUS") {
            name
            enumValues {
                name
                description
            }
        }
        violenceList {
            results {
                id
                name
                subTypes {
                    results {
                        id
                        name
                    }
                }
            }
        }
        contextOfViolenceList {
            results {
              id
              name
            }
        }
        disasterCategoryList {
            results {
                id
                name
                subCategories {
                    results {
                        id
                        name
                        types {
                            results {
                                id
                                name
                                subTypes {
                                    results {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
`;

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
            iso2
            geojsonUrl
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

const enumKeySelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.name
);
const enumLabelSelector = <T extends string | number>(d: EnumEntity<T>) => (
    d.description ?? String(d.name)
);

const lightStyle = 'mapbox://styles/togglecorp/cl50rwy0a002d14mo6w9zprio';

const countryFillPaint: mapboxgl.FillPaint = {
    'fill-color': '#354052', // empty color
    'fill-opacity': 0.2,
};

const countryLinePaint: mapboxgl.LinePaint = {
    'line-color': '#334053',
    'line-width': 1,
};

interface FloatingButtonProps {
    onClick: () => void,
}

// FIXME: create a separate general component
function FloatingButton(props: FloatingButtonProps) {
    const { onClick } = props;
    const [scroll, setScroll] = useState<number>(
        document.querySelectorAll('[data-multiplexer-content]')[0]?.scrollTop ?? 0,
    );

    const handleDocumentScroll = useCallback(
        (e: Event) => {
            if (e.target instanceof HTMLElement) {
                const isMultiplexerContent = e.target.getAttribute('data-multiplexer-content');

                if (isMultiplexerContent) {
                    setScroll(e.target.scrollTop);
                }
            }
        },
        [],
    );

    useEffect(
        () => {
            document.addEventListener('scroll', handleDocumentScroll, true);

            return () => {
                document.removeEventListener('scroll', handleDocumentScroll, true);
            };
        },
        [handleDocumentScroll],
    );

    return (
        <Portal>
            <Button
                className={_cs(styles.floatingButton, scroll < 80 && styles.hidden)}
                name={undefined}
                onClick={onClick}
                icons={<IoFilterOutline />}
                variant="primary"
            >
                Filters
            </Button>
        </Portal>
    );
}

interface CountryProps {
    className?: string;
}

function Country(props: CountryProps) {
    const { className } = props;

    const { countryId } = useParams<{ countryId: string }>();
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

    const [, setCountryOptions] = useOptions('country');
    const [eventOptions] = useOptions('event');

    const {
        data: filterOptions,
        loading: queryOptionsLoading,
        error: queryOptionsError,
    } = useQuery<ExtractionFormOptionsQuery>(FORM_OPTIONS);

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
                    iso2,
                } = response.country;
                // NOTE: we are setting this options so that we can use country
                // option when adding crisis/event on the country page
                setCountryOptions([{ id, idmcShortName, iso2, boundingBox }]);
            }
        },
    });

    const {
        data: countryAggregations,
        // TODO: Handle error and loading states
        // loading: countryAggregationsLoading,
        // error: countryAggregationsError,
    } = useQuery<CountryAggregationsQuery>(COUNTRY_AGGREGATIONS, {
        variables: countryAggregationsVariables,
        skip: !countryAggregationsVariables,
    });

    const loading = countryDataLoading;
    const errored = !!countryDataLoadingError;
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

    const {
        showSidebar,
        containerClassName,
        sidebarClassName,
        sidebarSpaceReserverElement,
        setShowSidebarTrue,
        setShowSidebarFalse,
    } = useSidebarLayout();

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
                            Filters
                        </Button>
                    )}
                />
                <div className={styles.mainContent}>
                    <div className={styles.filterOutputs}>
                        <FilterOutput
                            label="Date from"
                            options={[]}
                            value={rawFiguresFilter.filterFigureStartAfter}
                            keySelector={enumKeySelector}
                            labelSelector={() => rawFiguresFilter.filterFigureStartAfter}
                        />
                        <FilterOutput
                            label="Date to"
                            options={[]}
                            value={rawFiguresFilter.filterFigureEndBefore}
                            keySelector={enumKeySelector}
                            labelSelector={() => rawFiguresFilter.filterFigureEndBefore}
                        />
                        <FilterOutput
                            label="Causes"
                            options={filterOptions?.crisisType?.enumValues}
                            value={rawFiguresFilter.filterFigureCrisisTypes}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            multi
                        />
                        <FilterOutput
                            label="Terms"
                            options={filterOptions?.figureTermList?.enumValues}
                            value={rawFiguresFilter.filterFigureTerms}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            multi
                        />
                        <FilterOutput
                            label="Roles"
                            options={filterOptions?.figureRoleList?.enumValues}
                            value={rawFiguresFilter.filterFigureRoles}
                            keySelector={enumKeySelector}
                            labelSelector={enumLabelSelector}
                            multi
                        />
                        <FilterOutput
                            label="Events"
                            options={eventOptions}
                            value={rawFiguresFilter.filterFigureEvents}
                            keySelector={(d) => d.id}
                            labelSelector={(d) => d.name}
                            multi
                        />
                    </div>
                    <Map
                        mapStyle={lightStyle}
                        mapOptions={{
                            logoPosition: 'bottom-left',
                        }}
                        scaleControlShown
                        navControlShown
                    >
                        <MapContainer className={styles.mapContainer} />
                        <MapBounds
                            bounds={bounds as Bounds | undefined}
                            padding={50}
                        />
                        {countryData?.country?.geojsonUrl && (
                            <MapSource
                                sourceKey="country"
                                sourceOptions={{
                                    type: 'geojson',
                                }}
                                geoJson={countryData.country.geojsonUrl}
                            >
                                <MapLayer
                                    layerKey="country-fill"
                                    layerOptions={{
                                        type: 'fill',
                                        paint: countryFillPaint,
                                    }}
                                />
                                <MapLayer
                                    layerKey="country-line"
                                    layerOptions={{
                                        type: 'line',
                                        paint: countryLinePaint,
                                    }}
                                />
                            </MapSource>
                        )}
                    </Map>
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
            {!showSidebar && (
                <FloatingButton
                    onClick={setShowSidebarTrue}
                />
            )}
        </div>
    );
}

export default Country;
