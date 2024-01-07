import React, { useMemo, useCallback } from 'react';
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
import { Button } from '@togglecorp/toggle-ui';

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
} from '#generated/types';

import useBasicToggle from '#hooks/useBasicToggle';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';

import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/lists/MyResources';
import CountrySelectInput from '#components/selections/CountrySelectInput';
import useOptions from '#hooks/useOptions';

import CrisesEventsEntriesFiguresTable from './CrisesEventsEntriesFiguresTable';
import ContextualAnalysis from './ContextualAnalysis';
import CountrySummary from './CountrySummary';
import styles from './styles.css';
import useSidebarLayout from '#hooks/useSidebarLayout';
import NdChart from './NdChart';

type Bounds = [number, number, number, number];

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
            eventsConflict: events(filters: { eventTypes: ["CONFLICT"] }) {
                totalCount
            }
            eventsDisaster: events(filters: { eventTypes: ["DISASTER"] }) {
                totalCount
            }
            crisesConflict: crises(filters: { crisisTypes: ["CONFLICT"] }) {
                totalCount
            }
            crisesDisaster: crises(filters: { crisisTypes: ["DISASTER"] }) {
                totalCount
            }
            entries {
                totalCount
            }
            totalStockConflict
            totalStockDisaster
            totalFlowConflict
            totalFlowDisaster
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

const lightStyle = 'mapbox://styles/togglecorp/cl50rwy0a002d14mo6w9zprio';

const year = new Date().getFullYear();

const countryFillPaint: mapboxgl.FillPaint = {
    'fill-color': '#354052', // empty color
    'fill-opacity': 0.2,
};

const countryLinePaint: mapboxgl.LinePaint = {
    'line-color': '#334053',
    'line-width': 1,
};

interface CountryProps {
    className?: string;
}

function Country(props: CountryProps) {
    const { className } = props;

    const { countryId } = useParams<{ countryId: string }>();
    const { replace: historyReplace } = useHistory();

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

    const countryVariables = useMemo(
        (): CountryQueryVariables | undefined => ({ id: countryId }),
        [countryId],
    );

    const countryAggregationsVariables = useMemo(
        (): CountryAggregationsQueryVariables | undefined => ({
            filters: {
                filterFigureCountries: [countryId],
            },
        }),
        [countryId],
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
        loading: countryAggregationsLoading,
        error: countryAggregationsError,
    } = useQuery<CountryAggregationsQuery>(COUNTRY_AGGREGATIONS, {
        variables: countryAggregationsVariables,
        skip: !countryAggregationsVariables,
    });

    // FIXME: remove these later
    console.warn(countryAggregations, countryAggregationsLoading, countryAggregationsError);

    const loading = countryDataLoading;
    const errored = !!countryDataLoadingError;
    const disabled = loading || errored;

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
        <div className={_cs(styles.countries, className)}>
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
                description={(
                    <Button
                        name={undefined}
                        onClick={setShowSidebarTrue}
                        disabled={showSidebar}
                    >
                        Filters
                    </Button>
                )}
            />
            <div className={containerClassName}>
                {sidebarSpaceReserverElement}
                <div className={styles.mainContent}>
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
                    <div className={styles.stats}>
                        <NdChart
                            // eslint-disable-next-line max-len
                            conflictData={countryAggregations?.figureAggregations?.ndsConflictFigures}
                            // eslint-disable-next-line max-len
                            disasterData={countryAggregations?.figureAggregations?.ndsDisasterFigures}
                        />
                    </div>
                    <CrisesEventsEntriesFiguresTable
                        className={styles.eventsEntriesFiguresTable}
                        countryId={countryId}
                    />
                    <Container
                        className={styles.overview}
                    >
                        <CountrySummary
                            className={styles.countrySummary}
                            summary={countryData?.country?.lastSummary}
                            disabled={disabled}
                            countryId={countryId}
                            onAddNewSummaryInCache={handleAddNewSummary}
                            summaryFormOpened={summaryFormOpened}
                            onSummaryFormOpen={handleSummaryFormOpen}
                            onSummaryFormClose={handleSummaryFormClose}
                        />
                        <ContextualAnalysis
                            className={styles.contextualAnalysis}
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
                    borderless
                    className={_cs(styles.filters, sidebarClassName)}
                    heading="Filter"
                    contentClassName={styles.filtersContent}
                    headerActions={(
                        <Button
                            name={undefined}
                            onClick={setShowSidebarFalse}
                        >
                            Close
                        </Button>
                    )}
                    footerContent={<div />}
                    footerActions={(
                        <>
                            <Button
                                name={undefined}
                            >
                                Reset
                            </Button>
                            <Button
                                name={undefined}
                            >
                                Apply
                            </Button>
                        </>
                    )}
                >
                    Filters go!
                </Container>
            </div>
        </div>
    );
}

export default Country;
