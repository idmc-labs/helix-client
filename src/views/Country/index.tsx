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

import {
    gql,
    useQuery,
    MutationUpdaterFn,
} from '@apollo/client';
import {
    CountryQuery,
    CountryQueryVariables,
    CreateSummaryMutation,
    CreateContextualAnalysisMutation,
} from '#generated/types';

import useBasicToggle from '#hooks/useBasicToggle';
import { reverseRoute } from '#hooks/useRouteMatching';
import route from '#config/routes';

import NumberBlock from '#components/NumberBlock';
import Container from '#components/Container';
import PageHeader from '#components/PageHeader';
import MyResources from '#components/lists/MyResources';
import EventsEntriesFiguresTable from '#components/tables/EventsEntriesFiguresTable';
import CountrySelectInput from '#components/selections/CountrySelectInput';

import useOptions from '#hooks/useOptions';
import ContextualAnalysis from './ContextualAnalysis';
import CountrySummary from './CountrySummary';
import styles from './styles.css';

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
            eventsConflict: events(eventTypes: ["CONFLICT"]) {
                totalCount
            }
            eventsDisaster: events(eventTypes: ["DISASTER"]) {
                totalCount
            }
            crisesConflict: crises(crisisTypes: ["CONFLICT"]) {
                totalCount
            }
            crisesDisaster: crises(crisisTypes: ["DISASTER"]) {
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

    const [countryOptions, setCountryOptions] = useOptions('country');

    const currentCountryOption = countryOptions?.find((country) => country.id === countryId);

    const countryVariables = useMemo(
        (): CountryQueryVariables | undefined => ({ id: countryId }),
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
                const { id, idmcShortName } = response.country;
                setCountryOptions([{ id, idmcShortName }]);
            }
        },
    });

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

    return (
        <div className={_cs(className, styles.countries)}>
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
            />
            <div className={styles.content}>
                <div className={styles.leftContent}>
                    <div className={styles.top}>
                        <Container
                            className={styles.extraLargeContainer}
                            contentClassName={styles.idpMap}
                            heading="Details"
                        >
                            <div className={styles.stats}>
                                <NumberBlock
                                    label={(
                                        <>
                                            Internal Displacements
                                            <br />
                                            {`(Conflict ${year})`}
                                        </>
                                    )}
                                    value={countryData?.country?.totalFlowConflict}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            Internal Displacements
                                            <br />
                                            {`(Disaster ${year})`}
                                        </>
                                    )}
                                    value={countryData?.country?.totalFlowDisaster}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of IDPs
                                            <br />
                                            {`(Conflict ${year})`}
                                        </>
                                    )}
                                    value={countryData?.country?.totalStockConflict}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of IDPs
                                            <br />
                                            {`(Disaster ${year})`}
                                        </>
                                    )}
                                    value={countryData?.country?.totalStockDisaster}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of Crises
                                            <br />
                                            (Conflict)
                                        </>
                                    )}
                                    value={countryData?.country?.crisesConflict?.totalCount}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of Crises
                                            <br />
                                            (Disaster)
                                        </>
                                    )}
                                    value={countryData?.country?.crisesDisaster?.totalCount}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of Events
                                            <br />
                                            (Conflict)
                                        </>
                                    )}
                                    value={countryData?.country?.eventsConflict?.totalCount}
                                />
                                <NumberBlock
                                    label={(
                                        <>
                                            No. of Events
                                            <br />
                                            (Disaster)
                                        </>
                                    )}
                                    value={countryData?.country?.eventsDisaster?.totalCount}
                                />
                                <NumberBlock
                                    label="Entries"
                                    value={countryData?.country?.entries?.totalCount}
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
                        </Container>
                    </div>
                    <div className={styles.middle}>
                        <CountrySummary
                            className={styles.container}
                            summary={countryData?.country?.lastSummary}
                            disabled={disabled}
                            countryId={countryId}
                            onAddNewSummaryInCache={handleAddNewSummary}
                            summaryFormOpened={summaryFormOpened}
                            onSummaryFormOpen={handleSummaryFormOpen}
                            onSummaryFormClose={handleSummaryFormClose}
                        />
                    </div>
                </div>
                <div className={styles.sideContent}>
                    <ContextualAnalysis
                        className={styles.container}
                        contextualAnalysis={countryData?.country?.lastContextualAnalysis}
                        disabled={disabled}
                        contextualFormOpened={contextualFormOpened}
                        handleContextualFormOpen={handleContextualFormOpen}
                        handleContextualFormClose={handleContextualFormClose}
                        countryId={countryId}
                        onAddNewContextualAnalysisInCache={handleAddNewContextualAnalysis}
                    />
                    <MyResources
                        className={styles.container}
                        country={currentCountryOption}
                    />
                </div>
            </div>
            <div className={styles.fullWidth}>
                <EventsEntriesFiguresTable
                    className={styles.largeContainer}
                    // FIXME: we should not use this
                    country={(
                        countryData?.country
                        ?? { id: countryId, idmcShortName: '???' }
                    )}
                />
            </div>
        </div>
    );
}

export default Country;
