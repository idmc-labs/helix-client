import React, { useState, useMemo, useCallback } from 'react';
import { gql, useQuery, useLazyQuery } from '@apollo/client';
import produce from 'immer';
import {
    IoMdGlobe,
    IoMdSearch,
} from 'react-icons/io';
import Map, {
    MapContainer,
    MapBounds,
    MapLayer,
    MapSource,
} from '@togglecorp/re-map';
import {
    TextInput,
    SelectInput,
    RawButton,
} from '@togglecorp/toggle-ui';
import { _cs } from '@togglecorp/fujs';

import Loading from '#components/Loading';
import {
    LookupQuery,
    LookupQueryVariables,
    ReverseLookupQuery,
} from '#generated/types';
import useDebouncedValue from '#hooks/useDebouncedValue';

import styles from './styles.css';

type LookupData = NonNullable<NonNullable<LookupQuery['lookup']>['results']>[0]

type Bounds = [number, number, number, number];

interface MovedPoint {
    id: string | number | undefined;
    point: [number, number];
}

interface Country {
    iso: string;
    name: string;
    boundingBox: Bounds;
}

interface Dragging {
    id: string | number | undefined;
    layerName: string;
    // NOTE: may not need to use these two below
    sourceName: string;
}

const LOOKUP = gql`
    query Lookup($name: String!, $country: String!) {
        lookup(name: $name, country: $country) @rest(type: "OsmNames", path: "/:country/q/:name") {
            count
            nextIndex
            startIndex
            totalResults
            results {
              wikipedia
              rank
              country
              street
              wikidata
              country_code
              osm_id
              housenumbers
              id
              city
              display_name
              lon
              state
              boundingbox
              type
              importance
              lat
              class
              name
              country
              name_suffix
              osm_type
              place_rank
              alternative_names
            }
        }
    }
`;

const REVERSE_LOOKUP = gql`
    query ReverseLookup($lat: Float!, $lng: Float!) {
        reverseLookup(lat: $lat, lng: $lng) @rest(type: "OsmNames", path: "/r/:lng/:lat") {
            count
            nextIndex
            startIndex
            totalResults
            results {
              wikipedia
              rank
              country
              street
              wikidata
              country_code
              osm_id
              housenumbers
              id
              city
              display_name
              lon
              state
              boundingbox
              type
              importance
              lat
              class
              name
              country
              name_suffix
              osm_type
              place_rank
              alternative_names
            }
        }
    }
`;

type LocationGeoJson = GeoJSON.FeatureCollection<GeoJSON.Point, LookupData>;

const keySelector = (item: Country) => item.iso;

const labelSelector = (item: Country) => item.name;

const lightStyle = 'mapbox://styles/mapbox/light-v10';

const locationsSourceOptions: mapboxgl.GeoJSONSourceRaw = {
    type: 'geojson',
};

const pointCirclePaint: mapboxgl.CirclePaint = {
    'circle-color': 'red',
    'circle-radius': 12,
    'circle-opacity': 0.5,
    'circle-pitch-alignment': 'map',
};
const pointLabelPaint: mapboxgl.SymbolPaint = {
    'text-color': '#6b6b6b',
    'text-halo-color': 'rgba(255, 255, 255, 0.7)',
    'text-halo-width': 2,
};
const pointLabelLayout: mapboxgl.SymbolLayout = {
    'text-field': ['get', 'name'],
    'text-size': 14,
    'text-justify': 'center',
    'text-anchor': 'center',
};

// TODO: set fit to country
// TODO: set fit to current selections
// TODO: show on hover
// TODO: show migration lines
// TODO: set information of selected points
// TODO: disabled and read-only mode
interface LookupItemProps {
    item: LookupData;
    onMouseEnter: (item: LookupData) => void;
    onMouseLeave: () => void;
    onClick: (item: LookupData) => void;
}

function LookupItem(props: LookupItemProps) {
    const {
        item,
        onMouseLeave,
        onMouseEnter,
        onClick,
    } = props;

    const handleMouseEnter = useCallback(
        () => {
            onMouseEnter(item);
        },
        [item, onMouseEnter],
    );
    const handleClick = useCallback(
        () => {
            onClick(item);
        },
        [item, onClick],
    );

    return (
        <RawButton
            name={item.id}
            className={styles.item}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={handleClick}
        >
            <div>
                {item.name}
            </div>
            <div className={styles.description}>
                {item.display_name}
            </div>
        </RawButton>
    );
}

export interface GeoInputProps {
    value: LocationGeoJson['features'] | null | undefined;
    onChange: (value: LocationGeoJson['features']) => void;
    countries: Country[];
    className?: string,
    disabled?: boolean;
    readOnly?: boolean;
}

const emptyList: unknown[] = [];

function GeoInput(props: GeoInputProps) {
    const {
        value: valueFromProps,
        onChange,
        className,
        countries,
        readOnly,
        disabled,
    } = props;

    const value = valueFromProps ?? (emptyList as LocationGeoJson['features']);

    const [search, setSearch] = useState<string | undefined>();
    const [country, setCountry] = useState<string>(countries[0]?.iso);

    const geo = useMemo(
        (): LocationGeoJson => ({
            type: 'FeatureCollection',
            features: value,
        }),
        [value],
    );

    const currentCountry = useMemo(
        () => countries.find((item) => item.iso === country),
        [countries, country],
    );
    const defaultBounds = currentCountry?.boundingBox;

    const [bounds, setBounds] = useState<Bounds | undefined>();
    const [movedPoint, setMovedPoint] = useState<MovedPoint | undefined>();

    const debouncedValue = useDebouncedValue(search);

    const variables = useMemo(
        (): LookupQueryVariables | undefined => (
            !debouncedValue ? undefined : { name: debouncedValue, country }
        ),
        [debouncedValue, country],
    );

    const {
        data,
        loading,
    } = useQuery<LookupQuery>(LOOKUP, { variables, skip: !search });

    const [
        getReverseLookup,
        { loading: loadingReverse },
    ] = useLazyQuery<ReverseLookupQuery>(REVERSE_LOOKUP, {
        onCompleted: (response) => {
            if (!movedPoint) {
                return;
            }

            const properties = response?.reverseLookup?.results?.[0];
            if (!properties) {
                setMovedPoint(undefined);
                return;
            }
            const newValue = produce(
                value,
                (safeValue) => {
                    const index = safeValue.findIndex(
                        (item) => item.id === movedPoint.id,
                    );
                    if (index !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        safeValue[index].geometry.coordinates = movedPoint.point;
                        // eslint-disable-next-line no-param-reassign
                        safeValue[index].properties = properties;
                    }
                },
            );
            onChange(newValue);

            setMovedPoint(undefined);
        },
        onError: () => {
            console.error('Could not move point');
            setMovedPoint(undefined);
        },
    });

    const handleDrag = useCallback(
        (
            feature: Dragging,
            lngLat: mapboxgl.LngLat,
            _: unknown,
            map: mapboxgl.Map,
        ) => {
            const newLocationsGeoJson = produce(
                geo,
                (safeGeoJson) => {
                    const index = safeGeoJson.features.findIndex(
                        (item) => item.id === feature.id,
                    );
                    if (index !== -1) {
                        // eslint-disable-next-line no-param-reassign
                        safeGeoJson.features[index].geometry.coordinates = [
                            lngLat.lng,
                            lngLat.lat,
                        ];
                    }
                },
            );
            const source = map.getSource(feature.sourceName);
            if (source.type === 'geojson') {
                source.setData(newLocationsGeoJson);
            }
        },
        [geo],
    );

    const handleDragEnd = useCallback(
        (
            feature: Dragging,
            lngLat: mapboxgl.LngLat,
        ) => {
            setMovedPoint({
                id: feature.id,
                point: [lngLat.lng, lngLat.lat],
            });
            getReverseLookup({
                variables: {
                    lng: lngLat.lng,
                    lat: lngLat.lat,
                },
            });
        },
        [getReverseLookup],
    );

    const handleMouseEnter = useCallback(
        (item: LookupData) => {
            setBounds(item.boundingbox as Bounds);
        },
        [],
    );

    const handleMouseLeave = useCallback(
        () => {
            setBounds(undefined);
        },
        [],
    );

    const handleClick = useCallback(
        (item: LookupData) => {
            const newGeo: LocationGeoJson['features'] = [
                ...value,
                {
                    id: (value?.length ?? 0) + 1,
                    type: 'Feature',
                    properties: item,
                    geometry: {
                        type: 'Point',
                        coordinates: [item.lon, item.lat],
                    },
                },
            ];
            onChange(newGeo);
            setSearch(undefined);
            setBounds(undefined);
        },
        [onChange, value],
    );

    const inputDisabled = readOnly || loadingReverse || disabled;

    return (
        <div className={_cs(styles.comp, className)}>
            {!readOnly && (
                <div className={styles.search}>
                    <div className={styles.filter}>
                        <p> This is a work in progress! </p>
                        <SelectInput
                            className={styles.input}
                            options={countries}
                            keySelector={keySelector}
                            labelSelector={labelSelector}
                            name="country"
                            value={country}
                            onChange={setCountry}
                            nonClearable
                            icons={(
                                <IoMdGlobe />
                            )}
                            disabled={inputDisabled}
                        />
                        <TextInput
                            className={styles.input}
                            name="search"
                            value={search}
                            onChange={setSearch}
                            placeholder="Search"
                            icons={(
                                <IoMdSearch />
                            )}
                            disabled={inputDisabled}
                        />
                    </div>
                    <div className={styles.result}>
                        {data?.lookup?.results?.map((item) => (
                            <LookupItem
                                key={item.id}
                                item={item}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                onClick={handleClick}
                            />
                        ))}
                        {loading && <Loading /> }
                    </div>
                </div>
            )}
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
                    bounds={bounds ?? defaultBounds}
                    padding={10}
                />
                <MapSource
                    sourceKey="locations"
                    sourceOptions={locationsSourceOptions}
                    geoJson={geo}
                >
                    <MapLayer
                        onDrag={inputDisabled || readOnly ? undefined : handleDrag}
                        onDragEnd={inputDisabled || readOnly ? undefined : handleDragEnd}
                        layerKey="locations-circle"
                        layerOptions={{
                            type: 'circle',
                            paint: pointCirclePaint,
                        }}
                    />
                    <MapLayer
                        layerKey="locations-text"
                        layerOptions={{
                            type: 'symbol',
                            paint: pointLabelPaint,
                            layout: pointLabelLayout,
                        }}
                    />
                </MapSource>
            </Map>
        </div>
    );
}

export default GeoInput;
